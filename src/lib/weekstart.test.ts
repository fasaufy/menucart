import { describe, expect, it } from "vitest";
import type { Slot } from "./types";
import { rebucket } from "./weekstart";

const slot = (weekId: string, day: Slot["day"], meal: Slot["meal"] = "lunch"): Slot => ({
  weekId,
  day,
  meal,
  dishId: "soto-ayam",
  dishName: "Soto ayam",
  updatedAt: 0,
});

describe("rebucket", () => {
  it("keeps every meal on its date, in the week that date now falls in", () => {
    // Monday week of 2 Nov 2026: Mon (day 0) and Sun (day 6).
    const { put, remove } = rebucket([slot("2026-11-02", 0), slot("2026-11-02", 6, "dinner")], 6, 5);
    // Saturday start: Mon 2 Nov is day 2 of the week from Sat 31 Oct; Sun 8 Nov is day 1 of the week from Sat 7 Nov.
    expect(put).toEqual([
      { ...slot("2026-10-31", 2), updatedAt: 5 },
      { ...slot("2026-11-07", 1, "dinner"), updatedAt: 5 },
    ]);
    expect(remove).toHaveLength(2);
  });

  it("leaves meals alone when their week doesn't change", () => {
    expect(rebucket([slot("2026-11-02", 3)], 1)).toEqual({ put: [], remove: [] });
  });

  it("round-trips back to Monday weeks", () => {
    const there = rebucket([slot("2026-11-02", 0), slot("2026-11-02", 4)], 0).put;
    const back = rebucket(there, 1, 0).put;
    expect(back.map((s) => [s.weekId, s.day])).toEqual([
      ["2026-11-02", 0],
      ["2026-11-02", 4],
    ]);
  });
});
