import { describe, expect, it } from "vitest";
import { PROVINCE_AVERAGE } from "../region/places";
import type { Amount, City, ListItem, ListItemState } from "../types";
import { BAPANAS_JATENG } from "./bapanas-jateng";
import { linePrice, quoteItem, weekMoney } from "./price";

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
    expect(quoteItem(item("chicken", g(600)), SALATIGA)?.buy).toEqual({ loose: false, qty: 1, unit: "ekor" });
  });

  it("rounds kg items up to the next ¼ kg (400 g of kol is ½ kg)", () => {
    expect(quoteItem(item("cabbage", g(400)), SALATIGA)).toMatchObject({
      buy: { qty: 0.5, unit: "kg" },
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
