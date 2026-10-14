import { describe, expect, it } from "vitest";
import { mergeDishes } from "@/lib/list/merge";
import { toDish } from "./ai";

const out = (ingredients: Parameters<typeof toDish>[0]["ingredients"], recognized = true) => ({
  recognized,
  name: "Soto betawi",
  cuisine: "Indonesian",
  meals: ["lunch" as const, "dinner" as const],
  ingredients,
});

describe("mapping AI output onto the app's ingredients", () => {
  it("uses the catalog for known keys, so they merge with library dishes", () => {
    const dish = toDish(out([{ key: "garlic", name: "Garlic cloves", local_name: "x", qty: 4, unit: "cloves", section: "others", halal: "non_halal" }]), "x");
    // Catalog wins over the model for name, section and halal tag.
    expect(dish.ingredients[0]).toMatchObject({ key: "garlic", name: "Garlic", section: "produce", halal: "halal", qty: 4, unit: "cloves" });
    const merged = mergeDishes([{ id: "a", name: "a", aliases: [], source: "ai", servings: 2, ingredients: dish.ingredients }, { id: "b", name: "b", aliases: [], source: "ai", servings: 2, ingredients: dish.ingredients }], 2);
    expect(merged[0].amounts).toEqual([{ qty: 8, unit: "clove" }]);
  });

  it("keeps new ingredients with the model's tags and a stable custom key", () => {
    const dish = toDish(out([{ key: "new", name: "Emping", local_name: "Emping melinjo", qty: 50, unit: "g", section: "dry_goods_spices", halal: "halal" }]), "x");
    expect(dish.ingredients[0]).toMatchObject({ key: "custom:emping", localName: "Emping melinjo", section: "dry_goods_spices" });
  });

  it("drops bad lines, duplicates and unknown units", () => {
    const dish = toDish(
      out([
        { key: "egg", name: "Egg", local_name: "", qty: 2, unit: "pcs", section: "dairy_eggs", halal: "halal" },
        { key: "egg", name: "Egg", local_name: "", qty: 3, unit: "pcs", section: "dairy_eggs", halal: "halal" },
        { key: "new", name: "Air", local_name: "", qty: -1, unit: "g", section: "others", halal: "halal" },
        { key: "new", name: "", local_name: "", qty: 1, unit: "g", section: "others", halal: "halal" },
        { key: "new", name: "Daun pandan", local_name: "", qty: 2, unit: "handful", section: "produce", halal: "halal" },
      ]),
      "x",
    );
    expect(dish.ingredients.map((i) => i.key)).toEqual(["egg", "custom:daun_pandan"]);
    expect(dish.ingredients[1].unit).toBe("pcs");
  });

  it("marks unknown input as not recognised", () => {
    expect(toDish(out([], false), "asdf").recognized).toBe(false);
    expect(toDish(out([{ key: "egg", name: "Egg", local_name: "", qty: 2, unit: "pcs", section: "dairy_eggs", halal: "halal" }], false), "x").ingredients).toEqual([]);
  });
});
