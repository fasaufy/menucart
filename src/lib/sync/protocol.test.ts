import { describe, expect, it } from "vitest";
import {
  exceedsStorage,
  MAX_BYTES_PER_ACCOUNT,
  MAX_CHANGES_PER_REQUEST,
  MAX_ROWS_PER_ACCOUNT,
  parseSyncRequest,
  remoteWins,
  rowBytes,
  type SyncChange,
} from "./protocol";

describe("parseSyncRequest", () => {
  it("accepts a valid request and keeps the last write per row", () => {
    const r = parseSyncRequest({
      since: 3,
      changes: [
        { entity: "slots", key: "2026-10-12|1|lunch", data: { dishName: "A" }, updatedAt: 10 },
        { entity: "slots", key: "2026-10-12|1|lunch", data: { dishName: "B" }, updatedAt: 20 },
        { entity: "dishes", key: "user-1", data: null, updatedAt: 5 },
      ],
    });
    expect(typeof r).toBe("object");
    if (typeof r === "string") return;
    expect(r.changes).toHaveLength(2);
    expect(r.changes.find((c) => c.entity === "slots")!.data).toEqual({ dishName: "B" });
    expect(r.changes.find((c) => c.entity === "dishes")!.data).toBeNull();
  });

  it("rejects bad input", () => {
    expect(parseSyncRequest(null)).toMatch(/object/);
    expect(parseSyncRequest({ since: -1, changes: [] })).toMatch(/since/);
    expect(parseSyncRequest({ since: 0, changes: [{ entity: "users", key: "x", data: {}, updatedAt: 1 }] })).toMatch(/unknown entity/);
    expect(parseSyncRequest({ since: 0, changes: [{ entity: "slots", key: "", data: {}, updatedAt: 1 }] })).toMatch(/key/);
    expect(parseSyncRequest({ since: 0, changes: [{ entity: "slots", key: "k", data: [1], updatedAt: 1 }] })).toMatch(/object/);
    const many = Array.from({ length: MAX_CHANGES_PER_REQUEST + 1 }, (_, i) => ({ entity: "slots", key: `k${i}`, data: {}, updatedAt: 1 }));
    expect(parseSyncRequest({ since: 0, changes: many })).toMatch(/at most/);
  });
});

describe("remoteWins (last write wins)", () => {
  it("applies newer remote rows and keeps newer local ones", () => {
    expect(remoteWins(20, { updatedAt: 10 })).toBe(true);
    expect(remoteWins(10, { updatedAt: 20 })).toBe(false);
    expect(remoteWins(10, { updatedAt: 10 })).toBe(false);
    expect(remoteWins(1, undefined)).toBe(true);
  });

  it("treats a local deletion as a write", () => {
    expect(remoteWins(10, undefined, 20)).toBe(false);
    expect(remoteWins(30, undefined, 20)).toBe(true);
  });
});

describe("exceedsStorage", () => {
  const change = (key: string, bytes: number): SyncChange => ({ entity: "dishes", key, data: { s: "x".repeat(bytes) }, updatedAt: 1 });
  const none = { rows: 0, bytes: 0 };

  it("allows growth under the cap", () => {
    expect(exceedsStorage({ rows: 100, bytes: 50_000 }, none, [change("a", 1000)])).toBe(false);
  });

  it("refuses growth past the row or byte cap", () => {
    expect(exceedsStorage({ rows: MAX_ROWS_PER_ACCOUNT, bytes: 0 }, none, [change("a", 10)])).toBe(true);
    expect(exceedsStorage({ rows: 1, bytes: MAX_BYTES_PER_ACCOUNT - 100 }, none, [change("a", 1000)])).toBe(true);
  });

  it("always allows edits in place and deletions, even when full", () => {
    const full = { rows: MAX_ROWS_PER_ACCOUNT, bytes: MAX_BYTES_PER_ACCOUNT };
    const edit = change("a", 500);
    expect(exceedsStorage(full, { rows: 1, bytes: rowBytes(edit.data) }, [edit])).toBe(false);
    expect(exceedsStorage(full, { rows: 1, bytes: 800 }, [{ entity: "dishes", key: "a", data: null, updatedAt: 2 }])).toBe(false);
  });
});
