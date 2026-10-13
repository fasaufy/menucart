import { formatAmount } from "@/lib/list/units";
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

/** Primary name in the UI language; the other one (if different) as secondary. */
export function itemNames(item: ListItem, language: Language) {
  const local = item.localName && item.localName !== item.name ? item.localName : undefined;
  return language === "id"
    ? { primary: item.localName ?? item.name, secondary: local ? item.name : undefined }
    : { primary: item.name, secondary: local };
}

/** One string per amount; more than one = incompatible units shown as sub-lines. */
export function amountLines(item: ListItem, t: Strings, language: Language) {
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
