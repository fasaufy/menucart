import { describe, expect, it } from "vitest";
import { getLibraryDish } from "../dishes/library";
import type { Dish, Ingredient, ListItem } from "../types";
import { describeChange, diffList, mergeDishes, reconcile } from "./merge";
import { formatAmount, roundForShopping, toBase, type UnitLabels } from "./units";

const ing = (key: string, qty: number, unit: string, extra: Partial<Ingredient> = {}): Ingredient => ({
  key,
  name: key,
  qty,
  unit,
  section: "produce",
  halal: "halal",
  ...extra,
});

const dish = (id: string, ingredients: Ingredient[], servings = 2): Dish => ({
  id,
  name: id,
  aliases: [],
  source: "library",
  servings,
  ingredients,
});

const labels: UnitLabels = {
  tsp: "tsp",
  tbsp: "tbsp",
  clove: (n) => (n === 1 ? "clove" : "cloves"),
  stalk: (n) => (n === 1 ? "stalk" : "stalks"),
  leaf: (n) => (n === 1 ? "leaf" : "leaves"),
  slice: (n) => (n === 1 ? "slice" : "slices"),
  piece: (n) => (n === 1 ? "piece" : "pieces"),
  bunch: (n) => (n === 1 ? "bunch" : "bunches"),
};
const fmt = (qty: number, unit: string) => formatAmount({ qty, unit }, labels, "en-GB");

describe("units", () => {
  it("converts to base units", () => {
    expect(toBase({ qty: 1.5, unit: "kg" })).toEqual({ qty: 1500, unit: "g" });
    expect(toBase({ qty: 2, unit: "tbsp" })).toEqual({ qty: 6, unit: "tsp" });
    expect(toBase({ qty: 3, unit: "Cloves" })).toEqual({ qty: 3, unit: "clove" });
  });

  it("rounds to what you can buy", () => {
    expect(roundForShopping({ qty: 2.2, unit: "pcs" })).toEqual({ qty: 3, unit: "pcs" });
    expect(roundForShopping({ qty: 3, unit: "pcs" })).toEqual({ qty: 3, unit: "pcs" });
    expect(roundForShopping({ qty: 62, unit: "g" })).toEqual({ qty: 60, unit: "g" });
    expect(roundForShopping({ qty: 1234, unit: "g" })).toEqual({ qty: 1230, unit: "g" });
    expect(roundForShopping({ qty: 1, unit: "g" })).toEqual({ qty: 5, unit: "g" });
  });

  it("formats for display", () => {
    expect(fmt(1250, "g")).toBe("1.25 kg");
    expect(fmt(400, "g")).toBe("400 g");
    expect(fmt(6, "tsp")).toBe("2 tbsp");
    expect(fmt(4, "tsp")).toBe("4 tsp");
    expect(fmt(10, "clove")).toBe("10 cloves");
    expect(fmt(1, "clove")).toBe("1 clove");
    expect(fmt(3, "pcs")).toBe("3");
  });
});

