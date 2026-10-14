import { describe, expect, it } from "vitest";
import { mergeDishes } from "../list/merge";
import { INGREDIENTS, type IngredientKey } from "./ingredients";
import { DISH_LIBRARY, getLibraryDish } from "./library";
import { effectiveIngredients, hasNonHalal, pendingSwaps, replacementLines, SWAP_RULES } from "./swaps";

const carbonara = getLibraryDish("spaghetti-carbonara")!;

describe("swap table", () => {
  it("has a rule for every non-halal ingredient in the catalog", () => {
    const nonHalal = (Object.keys(INGREDIENTS) as IngredientKey[]).filter((k) => INGREDIENTS[k].halal === "non_halal");
    expect(nonHalal.filter((k) => !SWAP_RULES.has(k))).toEqual([]);
  });

  it("only ever suggests halal (or check) replacements", () => {
    for (const rule of SWAP_RULES.values()) {
      expect(rule.options.length, rule.forKey).toBeGreaterThan(0);
      for (const option of rule.options) {
        for (const line of option.lines) {
          expect(INGREDIENTS[line.key].halal ?? "halal", `${rule.forKey} → ${line.key}`).not.toBe("non_halal");
        }
      }
    }
  });

  it("leaves every library dish swappable to fully halal", () => {
    for (const dish of DISH_LIBRARY) {
      const swaps = Object.fromEntries(pendingSwaps(dish).map((i) => [i.key, SWAP_RULES.get(i.key)!.options[0].id]));
      expect(hasNonHalal({ ...dish, swaps }), dish.name).toBe(false);
    }
  });
});

describe("applying swaps", () => {
  it("replaces the line in place and remembers the original", () => {
    const swapped = { ...carbonara, swaps: { guanciale: "beef_bacon" } };
    const lines = effectiveIngredients(swapped);
    expect(lines[1]).toMatchObject({ key: "beef_bacon", qty: 100, unit: "g", swappedFrom: "Guanciale" });
    expect(lines.some((i) => i.key === "guanciale")).toBe(false);
    expect(hasNonHalal(swapped)).toBe(false);
    expect(pendingSwaps(swapped)).toEqual([]);
  });

  it("supports multi-ingredient swaps, ratios and fixed amounts", () => {
    const mirin = { key: "mirin", name: "Mirin", qty: 3, unit: "tbsp", section: "others" as const, halal: "non_halal" as const };
    const [vinegar, sugar] = replacementLines(mirin, SWAP_RULES.get("mirin")!.options[0]);
    expect(vinegar).toMatchObject({ key: "rice_vinegar", qty: 3, unit: "tbsp" });
    expect(sugar).toMatchObject({ key: "sugar", qty: 3, unit: "tsp" });
  });

  it("can leave an ingredient out", () => {
    const capcay = getLibraryDish("capcay")!;
    expect(effectiveIngredients({ ...capcay, swaps: { ang_ciu: "omit" } }).some((i) => i.key === "ang_ciu")).toBe(false);
  });

  it("keeps the original when the user chooses to, and stops asking", () => {
    const kept = { ...carbonara, swaps: { guanciale: "keep" } };
    expect(effectiveIngredients(kept).some((i) => i.key === "guanciale")).toBe(true);
    expect(pendingSwaps(kept)).toEqual([]);
    expect(hasNonHalal(kept)).toBe(true);
  });

  it("carries the swap into the merged list", () => {
    const merged = mergeDishes([{ ...carbonara, swaps: { guanciale: "beef_bacon" } }], 2);
    expect(merged.find((m) => m.key === "beef_bacon")).toMatchObject({ swappedFrom: "Guanciale" });
    expect(merged.some((m) => m.key === "guanciale")).toBe(false);
  });
});
