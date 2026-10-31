import { formatAmount, roundForShopping, toBase } from "@/lib/list/units";
import type { Strings } from "@/lib/strings";
import type { Language, ListItem, Section } from "@/lib/types";
import { localeFor } from "@/lib/week";

export const SECTION_ORDER: Section[] = [
  "produce",
  "meat_poultry",
  "seafood",
  "dairy_eggs",
  "dry_goods_spices",
  "others",
];

/** The name in the UI language only: English mode never mixes in Bahasa names, and vice versa. */
export function itemNames(item: Pick<ListItem, "name" | "localName">, language: Language) {
  return { primary: language === "id" ? (item.localName ?? item.name) : item.name };
}

/** One string per amount; more than one = incompatible units shown as sub-lines. */
export function amountLines(item: Pick<ListItem, "amounts">, t: Strings, language: Language) {
  return item.amounts.map((a) => formatAmount(a, t.units, localeFor(language)));
}

/** "Nasi goreng kampung, Soto ayam ×2 +1" */
export function usesText(item: ListItem, t: Strings, max = 2) {
  const names = item.uses.map((u) => (u.count > 1 ? `${u.dishName} ×${u.count}` : u.dishName));
  if (names.length <= max) return names.join(", ");
  return `${names.slice(0, max).join(", ")} ${t.list.more(names.length - max)}`;
}

export function groupBySection(items: ListItem[], language: Language) {
  return SECTION_ORDER.map((section) => ({
    section,
    items: items
      .filter((i) => i.section === section)
      .sort((a, b) =>
        itemNames(a, language).primary.localeCompare(itemNames(b, language).primary),
      ),
  })).filter((g) => g.items.length > 0);
}

/** A recipe quantity scaled by `factor` (household / servings), rounded and formatted. */
export function formatQty(qty: number, unit: string, factor: number, t: Strings, language: Language) {
  return formatAmount(roundForShopping(toBase({ qty: qty * factor, unit })), t.units, localeFor(language));
}