describe("mergeDishes", () => {
  it("sums the same ingredient across dishes (2 cloves + 4 cloves = 6 cloves)", () => {
    const merged = mergeDishes(
      [dish("a", [ing("garlic", 2, "cloves")]), dish("b", [ing("garlic", 4, "cloves")])],
      2,
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].amounts).toEqual([{ qty: 6, unit: "clove" }]);
    expect(merged[0].uses.map((u) => u.dishId)).toEqual(["a", "b"]);
  });

  it("converts g and kg before summing", () => {
    const merged = mergeDishes(
      [dish("a", [ing("beef", 500, "g")]), dish("b", [ing("beef", 1, "kg")])],
      2,
    );
    expect(merged[0].amounts).toEqual([{ qty: 1500, unit: "g" }]);
  });

  it("keeps incompatible units as sub-lines (2 tbsp + 100 g butter)", () => {
    const merged = mergeDishes(
      [dish("a", [ing("butter", 2, "tbsp")]), dish("b", [ing("butter", 100, "g")])],
      2,
    );
    expect(merged[0].amounts).toEqual([
      { qty: 6, unit: "tsp" },
      { qty: 100, unit: "g" },
    ]);
  });

  it("doubles a dish planned twice and records ×2", () => {
    const soto = dish("soto", [ing("chicken", 500, "g")]);
    const merged = mergeDishes([soto, soto], 2);
    expect(merged[0].amounts).toEqual([{ qty: 1000, unit: "g" }]);
    expect(merged[0].uses).toEqual([{ dishId: "soto", dishName: "soto", count: 2, amounts: [{ qty: 1000, unit: "g" }] }]);
  });

  it("records each dish's own amount on a shared line", () => {
    const capcay = dish("capcay", [ing("cabbage", 200, "g")]);
    const tahuTek = dish("tahu-tek", [ing("cabbage", 200, "g")]);
    const [kol] = mergeDishes([capcay, tahuTek], 2);
    expect(kol.amounts).toEqual([{ qty: 400, unit: "g" }]);
    expect(kol.uses.map((u) => [u.dishId, u.amounts])).toEqual([
      ["capcay", [{ qty: 200, unit: "g" }]],
      ["tahu-tek", [{ qty: 200, unit: "g" }]],
    ]);
  });

  it("scales from the dish's servings to the household size", () => {
    const merged = mergeDishes([dish("a", [ing("egg", 2, "pcs"), ing("rice", 300, "g")])], 5);
    expect(merged.find((m) => m.key === "egg")!.amounts).toEqual([{ qty: 5, unit: "pcs" }]);
    expect(merged.find((m) => m.key === "rice")!.amounts).toEqual([{ qty: 750, unit: "g" }]);
  });

  it("carries halal status through", () => {
    const merged = mergeDishes([getLibraryDish("spaghetti-carbonara")!], 2);
    expect(merged.find((m) => m.key === "guanciale")!.halal).toBe("non_halal");
    expect(merged.find((m) => m.key === "parmesan")!.halal).toBe("check");
  });
});

describe("reconcile", () => {
  const saved = (key: string, state: ListItem["state"], qty = 1): ListItem => ({
    weekId: "w",
    key,
    name: key,
    section: "produce",
    halal: "halal",
    amounts: [{ qty, unit: "pcs" }],
    uses: [],
    state,
    updatedAt: 0,
  });

  it("keeps ticks when the list is regenerated", () => {
    const merged = mergeDishes([dish("a", [ing("egg", 4, "pcs"), ing("onion", 1, "pcs")])], 2);
    const { put } = reconcile([saved("egg", "bought", 2), saved("onion", "at_home")], merged, "w", 1);
    expect(put.find((i) => i.key === "egg")).toMatchObject({ state: "bought", amounts: [{ qty: 4, unit: "pcs" }] });
    expect(put.find((i) => i.key === "onion")!.state).toBe("at_home");
  });

  it("keeps the user's own price, the bought price and the note when regenerated", () => {
    const merged = mergeDishes([dish("a", [ing("egg", 4, "pcs"), ing("onion", 1, "pcs")])], 2);
    const { put } = reconcile(
      [{ ...saved("egg", "bought"), boughtPrice: 14_000 }, { ...saved("onion", "to_buy"), userPrice: 6_000, note: "red ones" }],
      merged,
      "w",
      1,
    );
    expect(put.find((i) => i.key === "egg")!.boughtPrice).toBe(14_000);
    expect(put.find((i) => i.key === "onion")).toMatchObject({ userPrice: 6_000, note: "red ones" });
  });

  it("adds new items as to_buy and staples as at_home", () => {
    const merged = mergeDishes([dish("a", [ing("egg", 2, "pcs"), ing("salt", 1, "tsp")])], 2);
    const { put } = reconcile([], merged, "w", 1);
    expect(put.find((i) => i.key === "egg")!.state).toBe("to_buy");
    expect(put.find((i) => i.key === "salt")!.state).toBe("at_home");
  });

  it("removes dropped items, but keeps bought ones flagged no longer needed", () => {
    const { put, remove } = reconcile(
      [saved("egg", "to_buy"), saved("tofu", "bought"), saved("onion", "at_home")],
      [],
      "w",
      1,
    );
    expect(remove.sort()).toEqual(["egg", "onion"]);
    expect(put).toEqual([expect.objectContaining({ key: "tofu", state: "bought", noLongerNeeded: true })]);
  });

  it("clears the flag when the item comes back", () => {
    const merged = mergeDishes([dish("a", [ing("tofu", 1, "pcs")])], 2);
    const { put } = reconcile([{ ...saved("tofu", "bought"), noLongerNeeded: true }], merged, "w", 1);
    expect(put[0].noLongerNeeded).toBeUndefined();
    expect(put[0].state).toBe("bought");
  });
});

