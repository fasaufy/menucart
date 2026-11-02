import { mergeDishes } from "../list/merge";
import type { Amount, City, Dish, ListItem } from "../types";
import { PASAR, type PasarEntry, type SellUnit } from "./pasar";
import { SOURCES, type SourceInfo } from "./sources";

// Pure money logic: what to buy at the pasar for a list line, what it costs,
// and the week's totals against the budget. No IndexedDB, so it's unit-tested.

/** Loose items: ask for a rupiah amount, rounded up to Rp1.000, at least Rp2.000. */
const LOOSE_STEP = 1_000;
const LOOSE_MIN = 2_000;
/** Unit prices are averages, so line costs round to the nearest Rp500. */
const ROUND = 500;

export type Quote = {
  /** Loose: a rupiah amount covering `needed`. Otherwise a count of sell units ("½ ekor", "2 ikat"). */
  buy: { loose: true } | { loose: false; qty: number; unit: SellUnit; /** More than the recipes need (½ kg for 400 g). */ roundedUp: boolean };
  /** What the recipes need, in the entry's base unit. */
  needed: { qty: number; unit: PasarEntry["base"] };
  cost: number;
  source: SourceInfo;
};

/** The list amounts in the entry's base unit; undefined if any can't convert. */
export function neededBase(amounts: Amount[], entry: PasarEntry): number | undefined {
  let total = 0;
  for (const { qty, unit } of amounts) {
    // Grams and millilitres are close enough for sauces, milk and oil.
    const same = unit === entry.base || (entry.base !== "pcs" && (unit === "g" || unit === "ml"));
    const factor = same ? 1 : entry.per?.[unit];
    if (factor === undefined) return undefined;
    total += qty * factor;
  }
  return total;
}

/** The estimate for a list line where the user shops, or undefined if there's no price. */
export function quoteItem(item: Pick<ListItem, "key" | "amounts" | "buyBy">, city: City): Quote | undefined {
  const entry = PASAR[item.key as keyof typeof PASAR];
  if (!entry) return undefined;
  const needed = neededBase(item.amounts, entry);
  if (needed === undefined || needed <= 0) return undefined;
  const price = SOURCES.map((s) => s.unitPrice(entry, city)).find(Boolean);
  if (!price) return undefined;

  // "By piece": counted ("7 butir", "3 buah") at the weight price, never loose.
  const byPiece = item.buyBy === "piece" && entry.piece;
  const { size, step, unit } = byPiece ? { size: entry.piece!.grams, step: 1, unit: entry.piece!.unit } : entry.sell;
  const unitPrice = byPiece ? (price.amount * entry.piece!.grams) / entry.sell.size : price.amount;
  if (entry.loose && !byPiece) {
    const exact = (needed / size) * price.amount;
    return {
      buy: { loose: true },
      needed: { qty: needed, unit: entry.base },
      cost: Math.max(LOOSE_MIN, Math.ceil(exact / LOOSE_STEP) * LOOSE_STEP),
      source: price.info,
    };
  }
  // Round up to what's sellable: 400 g of kol is ½ kg, 3 stalks of serai is 1 ikat.
  const qty = Math.ceil(needed / size / step - 1e-9) * step;
  return {
    buy: { loose: false, qty, unit, roundedUp: qty * size - needed > 1e-6 },
    needed: { qty: needed, unit: entry.base },
    cost: Math.max(ROUND, Math.round((qty * unitPrice) / ROUND) * ROUND),
    source: price.info,
  };
}

export type LinePrice = { cost: number; source: SourceInfo; estimated: boolean };

/**
 * What a line costs this week: the price when it was ticked bought, else the
 * user's own price, else the estimate. Undefined means "Add price".
 */
