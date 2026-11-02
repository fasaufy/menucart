import { expect, it } from "vitest";
import type { Amount, City, ListItem } from "../types";
import { titipText } from "./share";

const SALATIGA: City = { id: "3373", name: "Kota Salatiga", province: "Jawa Tengah" };
// Tuesday 13 October 2026.
const DATE = new Date(2026, 9, 13, 8, 21);

const item = (key: string, name: string, localName: string, amounts: Amount[], extra: Partial<ListItem> = {}): ListItem => ({
  weekId: "w",
  key,
  name,
  localName,
  section: "produce",
  halal: "halal",
  amounts,
  uses: [],
  state: "to_buy",
  updatedAt: 0,
  ...extra,
});

const items = [
  item("bird_eye_chili", "Bird's eye chilies", "Cabai rawit", [{ qty: 30, unit: "pcs" }]),
  item("cabbage", "Cabbage", "Kol", [{ qty: 400, unit: "g" }]),
  item("chicken", "Chicken (bone-in)", "Ayam", [{ qty: 1000, unit: "g" }], { section: "meat_poultry", note: "potong 12, dada tanpa tulang" }),
  item("salt", "Salt", "Garam", [{ qty: 4, unit: "tsp" }], { section: "dry_goods_spices", state: "at_home" }),
  item("rice", "Rice", "Beras", [{ qty: 700, unit: "g" }], { section: "dry_goods_spices", state: "bought" }),
  item("beef_bacon", "Beef bacon", "Beef bacon", [{ qty: 100, unit: "g" }], { section: "meat_poultry", replacedBy: "Smoked beef", userPrice: 40_000 }),
];

it("writes the titip message: Indonesian, by stall, sellable amounts, notes; only what's left to buy", () => {
  const text = titipText(items, { budget: 200_000, city: SALATIGA, date: DATE, rupiahForLoose: true, credit: false });
  expect(text.split("\n")).toEqual([
    "🛒 Titip belanja · Selasa 13 Okt",
    expect.stringMatching(/^Estimasi: Rp[\d.]+ \(budget Rp200\.000\)$/),
    "",
    "🥬 Pasar · sayur & bumbu",
    "• Cabai rawit Rp2.000",
    "• Kol 1/2 kg",
    "",
    "🍗 Ayam & telur",
    "• Ayam 1 ekor, potong 12, dada tanpa tulang",
    "",
    "🏪 Supermarket",
    "• Smoked beef (pengganti Beef bacon)",
  ]);
});

it("gives loose items by weight when rupiah is off, and adds the credit only when asked", () => {
  const text = titipText(items, { budget: 200_000, city: SALATIGA, date: DATE, rupiahForLoose: false, credit: true });
  expect(text).toContain("• Cabai rawit ± 45 g");
  expect(text.endsWith("\n\nDibuat pakai MenuCart")).toBe(true);
});

it("adds up the estimate of what's to buy", () => {
  const text = titipText([item("cabbage", "Cabbage", "Kol", [{ qty: 400, unit: "g" }])], {
    budget: 200_000,
    city: SALATIGA,
    date: DATE,
    rupiahForLoose: true,
    credit: false,
  });
  expect(text).toContain("Estimasi: Rp5.000 (budget Rp200.000)");
});
