import { describe, expect, it } from "vitest";
import { ALTERNATIVES } from "./alternatives";
import { INGREDIENTS, type IngredientKey } from "./ingredients";
import { DISH_LIBRARY } from "./library";

describe("can't-find alternatives", () => {
  it("are halal-safe, at most 3, and point at real catalog ingredients", () => {
    for (const [key, options] of ALTERNATIVES) {
      expect(key in INGREDIENTS, key).toBe(true);
      expect(options.length, key).toBeGreaterThan(0);
      expect(options.length, key).toBeLessThanOrEqual(3);
      for (const o of options) {
        expect(o.lines.length, `${key}/${o.id}`).toBeGreaterThan(0);
        for (const line of o.lines) {
          expect(INGREDIENTS[line.key].halal ?? "halal", `${key} → ${line.key}`).not.toBe("non_halal");
          expect(line.key, `${key} suggests itself`).not.toBe(key);
        }
      }
    }
  });

  it("cover most halal ingredients used by the library", () => {
    const used = new Set(
      DISH_LIBRARY.flatMap((d) => d.ingredients.map((i) => i.key as IngredientKey)).filter(
        (k) => (INGREDIENTS[k].halal ?? "halal") !== "non_halal",
      ),
    );
    const covered = [...used].filter((k) => ALTERNATIVES.has(k)).length;
    expect(covered / used.size).toBeGreaterThan(0.7);
  });
});
