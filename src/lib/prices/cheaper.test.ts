import { describe, expect, it } from "vitest";
import type { Amount, City, ListItem } from "../types";
import { cheaperOptions, priceJump } from "./cheaper";

const SALATIGA: City = { id: "3373", name: "Kota Salatiga", province: "Jawa Tengah" };

function item(key: string, amounts: Amount[], extra: Partial<ListItem> = {}): ListItem {
  return { weekId: "w", key, name: key, section: "produce", halal: "halal", amounts, uses: [], state: "to_buy", updatedAt: 0, ...extra };
}

describe("cheaperOptions", () => {
  it("offers priced alternatives that save at least Rp2.000, biggest saving first", () => {
    const options = cheaperOptions(item("olive_oil", [{ qty: 60, unit: "ml" }]), SALATIGA);
    expect(options[0].lines.map((l) => l.name)).toEqual(["Cooking oil"]);
    expect(options[0].saving).toBeGreaterThanOrEqual(2_000);
    expect(options.map((o) => o.saving)).toEqual([...options.map((o) => o.saving)].sort((a, b) => b - a));
  });

  it("leaves out alternatives that cost the same or more", () => {
    // 300 g beef bacon (2 packs): smoked beef and smoked chicken are also Rp70.000.
    const options = cheaperOptions(item("beef_bacon", [{ qty: 300, unit: "g" }]), SALATIGA);
    expect(options.every((o) => o.saving >= 2_000)).toBe(true);
  });

  it("has nothing for unpriced or already replaced lines", () => {
    expect(cheaperOptions(item("mystery_spice", [{ qty: 5, unit: "g" }]), SALATIGA)).toEqual([]);
    expect(cheaperOptions(item("olive_oil", [{ qty: 60, unit: "ml" }], { replacedBy: "Cooking oil" }), SALATIGA)).toEqual([]);
  });
});

describe("priceJump", () => {
  const table = {
    "Cabai Rawit Merah": { price: 50_000, month: "2026-01", previous: 40_000 },
    "Bawang Merah": { price: 41_000, month: "2026-01", previous: 40_000 },
  };

  it("flags a rise of 20% or more since the month before", () => {
    expect(priceJump("bird_eye_chili", table)).toEqual({ change: 0.25, previousMonth: "2025-12" });
  });

  it("ignores small moves, MenuCart estimates and unknown keys", () => {
    expect(priceJump("shallot", table)).toBeUndefined();
    expect(priceJump("cabbage", table)).toBeUndefined();
    expect(priceJump("mystery_spice", table)).toBeUndefined();
  });
});