export function linePrice(item: ListItem, city: City): LinePrice | undefined {
  let price: LinePrice | undefined;
  if (item.userPrice !== undefined) price = { cost: item.userPrice, source: { id: "user", area: city.name }, estimated: false };
  else {
    const quote = quoteItem(item, city);
    price = quote && { cost: quote.cost, source: quote.source, estimated: true };
  }
  // Prices can change mid-week; what was already bought keeps its price.
  if (item.state === "bought" && item.boughtPrice !== undefined) {
    return { cost: item.boughtPrice, source: price?.source ?? { id: "user", area: city.name }, estimated: price?.estimated ?? false };
  }
  return price;
}

export type WeekMoney = {
  budget: number;
  /** Still to buy plus already bought: the week's food spend. */
  spend: number;
  /** budget − spend; negative when over. */
  left: number;
  toBuyCount: number;
  atHomeCount: number;
  /** Keys of lines that count but have no price; the total is then approximate. */
  missing: string[];
  /** Priced lines ticked "at home", with what buying them would have cost. */
  atHome: { key: string; cost: number }[];
};

/**
 * The week against its budget. To buy and bought lines count (bought at the
 * price when ticked); at home and skipped ones don't.
 */
export function weekMoney(items: ListItem[], budget: number, city: City): WeekMoney {
  let spend = 0;
  let toBuyCount = 0;
  let atHomeCount = 0;
  const missing: string[] = [];
  const atHome: WeekMoney["atHome"] = [];

  for (const item of items) {
    if (item.state === "skipped") continue;
    const price = linePrice(item, city);
    if (item.state === "at_home") {
      atHomeCount++;
      if (price) atHome.push({ key: item.key, cost: price.cost });
      continue;
    }
    if (item.state === "to_buy") toBuyCount++;
    if (price) spend += price.cost;
    else missing.push(item.key);
  }

  return { budget, spend, left: budget - spend, toBuyCount, atHomeCount, missing, atHome };
}

/**
 * A dish's share of the week's spend ("≈Rp9.000 · 2 portions"): for each of
 * its ingredients, the part of that line's cost it uses. Lines at home or
 * skipped cost the dish nothing. Rounded to Rp500.
 */
export function dishCost(
  dish: Dish,
  lines: Map<string, ListItem>,
  householdSize: number,
  city: City,
): { cost: number; missing: boolean } {
  let cost = 0;
  let missing = false;
  for (const own of mergeDishes([dish], householdSize)) {
    const line = lines.get(own.key);
    if (!line || line.state === "at_home" || line.state === "skipped") continue;
    const price = linePrice(line, city);
    if (!price) {
      missing = true;
      continue;
    }
    const entry = PASAR[own.key as keyof typeof PASAR];
    const mine = entry && neededBase(own.amounts, entry);
    const all = entry && neededBase(line.amounts, entry);
    // Share by amount; if the amounts can't be compared, split evenly between the dishes using it.
    const uses = line.uses.reduce((n, u) => n + u.count, 0) || 1;
    const share = mine && all ? Math.min(1, mine / all) : 1 / uses;
    cost += price.cost * share;
  }
  return { cost: Math.round(cost / ROUND) * ROUND, missing };
}

/** Prices more than 3× or under ⅓ of the estimate get a second look before saving (E2). */
const CHECK_RATIO = 3;

export type PriceCheck = { tooHigh: boolean; ratio: number; suggestion?: number };

/**
 * Flags a typed price far from the estimate, usually a zero too many or too
 * few, and suggests the shift that lands closest to it. Undefined when fine.
 */
export function checkPrice(amount: number, estimate: number): PriceCheck | undefined {
  if (amount <= 0 || estimate <= 0) return undefined;
  const ratio = amount / estimate;
  if (ratio <= CHECK_RATIO && ratio >= 1 / CHECK_RATIO) return undefined;
  const off = (n: number) => Math.abs(Math.log(n / estimate));
  const suggestion = [amount / 100, amount / 10, amount * 10, amount * 100]
    // Only a shift that lands close to the estimate is a likely typo.
    .filter((n) => Number.isInteger(n) && n >= 500 && n / estimate <= 2 && n / estimate >= 0.5)
    .sort((a, b) => off(a) - off(b))[0];
  return { tooHigh: ratio > 1, ratio, suggestion };
}
