import type { Amount, Day, Dish, ListItem, ListItemState, Meal } from "../types";
import { effectiveIngredients } from "../dishes/swaps";
import { roundForShopping, toBase } from "./units";

// Pure list logic: no IndexedDB, so it's unit-tested directly.

export type MergedItem = Omit<ListItem, "weekId" | "state" | "replacedBy" | "noLongerNeeded" | "updatedAt">;

/** Pantry staples start as "probably at home". */
export const STAPLE_KEYS = new Set(["salt", "cooking_oil", "sugar", "black_pepper"]);

/**
 * Merges planned dishes into one line per ingredient key. Same key and a
 * compatible unit → summed; incompatible units → separate amounts.
 * Quantities scale from each dish's servings to the household size, and a
 * dish planned twice counts twice. Chosen halal swaps are applied first.
 */
export function mergeDishes(planned: Dish[], householdSize: number): MergedItem[] {
  const counts = new Map<string, { dish: Dish; count: number }>();
  for (const dish of planned) {
    const entry = counts.get(dish.id);
    if (entry) entry.count++;
    else counts.set(dish.id, { dish, count: 1 });
  }

  const items = new Map<string, MergedItem & { totals: Map<string, number> }>();
  for (const { dish, count } of counts.values()) {
    const factor = (householdSize / dish.servings) * count;
    for (const ing of effectiveIngredients(dish)) {
      let item = items.get(ing.key);
      if (!item) {
        item = {
          key: ing.key,
          name: ing.name,
          localName: ing.localName,
          section: ing.section,
          halal: ing.halal,
          amounts: [],
          uses: [],
          totals: new Map(),
        };
        items.set(ing.key, item);
      }
      if (ing.swappedFrom && !item.swappedFrom) item.swappedFrom = ing.swappedFrom;
      const base = toBase({ qty: ing.qty * factor, unit: ing.unit });
      item.totals.set(base.unit, (item.totals.get(base.unit) ?? 0) + base.qty);
      let use = item.uses.find((u) => u.dishId === dish.id);
      if (!use) {
        use = { dishId: dish.id, dishName: dish.name, count, amounts: [] };
        item.uses.push(use);
      }
      addAmount(use.amounts!, base);
    }
  }

  return [...items.values()].map(({ totals, ...item }) => ({
    ...item,
    amounts: [...totals].map(([unit, qty]) => roundForShopping({ qty, unit })),
    uses: item.uses.map((u) => ({ ...u, amounts: u.amounts?.map(roundForShopping) })),
  }));
}

/** Sums into the amount with the same unit, or adds one. */
function addAmount(amounts: Amount[], { qty, unit }: Amount) {
  const same = amounts.find((a) => a.unit === unit);
  if (same) same.qty += qty;
  else amounts.push({ qty, unit });
}

/**
 * Applies a fresh merge to the saved list so ticks (and the user's prices,
 * bought prices and notes) survive regeneration:
 * kept keys keep their state, new keys start to_buy (staples at_home),
 * dropped keys are deleted unless already bought, which stay flagged
 * "no longer needed". Carried-over lines are kept untouched.
 */
export function reconcile(
  existing: ListItem[],
  merged: MergedItem[],
  weekId: string,
  now: number,
): { put: ListItem[]; remove: string[] } {
  const byKey = new Map(existing.map((i) => [i.key, i]));
  const mergedKeys = new Set(merged.map((m) => m.key));

  const put: ListItem[] = merged.map((m) => {
    const prev = byKey.get(m.key);
    const state: ListItemState = prev?.state ?? (STAPLE_KEYS.has(m.key) ? "at_home" : "to_buy");
    return {
      ...m,
      weekId,
      state,
      replacedBy: prev?.replacedBy,
      userPrice: prev?.userPrice,
      boughtPrice: prev?.boughtPrice,
      note: prev?.note,
      updatedAt: now,
    };
  });

  const remove: string[] = [];
  for (const item of existing) {
    if (mergedKeys.has(item.key)) continue;
    // Carried-over lines don't come from this week's dishes; keep them as they are.
    if (item.carriedOver) {
      put.push(item);
      continue;
    }
    if (item.state === "bought") put.push({ ...item, noLongerNeeded: true, updatedAt: now });
    else remove.push(item.key);
  }
  return { put, remove };
}

/** What the plan would change in the saved list, for the "Plan changed" banner. */
export function diffList(existing: ListItem[], merged: MergedItem[]) {
  const live = existing.filter((i) => !i.noLongerNeeded && !i.carriedOver);
  const byKey = new Map(live.map((i) => [i.key, i]));
  const mergedKeys = new Set(merged.map((m) => m.key));
  let added = 0;
  let changed = 0;
  for (const m of merged) {
    const prev = byKey.get(m.key);
    if (!prev) added++;
    else if (!sameAmounts(prev.amounts, m.amounts)) changed++;
  }
  const removed = live.filter((i) => !mergedKeys.has(i.key)).length;
  return { added, changed, removed };
}

function sameAmounts(a: ListItem["amounts"], b: ListItem["amounts"]) {
  return (
    a.length === b.length &&
    a.every((x) => b.some((y) => y.unit === x.unit && Math.abs(y.qty - x.qty) < 1e-9))
  );
}

export type ListChange = {
  /** Dishes new to the list, with where they sit in the plan. */
  added: { name: string; day: Day; meal: Meal }[];
  /** Dishes no longer on the plan. */
  removed: string[];
  /** Lines that weren't on the list before (tagged "New"). */
  addedKeys: string[];
  removedCount: number;
};

/**
 * What a regeneration changed, for the "Plan changed · Rendang added" banner.
 * Undefined for a first list or when nothing visible changed.
 */
export function describeChange(
  existing: ListItem[],
  next: ListItem[],
  removedKeys: string[],
  planned: { day: Day; meal: Meal; dish: { id: string; name: string } }[],
): ListChange | undefined {
  const before = existing.filter((i) => !i.carriedOver);
  if (!before.length) return undefined;
  const beforeKeys = new Set(before.map((i) => i.key));
  const beforeDishes = new Map(before.flatMap((i) => i.uses.map((u) => [u.dishId, u.dishName] as const)));
  const afterDishes = new Set(next.flatMap((i) => i.uses.map((u) => u.dishId)));

  const added: ListChange["added"] = [];
  for (const { day, meal, dish } of planned) {
    if (beforeDishes.has(dish.id) || added.some((a) => a.name === dish.name)) continue;
    added.push({ name: dish.name, day, meal });
  }
  const removed = [...beforeDishes].filter(([id]) => !afterDishes.has(id)).map(([, name]) => name);
  const addedKeys = next.filter((i) => !beforeKeys.has(i.key) && !i.carriedOver).map((i) => i.key);

  if (!added.length && !removed.length && !addedKeys.length && !removedKeys.length) return undefined;
  return { added, removed, addedKeys, removedCount: removedKeys.length };
}
