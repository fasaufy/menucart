import { describe, expect, it } from "vitest";
import { PROVINCE_AVERAGE } from "../region/places";
import type { Amount, City, ListItem, ListItemState } from "../types";
import { BAPANAS_JATENG } from "./bapanas-jateng";
import { checkPrice, dishCost, linePrice, quoteItem, weekMoney } from "./price";
import type { Dish } from "../types";

const SALATIGA: City = { id: "3373", name: "Kota Salatiga", province: "Jawa Tengah" };

function item(key: string, amounts: Amount[], extra: Partial<ListItem> = {}): ListItem {
  return {
    weekId: "2026-10-26",
    key,
    name: key,
    section: "produce",
    halal: "halal",
    amounts,
    uses: [],
    state: "to_buy",
    updatedAt: 0,
    ...extra,
  };
}

const g = (qty: number): Amount[] => [{ qty, unit: "g" }];
const round500 = (n: number) => Math.round(n / 500) * 500;

describe("quoteItem", () => {
  it("prices Bapanas items per sell unit, rounded up to what's sellable", () => {
    const chicken = BAPANAS_JATENG["Daging Ayam Ras"].price;
    expect(quoteItem(item("chicken", g(500)), SALATIGA)).toMatchObject({
      buy: { loose: false, qty: 0.5, unit: "ekor" },
      cost: round500(chicken / 2),
      source: { id: "bapanas", area: "Jawa Tengah" },
    });
    // 600 g is more than ½ ekor, so a whole one.
    expect(quoteItem(item("chicken", g(600)), SALATIGA)?.buy).toEqual({ loose: false, qty: 1, unit: "ekor", roundedUp: true });
  });

  it("rounds kg items up to the next ¼ kg (400 g of kol is ½ kg)", () => {
    expect(quoteItem(item("cabbage", g(400)), SALATIGA)).toMatchObject({
      buy: { qty: 0.5, unit: "kg", roundedUp: true },
      needed: { qty: 400, unit: "g" },
      cost: 5_000,
      source: { id: "menucart" },
    });
  });

  it("counts pieces into bundles (3 stalks of serai is 1 ikat, 6 is 2)", () => {
    expect(quoteItem(item("lemongrass", [{ qty: 3, unit: "stalk" }]), SALATIGA)).toMatchObject({ buy: { qty: 1, unit: "ikat" }, cost: 2_000 });
    expect(quoteItem(item("lemongrass", [{ qty: 6, unit: "stalk" }]), SALATIGA)).toMatchObject({ buy: { qty: 2, unit: "ikat" }, cost: 4_000 });
  });

  it("asks for loose items by rupiah: rounded up to Rp1.000, at least Rp2.000", () => {
    // 3 cabai rawit is a few grams: the smallest buy.
    expect(quoteItem(item("bird_eye_chili", [{ qty: 3, unit: "pcs" }]), SALATIGA)).toMatchObject({ buy: { loose: true }, cost: 2_000 });
    // 50 shallots ≈ 400 g.
    const shallot = BAPANAS_JATENG["Bawang Merah"].price;
    expect(quoteItem(item("shallot", [{ qty: 50, unit: "pcs" }]), SALATIGA)).toMatchObject({
      needed: { qty: 400, unit: "g" },
      cost: Math.ceil((0.4 * shallot) / 1000) * 1000,
    });
  });

  it("converts spoons (2 tbsp = 6 tsp of kecap manis is one small bottle)", () => {
    expect(quoteItem(item("kecap_manis", [{ qty: 6, unit: "tsp" }]), SALATIGA)).toMatchObject({
      buy: { qty: 1, unit: "botol" },
      needed: { qty: 30, unit: "ml" },
      cost: 7_500,
    });
  });

  it("adds up amounts in different recipe units", () => {
    expect(quoteItem(item("garlic", [{ qty: 10, unit: "clove" }, { qty: 1, unit: "pcs" }]), SALATIGA)?.needed.qty).toBe(90);
  });

  it("has no price for unknown items or amounts it can't convert", () => {
    expect(quoteItem(item("daun_salam_exotic", g(10)), SALATIGA)).toBeUndefined();
    expect(quoteItem(item("garlic", [{ qty: 1, unit: "bunch" }]), SALATIGA)).toBeUndefined();
  });

  it("uses Bapanas only inside Jawa Tengah; MenuCart estimates still apply", () => {
    expect(quoteItem(item("chicken", g(500)), PROVINCE_AVERAGE)?.source.id).toBe("bapanas");
    const jakarta: City = { id: "3171", name: "Kota Jakarta Pusat", province: "DKI Jakarta" };
    expect(quoteItem(item("chicken", g(500)), jakarta)).toBeUndefined();
    expect(quoteItem(item("cabbage", g(400)), jakarta)?.cost).toBe(5_000);
  });
});

describe("linePrice", () => {
  it("prefers the user's own price over the estimate", () => {
    expect(linePrice(item("spinach", [{ qty: 2, unit: "bunch" }], { userPrice: 7_000 }), SALATIGA)).toEqual({
      cost: 7_000,
      source: { id: "user", area: "Kota Salatiga" },
      estimated: false,
    });
  });

  it("keeps the price a line was bought at, even if the amount changes", () => {
    const bought = item("cabbage", g(900), { state: "bought", boughtPrice: 5_000 });
    expect(linePrice(bought, SALATIGA)?.cost).toBe(5_000);
    expect(linePrice({ ...bought, state: "to_buy" }, SALATIGA)?.cost).toBe(10_000);
  });
});

