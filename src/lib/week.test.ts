import { describe, expect, it } from "vitest";
import { dayIndex, weekStartOf } from "./week";

// Monday 2 November 2026.
const MON = "2026-11-02";

describe("weekStartOf / dayIndex", () => {
  it("defaults to weeks starting on Monday", () => {
    expect(weekStartOf(MON)).toBe(MON);
    expect(weekStartOf("2026-11-08")).toBe(MON); // Sunday
    expect(dayIndex("2026-11-08")).toBe(6);
  });

  it("follows the chosen start day", () => {
    // Saturday start: Mon 2 Nov is the 3rd day of the week from Sat 31 Oct.
    expect(weekStartOf(MON, 6)).toBe("2026-10-31");
    expect(dayIndex(MON, 6)).toBe(2);
    // Sunday start.
    expect(weekStartOf(MON, 0)).toBe("2026-11-01");
    expect(dayIndex("2026-11-01", 0)).toBe(0);
  });
});
