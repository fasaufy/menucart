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
  /** The table has an updatedAt index, so only changed rows are read. */
  indexed?: boolean;
};

const ENTITIES: Record<SyncEntity, EntityDef> = {
  settings: { table: () => db.settings as never, keyOf: () => "local", dbKey: () => "local" },
  weeks: { table: () => db.weeks as never, keyOf: (r) => String(r.id), dbKey: (k) => k, indexed: true },
  slots: {
    table: () => db.slots as never,
    keyOf: (r) => slotKey(r as never),
    dbKey: (k) => parseSlotKey(k),
    indexed: true,
  },
  listItems: {
    table: () => db.listItems as never,
    keyOf: (r) => listItemKey(r as never),
    dbKey: (k) => parseListItemKey(k),
    indexed: true,
  },
  // The user's own, edited and AI-generated dishes (library dishes live in code).
  dishes: { table: () => db.dishes as never, keyOf: (r) => String(r.id), dbKey: (k) => k, indexed: true },
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
  for (const [entity, def] of Object.entries(ENTITIES) as [SyncEntity, EntityDef][]) {
    // Weeks of history add up; read only rows edited since the last push.
    const rows = def.indexed
      ? await def.table().where("updatedAt").above(since).toArray()
      : await def.table().toArray();
    for (const row of rows) {
      if (def.include && !def.include(row)) continue;
      const updatedAt = row.updatedAt ?? 0;
      if (updatedAt > since) changes.push({ entity, key: def.keyOf(row), data: row, updatedAt });
    }
  }
  // A deletion is only sent if nothing newer replaced the record since.
  const tombstones = await db.tombstones.toArray();
  for (const [entity, group] of groupBy(tombstones, (t) => t.entity as SyncEntity)) {
    const def = ENTITIES[entity];
    if (!def) continue;
    const live = await def.table().bulkGet(group.map((t) => def.dbKey(t.key)) as never[]);
    group.forEach((t, i) => {
      const liveAt = live[i]?.updatedAt ?? (live[i] ? 0 : undefined);
      if (liveAt === undefined || liveAt < t.deletedAt) {
        changes.push({ entity, key: t.key, data: null, updatedAt: t.deletedAt });
      }
    });
  }
  return { changes, tombstones };
}

function groupBy<T, K>(items: T[], keyOf: (item: T) => K) {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  return groups;
}

async function applyRows(rows: SyncRow[]) {
  if (!rows.length) return;
  await db.transaction("rw", [db.settings, db.weeks, db.slots, db.listItems, db.dishes, db.meta, db.tombstones], async () => {
    // Most rows are this device's own changes coming back: look them up in
    // bulk and write only the ones that are actually newer.
    for (const [entity, group] of groupBy(rows, (r) => r.entity)) {
      const def = ENTITIES[entity];
      if (!def) continue;
      const table = def.table();
      const dbKeys = group.map((r) => def.dbKey(r.key));
      const [locals, tombs] = await Promise.all([
        table.bulkGet(dbKeys as never[]),
        db.tombstones.bulkGet(group.map((r) => [r.entity, r.key] as [string, string])),
      ]);
      const puts: Row[] = [];
      const deletes: unknown[] = [];
      const clearedTombs: [string, string][] = [];
      group.forEach((row, i) => {
        if (!remoteWins(row.updatedAt, locals[i], tombs[i]?.deletedAt)) return;
        if (row.deleted || !row.data) deletes.push(dbKeys[i]);
        else puts.push(row.data as Row);
        if (tombs[i]) clearedTombs.push([row.entity, row.key]);
      });
      if (deletes.length) await table.bulkDelete(deletes as never[]);
      if (puts.length) await table.bulkPut(puts);
      if (clearedTombs.length) await db.tombstones.bulkDelete(clearedTombs);
      // Settings from the account mean this device doesn't need onboarding again.
      if (entity === "settings" && puts.length && !(await db.meta.get("onboarded"))) {
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
