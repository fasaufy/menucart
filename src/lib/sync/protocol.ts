// Wire format for POST /api/sync, shared by the device and the server.

export const SYNC_ENTITIES = ["settings", "weeks", "slots", "listItems", "dishes", "meta"] as const;
export type SyncEntity = (typeof SYNC_ENTITIES)[number];

/** A local change to upload. `data: null` means deleted. */
export type SyncChange = { entity: SyncEntity; key: string; data: unknown | null; updatedAt: number };

/** A server row to apply locally. */
export type SyncRow = { entity: SyncEntity; key: string; data: unknown | null; deleted: boolean; updatedAt: number; version: number };

export type SyncRequest = { since: number; changes: SyncChange[]; reports?: unknown[] };
export type SyncResponse = { rows: SyncRow[]; cursor: number; hasMore: boolean };

export const MAX_CHANGES_PER_REQUEST = 500;
export const MAX_ROWS_PER_RESPONSE = 1000;
const MAX_ROW_BYTES = 64 * 1024;
const MAX_KEY_LENGTH = 200;

/** Validates an uploaded sync request; returns an error message or the cleaned request. */
export function parseSyncRequest(body: unknown): SyncRequest | string {
  if (!body || typeof body !== "object") return "body must be an object";
  const { since, changes, reports } = body as Record<string, unknown>;
  if (typeof since !== "number" || !Number.isInteger(since) || since < 0) return "since must be a non-negative integer";
  if (!Array.isArray(changes)) return "changes must be an array";
  if (changes.length > MAX_CHANGES_PER_REQUEST) return `at most ${MAX_CHANGES_PER_REQUEST} changes per request`;
  const clean: SyncChange[] = [];
  for (const c of changes) {
    if (!c || typeof c !== "object") return "invalid change";
    const { entity, key, data, updatedAt } = c as Record<string, unknown>;
    if (!SYNC_ENTITIES.includes(entity as SyncEntity)) return `unknown entity ${String(entity)}`;
    if (typeof key !== "string" || !key || key.length > MAX_KEY_LENGTH) return "invalid key";
    if (typeof updatedAt !== "number" || !Number.isFinite(updatedAt) || updatedAt < 0) return "invalid updatedAt";
    if (data !== null && (typeof data !== "object" || Array.isArray(data))) return "data must be an object or null";
    if (data !== null && JSON.stringify(data).length > MAX_ROW_BYTES) return "row too large";
    clean.push({ entity: entity as SyncEntity, key, data: data ?? null, updatedAt: Math.round(updatedAt) });
  }
  // The last write per row in this batch wins, so the database never sees the same row twice in one insert.
  const latest = new Map<string, SyncChange>();
  for (const c of clean) {
    const id = `${c.entity}\u0000${c.key}`;
    const prev = latest.get(id);
    if (!prev || c.updatedAt >= prev.updatedAt) latest.set(id, c);
  }
  const cleanReports = Array.isArray(reports) ? reports.filter((r) => r && typeof r === "object").slice(0, 50) : [];
  return { since, changes: [...latest.values()], reports: cleanReports };
}

/**
 * Should a remote row replace local state? Last write wins by the device
 * timestamp; a local deletion counts as a write at its deletedAt.
 */
export function remoteWins(remoteUpdatedAt: number, local: { updatedAt?: number } | undefined, tombstoneAt?: number) {
  const localAt = Math.max(local?.updatedAt ?? -1, tombstoneAt ?? -1);
  return remoteUpdatedAt > localAt;
}
