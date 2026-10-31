import { formatAmount, roundForShopping, toBase } from "@/lib/list/units";
import type { SellUnit } from "@/lib/prices/pasar";
import { linePrice, quoteItem, type LinePrice } from "@/lib/prices/price";
import type { Strings } from "@/lib/strings";
import type { City, Language, ListItem, Section } from "@/lib/types";
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

/** "1/4", "1/2", "1 1/2", "2": how sellers say amounts. */
export function fraction(qty: number): string {
  const whole = Math.floor(qty + 1e-9);
  const rest = Math.round((qty - whole) * 4);
  const part = rest === 0 ? "" : rest === 2 ? "1/2" : `${rest}/4`;
  if (!part) return String(whole);
  return whole ? `${whole} ${part}` : part;
}

/** "1/2 kg", "2 bunches", "1 pack". */
export function formatBuy(buy: { qty: number; unit: SellUnit }, t: Strings): string {
  return `${fraction(buy.qty)} ${t.pasarUnits[buy.unit](buy.qty)}`;
}

/** What an Item row shows for a line's money: its price, the unit pill, and the amount detail. */
export type LineMoney = {
  price?: LinePrice;
  /** "2 ikat" under the price; none for loose items, bought by rupiah. */
  unit?: string;
  /** "± 50 g" for loose items, "400 g needed" when the sellable amount is bigger. */
  amount?: string;
};

export function lineMoney(item: ListItem, city: City, t: Strings, language: Language): LineMoney {
  const price = linePrice(item, city);
  const quote = quoteItem(item, city);
  if (!quote) return { price };
  if (quote.buy.loose) {
    const needed = roundForShopping({ qty: quote.needed.qty, unit: quote.needed.unit });
    return { price, amount: t.list.about(formatAmount(needed, t.units, localeFor(language))) };
  }
  return {
    price,
    unit: formatBuy(quote.buy, t),
    amount: quote.buy.roundedUp ? t.list.needed(amountLines(item, t, language).join(" + ")) : undefined,
  };
}

/** "400 g needed: Capcay 200 g + Tahu tek 200 g", for a line several dishes share. */
export function neededFrom(item: ListItem, t: Strings, language: Language): string | undefined {
  if (item.uses.length < 2 || item.uses.some((u) => !u.amounts?.length)) return undefined;
  const locale = localeFor(language);
  const parts = item.uses.map((u) => {
    const dish = u.count > 1 ? `${u.dishName} ×${u.count}` : u.dishName;
    return `${dish} ${u.amounts!.map((a) => formatAmount(a, t.units, locale)).join(" + ")}`;
  });
  return t.list.neededFrom(amountLines(item, t, language).join(" + "), parts.join(" + "));
}

/**
 * The Item row's right side for a line: at home, the amount; priced, the
 * price (with the unit pill when sold by unit); otherwise just the amount.
 */
export function rowRight(item: Pick<ListItem, "state" | "amounts">, money: LineMoney, t: Strings, language: Language) {
  const amount = amountLines(item, t, language).join(" + ");
  if (item.state === "at_home" || !money.price) return { right: "atHome" as const, unit: amount };
  return {
    right: money.unit ? ("priceUnit" as const) : ("price" as const),
    price: money.price.cost,
    estimated: money.price.estimated,
    unit: money.unit,
  };
}

/**
 * By aisle detail: "± 50 g · Soto ayam" for loose items, "400 g needed: Capcay
 * 200 g + Tahu tek 200 g" when dishes share a line, else "400 g needed · Capcay".
 */
export function aisleDetail(item: ListItem, money: LineMoney, t: Strings, language: Language): string {
  const shared = money.unit ? neededFrom(item, t, language) : undefined;
  return shared ?? [money.amount, usesText(item, t)].filter(Boolean).join(" · ");
}

/** Lines sorted by their name in the UI language. */
export function byName<T extends Pick<ListItem, "name" | "localName">>(items: T[], language: Language): T[] {
  return [...items].sort((a, b) => itemNames(a, language).primary.localeCompare(itemNames(b, language).primary));
}
