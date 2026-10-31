import { describe, expect, it } from "vitest";
import { getStrings } from "@/lib/strings";
import type { Amount, City, ListItem } from "@/lib/types";
import { aisleDetail, formatBuy, fraction, lineMoney, rowRight } from "./format";

const en = getStrings("en");
const id = getStrings("id");
const SALATIGA: City = { id: "3373", name: "Kota Salatiga", province: "Jawa Tengah" };

function item(key: string, amounts: Amount[], extra: Partial<ListItem> = {}): ListItem {
  return { weekId: "w", key, name: key, section: "produce", halal: "halal", amounts, uses: [], state: "to_buy", updatedAt: 0, ...extra };
}

describe("fraction", () => {
  it("says amounts the way sellers do", () => {
    expect([0.25, 0.5, 0.75, 1, 1.5, 2, 2.25].map(fraction)).toEqual(["1/4", "1/2", "3/4", "1", "1 1/2", "2", "2 1/4"]);
  });
});

describe("formatBuy", () => {
  it("uses English units in English and pasar units in Bahasa", () => {
    expect(formatBuy({ qty: 2, unit: "ikat" }, en)).toBe("2 bunches");
    expect(formatBuy({ qty: 1, unit: "ikat" }, en)).toBe("1 bunch");
    expect(formatBuy({ qty: 0.5, unit: "kg" }, en)).toBe("1/2 kg");
    expect(formatBuy({ qty: 2, unit: "ikat" }, id)).toBe("2 ikat");
    expect(formatBuy({ qty: 0.5, unit: "ekor" }, id)).toBe("1/2 ekor");
  });
});

describe("lineMoney", () => {
  it("shows a unit pill and how much is needed when the sellable amount is bigger", () => {
    expect(lineMoney(item("cabbage", [{ qty: 400, unit: "g" }]), SALATIGA, en, "en")).toMatchObject({
      price: { cost: 5_000, estimated: true },
      unit: "1/2 kg",
      amount: "400 g needed",
    });
  });

  it("gives loose items an approximate weight and no pill", () => {
    const money = lineMoney(item("bird_eye_chili", [{ qty: 30, unit: "pcs" }]), SALATIGA, en, "en");
    expect(money.unit).toBeUndefined();
    expect(money.amount).toBe("± 45 g");
  });

  it("has no price for unknown items", () => {
    expect(lineMoney(item("mystery_spice", [{ qty: 5, unit: "g" }]), SALATIGA, en, "en")).toEqual({ price: undefined });
  });
});

describe("rowRight", () => {
  it("shows the amount when at home or without a price, else the price", () => {
    const kol = item("cabbage", [{ qty: 400, unit: "g" }]);
    expect(rowRight({ ...kol, state: "at_home" }, lineMoney(kol, SALATIGA, en, "en"), en, "en")).toEqual({ right: "atHome", unit: "400 g" });
    expect(rowRight(kol, lineMoney(kol, SALATIGA, en, "en"), en, "en")).toMatchObject({ right: "priceUnit", price: 5_000, unit: "1/2 kg" });
    const chili = item("bird_eye_chili", [{ qty: 3, unit: "pcs" }]);
    expect(rowRight(chili, lineMoney(chili, SALATIGA, en, "en"), en, "en")).toMatchObject({ right: "price", price: 2_000 });
  });
});

describe("aisleDetail", () => {
  it("spells out a shared line: 400 g needed: Capcay 200 g + Tahu tek 200 g", () => {
    const kol = item("cabbage", [{ qty: 400, unit: "g" }], {
      uses: [
        { dishId: "capcay", dishName: "Capcay", count: 1, amounts: [{ qty: 200, unit: "g" }] },
        { dishId: "tahu-tek", dishName: "Tahu tek", count: 1, amounts: [{ qty: 200, unit: "g" }] },
      ],
    });
    expect(aisleDetail(kol, lineMoney(kol, SALATIGA, en, "en"), en, "en")).toBe("400 g needed: Capcay 200 g + Tahu tek 200 g");
  });

  it("is the amount and the dish for a single dish", () => {
    const kol = item("cabbage", [{ qty: 400, unit: "g" }], { uses: [{ dishId: "capcay", dishName: "Capcay", count: 1 }] });
    expect(aisleDetail(kol, lineMoney(kol, SALATIGA, en, "en"), en, "en")).toBe("400 g needed · Capcay");
  });
});
