"use client";

import type { Table } from "dexie";
import { db, getMeta, withRemoteApply } from "../db";
import { remoteWins, MAX_CHANGES_PER_REQUEST, type SyncChange, type SyncEntity, type SyncResponse, type SyncRow } from "./protocol";
import { listItemKey, parseListItemKey, parseSlotKey, slotKey } from "./keys";

// Local-first sync (step 7). The device is the source of truth; this pushes
// local changes and pulls everyone else's, last write wins per record.

type Row = { updatedAt?: number } & Record<string, unknown>;

type EntityDef = {
  table: () => Table<Row, unknown>;
  keyOf: (row: Row) => string;
  dbKey: (key: string) => unknown;
  include?: (row: Row) => boolean;
};

const ENTITIES: Record<SyncEntity, EntityDef> = {
  settings: { table: () => db.settings as never, keyOf: () => "local", dbKey: () => "local" },
  weeks: { table: () => db.weeks as never, keyOf: (r) => String(r.id), dbKey: (k) => k },
  slots: {
    table: () => db.slots as never,
    keyOf: (r) => slotKey(r as never),
    dbKey: (k) => parseSlotKey(k),
  },
  listItems: {
    table: () => db.listItems as never,
    keyOf: (r) => listItemKey(r as never),
    dbKey: (k) => parseListItemKey(k),
  },
  // The user's own, edited and AI-generated dishes (library dishes live in code).
  dishes: { table: () => db.dishes as never, keyOf: (r) => String(r.id), dbKey: (k) => k },
  // Only the active list pointer follows the account; other flags are per device.
  meta: {
    table: () => db.meta as never,
    keyOf: (r) => String(r.id),
    dbKey: (k) => k,
    include: (r) => r.id === "activeList",
  },
};

// Local-change notifications come from a Dexie middleware registered in db.ts
// (it must exist before the database opens).
export { onLocalChange } from "../db";

// ── Status (for the "Synced" label) ───────────────────────────────────────

export type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";
let status: SyncStatus = "idle";
const statusListeners = new Set<() => void>();

function setStatus(next: SyncStatus) {
  status = next;
  statusListeners.forEach((l) => l());
}

export const syncStatus = {
  get: () => status,
  subscribe: (l: () => void) => {
    statusListeners.add(l);
    return () => statusListeners.delete(l);
  },
};

// ── Sync ─────────────────────────────────────────────────────────────────

async function collectChanges(since: number) {
  const changes: SyncChange[] = [];
  const live = new Map<string, number>();
  for (const [entity, def] of Object.entries(ENTITIES) as [SyncEntity, EntityDef][]) {
    for (const row of await def.table().toArray()) {
      if (def.include && !def.include(row)) continue;
      const key = def.keyOf(row);
      const updatedAt = row.updatedAt ?? 0;
      live.set(`${entity}|${key}`, updatedAt);
      if (updatedAt > since) changes.push({ entity, key, data: row, updatedAt });
    }
  }
  // A deletion is only sent if nothing newer replaced the record since.
  const tombstones = await db.tombstones.toArray();
  for (const t of tombstones) {
    const liveAt = live.get(`${t.entity}|${t.key}`);
    if (liveAt === undefined || liveAt < t.deletedAt) {
      changes.push({ entity: t.entity as SyncEntity, key: t.key, data: null, updatedAt: t.deletedAt });
    }
  }
  return { changes, tombstones };
}

async function applyRows(rows: SyncRow[]) {
  if (!rows.length) return;
  await db.transaction("rw", [db.settings, db.weeks, db.slots, db.listItems, db.dishes, db.meta, db.tombstones], async () => {
      for (const row of rows) {
        const def = ENTITIES[row.entity];
        if (!def) continue;
        const table = def.table();
        const dbKey = def.dbKey(row.key);
        const [local, tomb] = await Promise.all([table.get(dbKey as never), db.tombstones.get([row.entity, row.key])]);
        if (!remoteWins(row.updatedAt, local as Row | undefined, tomb?.deletedAt)) continue;
        if (row.deleted || !row.data) await table.delete(dbKey as never);
        else await table.put(row.data as Row);
        if (tomb) await db.tombstones.delete([row.entity, row.key]);
        // Settings from the account mean this device doesn't need onboarding again.
        if (row.entity === "settings" && !row.deleted && !(await db.meta.get("onboarded"))) {
          await db.meta.put({ id: "onboarded", at: Date.now() });
        }
      }
  });
}

async function post(body: unknown): Promise<SyncResponse> {
  const res = await fetch("/api/sync", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`sync ${res.status}`);
  return res.json();
}

let running: Promise<void> | null = null;

/** Pushes local changes and pulls remote ones for the signed-in user. Safe to call often. */
export function syncNow(userId: string): Promise<void> {
  running ??= run(userId).finally(() => {
    running = null;
  });
  return running;
}

async function run(userId: string) {
  if (typeof navigator !== "undefined" && !navigator.onLine) return setStatus("offline");
  setStatus("syncing");
  try {
    const saved = await getMeta("sync");
    // A different account on this device starts from scratch.
    const cursor = saved && saved.userId === userId ? saved : { pulledVersion: 0, pushedAt: 0 };
    const startedAt = Date.now();
    const { changes, tombstones } = await collectChanges(cursor.pushedAt);
    const reports = await db.reports.filter((r) => !r.sent).toArray();

    // Push in batches; each response also carries remote rows since the cursor.
    let pulled = cursor.pulledVersion;
    let more = true;
    for (let i = 0; i < changes.length || more; i += MAX_CHANGES_PER_REQUEST) {
      const res = await post({
        since: pulled,
        changes: changes.slice(i, i + MAX_CHANGES_PER_REQUEST),
        reports: i === 0 ? reports : [],
      });
      await withRemoteApply(() => applyRows(res.rows));
      pulled = res.cursor;
      more = res.hasMore;
    }

    // Bookkeeping isn't a user change, so it doesn't schedule another sync.
    await withRemoteApply(async () => {
      // Pushed deletions are on the server now; keep any made during this sync.
      await db.tombstones.bulkDelete(
        tombstones.filter((t) => t.deletedAt <= startedAt).map((t) => [t.entity, t.key] as [string, string]),
      );
      if (reports.length) await db.reports.bulkPut(reports.map((r) => ({ ...r, sent: true })));
      await db.meta.put({ id: "sync", userId, pulledVersion: pulled, pushedAt: startedAt - 1 });
    });
    setStatus("synced");
  } catch {
    setStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error");
  }
}