describe("diffList", () => {
  it("counts added, changed and removed lines", () => {
    const before = mergeDishes([dish("a", [ing("egg", 2, "pcs"), ing("onion", 1, "pcs")])], 2);
    const { put } = reconcile([], before, "w", 1);
    const after = mergeDishes([dish("a", [ing("egg", 4, "pcs"), ing("tofu", 1, "pcs")])], 2);
    expect(diffList(put, after)).toEqual({ added: 1, changed: 1, removed: 1 });
    expect(diffList(put, before)).toEqual({ added: 0, changed: 0, removed: 0 });
  });
});

describe("carried-over lines", () => {
  const carried: ListItem = {
    weekId: "w",
    key: "carried:rice",
    name: "Rice",
    section: "dry_goods_spices",
    halal: "halal",
    amounts: [{ qty: 200, unit: "g" }],
    uses: [],
    state: "to_buy",
    carriedOver: true,
    updatedAt: 0,
  };

  it("survive regeneration and don't count as plan changes", () => {
    const merged = mergeDishes([dish("a", [ing("rice", 300, "g")])], 2);
    const { put, remove } = reconcile([carried], merged, "w", 1);
    expect(remove).toEqual([]);
    expect(put.find((i) => i.key === "carried:rice")).toEqual(carried);
    expect(put.find((i) => i.key === "rice")!.amounts).toEqual([{ qty: 300, unit: "g" }]);
    expect(diffList(put, merged)).toEqual({ added: 0, changed: 0, removed: 0 });
  });
});

describe("describeChange", () => {
  it("says which dishes were added (with their slot) and which lines are new", () => {
    const soto = dish("soto", [ing("chicken", 500, "g")]);
    const rendang = dish("rendang", [ing("beef", 500, "g"), ing("coconut_milk", 400, "ml")]);
    const first = reconcile([], mergeDishes([soto], 2), "w", 1).put;
    const next = reconcile(first, mergeDishes([soto, rendang], 2), "w", 2);
    expect(
      describeChange(first, next.put, next.remove, [
        { day: 0, meal: "lunch", dish: soto },
        { day: 3, meal: "dinner", dish: rendang },
      ]),
    ).toEqual({ added: [{ name: "rendang", day: 3, meal: "dinner" }], removed: [], addedKeys: ["beef", "coconut_milk"], removedCount: 0 });
  });

  it("says which dishes were removed", () => {
    const soto = dish("soto", [ing("chicken", 500, "g")]);
    const tofu = dish("tahu", [ing("tofu", 2, "pcs")]);
    const first = reconcile([], mergeDishes([soto, tofu], 2), "w", 1).put;
    const next = reconcile(first, mergeDishes([soto], 2), "w", 2);
    expect(describeChange(first, next.put, next.remove, [{ day: 0, meal: "lunch", dish: soto }])).toMatchObject({
      removed: ["tahu"],
      removedCount: 1,
    });
  });

  it("is undefined for a first list or when nothing changed", () => {
    const soto = dish("soto", [ing("chicken", 500, "g")]);
    const first = reconcile([], mergeDishes([soto], 2), "w", 1);
    expect(describeChange([], first.put, first.remove, [{ day: 0, meal: "lunch", dish: soto }])).toBeUndefined();
    const again = reconcile(first.put, mergeDishes([soto], 2), "w", 2);
    expect(describeChange(first.put, again.put, again.remove, [{ day: 0, meal: "lunch", dish: soto }])).toBeUndefined();
  });
});
