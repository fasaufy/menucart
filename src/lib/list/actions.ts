import { db, getSettings, recordDeletes } from "../db";
import { listItemKey } from "../sync/keys";
import { getLibraryDish } from "../dishes/library";
import { pendingSwaps, SWAP_RULES } from "../dishes/swaps";
import { setSwapChoices } from "../dishes/edit";
import { weekIdFor } from "../plan";
import type { Day, Dish, ListItemState, Meal, Settings } from "../types";
import type { ISODate } from "../week";
import { mergeDishes, reconcile } from "./merge";

const MEAL_ORDER: Meal[] = ["breakfast", "lunch", "dinner"];

export type PlannedMeal = { day: Day; meal: Meal; dish: Dish };

/**
 * The week's planned dishes, one entry per filled slot (so repeats count),
 * in day and meal order.
 */
export async function plannedDishes(weekId: string, settings: Settings) {
  const slots = await db.slots.where("weekId").equals(weekId).toArray();
  const ids = [...new Set(slots.map((s) => s.dishId).filter((id): id is string => !!id))];
  // Saved dishes (own, or edited library dishes) override the library.
  const own = new Map((await db.dishes.bulkGet(ids)).filter((d) => !!d).map((d) => [d.id, d]));

  const meals: PlannedMeal[] = [];
  for (const slot of slots) {
    if (!settings.meals.includes(slot.meal) || !slot.dishId) continue;
    const dish = own.get(slot.dishId) ?? getLibraryDish(slot.dishId);
    if (dish) meals.push({ day: slot.day, meal: slot.meal, dish });
  }
  meals.sort((a, b) => a.day - b.day || MEAL_ORDER.indexOf(a.meal) - MEAL_ORDER.indexOf(b.meal));

  const dishes = meals.map((m) => m.dish);
  const empty = dishes.filter((d) => d.ingredients.length === 0);
  const withoutIngredients = [...new Set(empty.filter((d) => d.aiStatus !== "pending").map((d) => d.name))];
  // Waiting for AI generation (offline, or in progress).
  const awaitingAi = [...new Set(empty.filter((d) => d.aiStatus === "pending").map((d) => d.name))];
  return { meals, dishes, withoutIngredients, awaitingAi };
}

/** Builds (or refreshes) the week's list and makes it the active one. */
export function generateList(weekStart: ISODate) {
  const weekId = weekIdFor(weekStart);
  return db.transaction(
    "rw",
    [db.settings, db.slots, db.dishes, db.listItems, db.meta, db.tombstones],
    async () => {
      const settings = await getSettings();
      const { dishes } = await plannedDishes(weekId, settings);
      const merged = mergeDishes(dishes, settings.householdSize);
      const existing = await db.listItems.where("weekId").equals(weekId).toArray();
      const { put, remove } = reconcile(existing, merged, weekId, Date.now());
      await db.listItems.bulkDelete(remove.map((key) => [weekId, key] as [string, string]));
      await recordDeletes("listItems", remove.map((key) => listItemKey({ weekId, key })));
      await db.listItems.bulkPut(put);
      await db.meta.put({ id: "activeList", weekId, updatedAt: Date.now() });
    },
  );
}

export function setItemState(weekId: string, key: string, state: ListItemState) {
  return db.listItems.update([weekId, key], { state, updatedAt: Date.now() });
}

/** Generate goes through the halal review only if a dish has an undecided non-halal ingredient. */
export async function needsHalalReview(weekId: string) {
  const settings = await getSettings();
  if (!settings.halalMode) return false;
  const { dishes } = await plannedDishes(weekId, settings);
  return dishes.some((d) => pendingSwaps(d).length > 0);
}

/** "Can't find": buy something else instead (label shown on the list), or undefined to undo. */
export function replaceItem(weekId: string, key: string, replacedBy: string | undefined) {
  return db.listItems.update([weekId, key], { replacedBy, state: "to_buy", updatedAt: Date.now() });
}

/**
 * "Always apply halal swaps": give every undecided non-halal ingredient in the
 * week's dishes its top-ranked swap. Choices already made (incl. "keep") stay.
 */
export async function autoApplySwaps(weekId: string) {
  const settings = await getSettings();
  if (!settings.halalMode || !settings.autoSwap) return;
  const { dishes } = await plannedDishes(weekId, settings);
  const unique = new Map(dishes.map((d) => [d.id, d]));
  for (const dish of unique.values()) {
    const pending = pendingSwaps(dish);
    if (!pending.length) continue;
    await setSwapChoices(
      dish,
      Object.fromEntries(pending.map((i) => [i.key, SWAP_RULES.get(i.key)!.options[0].id])),
    );
  }
}

/**
 * Week rollover: carry last week's unbought items into this week's list as
 * their own lines, then build this week's list and make it the active one.
 */
export async function carryOver(fromWeekId: string, toStart: ISODate) {
  const toId = weekIdFor(toStart);
  const unbought = (await db.listItems.where("weekId").equals(fromWeekId).toArray()).filter(
    (i) => i.state === "to_buy" && !i.noLongerNeeded && !i.carriedOver,
  );
  await db.listItems.bulkPut(
    unbought.map((i) => ({
      ...i,
      weekId: toId,
      key: `carried:${i.key}`,
      carriedOver: true,
      replacedBy: undefined,
      updatedAt: Date.now(),
    })),
  );
  await generateList(toStart);
}
