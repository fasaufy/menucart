import { expect, it } from "vitest";
import { getStrings } from "../strings";
import type { ListItem } from "../types";
import { shareText } from "./share";

const item = (key: string, name: string, section: ListItem["section"], qty: number, unit: string, extra: Partial<ListItem> = {}): ListItem => ({
  weekId: "w",
  key,
  name,
  section,
  halal: "halal",
  amounts: [{ qty, unit }],
  uses: [],
  state: "to_buy",
  updatedAt: 0,
  ...extra,
});

it("shares only what's left to buy, grouped by section", () => {
  const text = shareText(
    [
      item("garlic", "Garlic", "produce", 10, "clove", { localName: "Bawang putih" }),
      item("egg", "Eggs", "dairy_eggs", 6, "pcs"),
      item("salt", "Salt", "dry_goods_spices", 4, "tsp", { state: "at_home" }),
      item("rice", "Rice", "dry_goods_spices", 700, "g", { state: "bought" }),
      item("beef_bacon", "Beef bacon", "meat_poultry", 100, "g", { replacedBy: "Smoked beef slices · 100 g" }),
    ],
    "Mon 12 – Sun 18 Oct",
    getStrings("en"),
    "en",
  );
  expect(text).toBe(
    [
      "MenuCart grocery list · Mon 12 – Sun 18 Oct",
      "",
      "*Produce*",
      "- Garlic — 10 cloves",
      "",
      "*Meat & Poultry*",
      "- Smoked beef slices · 100 g (instead of Beef bacon)",
      "",
      "*Dairy & Eggs*",
      "- Eggs — 6",
      "",
      "Made with MenuCart",
    ].join("\n"),
  );
});

it("uses local names in Bahasa Indonesia", () => {
  const text = shareText([item("garlic", "Garlic", "produce", 1, "clove", { localName: "Bawang putih" })], "x", getStrings("id"), "id");
  expect(text).toContain("- Bawang putih — 1 siung");
  expect(text).toContain("*Sayur & Buah*");
});
