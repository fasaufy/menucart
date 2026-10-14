import { describe, expect, it } from "vitest";
import { mergeDishes } from "../list/merge";
import type { Dish } from "../types";
import { customIngredient, ingredientFromCatalog, searchIngredients } from "./edit";

describe("ingredient editing helpers", () => {
  it("finds catalog ingredients by English or local name", () => {
    expect(searchIngredients("bawang mer")[0]).toBe("shallot");
    expect(searchIngredients("garl")[0]).toBe("garlic");
    expect(searchIngredients("santan")).toContain("coconut_milk");
    expect(searchIngredients("")).toEqual([]);
  });

  it("builds catalog lines with the catalog's section and halal tag", () => {
    expect(ingredientFromCatalog("guanciale")).toMatchObject({ section: "meat_poultry", halal: "non_halal", unit: "g" });
    expect(ingredientFromCatalog("egg", 3, "pcs")).toMatchObject({ qty: 3, unit: "pcs" });
  });

  it("gives custom ingredients a stable key so they merge across dishes", () => {
    const a = customIngredient("Kemiri  sangrai");
    const b = customIngredient("kemiri sangrai");
    expect(a.key).toBe(b.key);
    const dish = (id: string): Dish => ({ id, name: id, aliases: [], source: "user", servings: 2, ingredients: [{ ...a, qty: 2 }] });
    expect(mergeDishes([dish("x"), dish("y")], 2)[0].amounts).toEqual([{ qty: 4, unit: "pcs" }]);
  });
});
