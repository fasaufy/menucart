import { db, getSettings } from "../db";
import { getLibraryDish } from "../dishes/library";
import { pendingSwaps } from "../dishes/swaps";
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
  const withoutIngredients = [
    ...new Set(dishes.filter((d) => d.ingredients.length === 0).map((d) => d.name)),
  ];
  return { meals, dishes, withoutIngredients };
}

/** Builds (or refreshes) the week's list and makes it the active one. */
export function generateList(weekStart: ISODate) {
  const weekId = weekIdFor(weekStart);
  return db.transaction(
    "rw",
    [db.settings, db.slots, db.dishes, db.listItems, db.meta],
    async () => {
      const settings = await getSettings();
      const { dishes } = await plannedDishes(weekId, settings);
      const merged = mergeDishes(dishes, settings.householdSize);
      const existing = await db.listItems.where("weekId").equals(weekId).toArray();
      const { put, remove } = reconcile(existing, merged, weekId, Date.now());
      await db.listItems.bulkDelete(remove.map((key) => [weekId, key] as [string, string]));
      await db.listItems.bulkPut(put);
      await db.meta.put({ id: "activeList", weekId });
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