describe("weekMoney", () => {
  const state = (s: ListItemState) => ({ state: s });

  it("counts what's to buy and bought against the budget; at home and skipped don't count", () => {
    const money = weekMoney(
      [
        item("cabbage", g(400)), // 5.000
        item("lemongrass", [{ qty: 3, unit: "stalk" }], state("bought")), // 2.000 when ticked…
        item("tempe", g(300), { state: "bought", boughtPrice: 6_000 }), // …or what it was bought at
        item("ginger", [{ qty: 2, unit: "piece" }], state("at_home")),
        item("mushroom", g(200), state("skipped")),
        item("mystery_spice", g(5)), // no price
      ],
      200_000,
      SALATIGA,
    );
    expect(money).toEqual({
      budget: 200_000,
      spend: 13_000,
      left: 187_000,
      toBuyCount: 2,
      atHomeCount: 1,
      missing: ["mystery_spice"],
      atHome: [{ key: "ginger", cost: 2_000 }],
    });
  });

  it("goes negative when over budget", () => {
    expect(weekMoney([item("beef", g(2000))], 100_000, SALATIGA).left).toBeLessThan(0);
  });

  it("is the whole budget when everything is at home", () => {
    const money = weekMoney([item("cabbage", g(400), state("at_home"))], 200_000, SALATIGA);
    expect(money).toMatchObject({ spend: 0, left: 200_000, toBuyCount: 0, atHomeCount: 1 });
  });
});

describe("dishCost", () => {
  const dish = (id: string, lines: [string, number, string][]): Dish => ({
    id,
    name: id,
    aliases: [],
    source: "user",
    servings: 2,
    ingredients: lines.map(([key, qty, unit]) => ({ key, name: key, qty, unit, section: "produce", halal: "halal" })),
  });

  it("takes each ingredient's share of its line by amount", () => {
    // Two dishes share ½ kg kol (Rp5.000): 200 g of 400 g is half.
    const capcay = dish("capcay", [["cabbage", 200, "g"]]);
    const lines = new Map([["cabbage", item("cabbage", g(400))]]);
    expect(dishCost(capcay, lines, 2, SALATIGA)).toEqual({ cost: 2_500, missing: false });
  });

  it("costs nothing for what's at home, and flags lines without a price", () => {
    const d = dish("d", [["ginger", 1, "piece"], ["mystery_spice", 5, "g"]]);
    const lines = new Map([
      ["ginger", item("ginger", [{ qty: 1, unit: "piece" }], { state: "at_home" })],
      ["mystery_spice", item("mystery_spice", g(5))],
    ]);
    expect(dishCost(d, lines, 2, SALATIGA)).toEqual({ cost: 0, missing: true });
  });

  it("scales to the household", () => {
    const d = dish("d", [["cabbage", 400, "g"]]);
    const lines = new Map([["cabbage", item("cabbage", g(800))]]);
    // For 4 people the dish needs all 800 g, so the whole line.
    expect(dishCost(d, lines, 4, SALATIGA).cost).toBe(quoteItem(item("cabbage", g(800)), SALATIGA)!.cost);
  });
});

describe("checkPrice", () => {
  it("lets prices near the estimate through", () => {
    expect(checkPrice(7_000, 6_000)).toBeUndefined();
    expect(checkPrice(18_000, 6_000)).toBeUndefined(); // exactly 3×
    expect(checkPrice(2_000, 6_000)).toBeUndefined(); // exactly ⅓
  });

  it("catches a zero too many and suggests the likely price (E2)", () => {
    expect(checkPrice(70_000, 6_000)).toEqual({ tooHigh: true, ratio: 70_000 / 6_000, suggestion: 7_000 });
  });

  it("catches a zero too few", () => {
    expect(checkPrice(700, 6_000)).toMatchObject({ tooHigh: false, suggestion: 7_000 });
  });

  it("offers no suggestion when no shift lands near the estimate", () => {
    expect(checkPrice(25_000, 6_000)).toEqual({ tooHigh: true, ratio: 25_000 / 6_000, suggestion: undefined });
  });
});

describe("buying by the piece", () => {
  it("counts countable things at the weight price (7 butir eggs, not 1/2 kg)", () => {
    const eggs = item("egg", [{ qty: 7, unit: "pcs" }], { buyBy: "piece" });
    const perEgg = (BAPANAS_JATENG["Telur Ayam Ras"].price * 60) / 1000;
    expect(quoteItem(eggs, SALATIGA)).toMatchObject({
      buy: { loose: false, qty: 7, unit: "butir", roundedUp: false },
      cost: Math.round((7 * perEgg) / 500) * 500,
    });
    expect(quoteItem({ ...eggs, buyBy: "weight" }, SALATIGA)?.buy).toMatchObject({ qty: 0.5, unit: "kg" });
  });

  it("rounds grams up to whole pieces, and loose items stop being loose", () => {
    expect(quoteItem(item("eggplant", g(300), { buyBy: "piece" }), SALATIGA)?.buy).toMatchObject({ qty: 2, unit: "buah", roundedUp: true });
    expect(quoteItem(item("bird_eye_chili", [{ qty: 10, unit: "pcs" }], { buyBy: "piece" }), SALATIGA)?.buy).toMatchObject({
      loose: false,
      qty: 10,
      unit: "buah",
    });
  });

  it("ignores By piece for things without a piece size", () => {
    expect(quoteItem(item("cabbage", g(400), { buyBy: "piece" }), SALATIGA)?.buy).toMatchObject({ qty: 0.5, unit: "kg" });
  });
});
