import { db, getSettings } from "../db";
import { getLibraryDish } from "../dishes/library";
import { weekIdFor } from "../plan";
import type { Dish, ListItemState, Settings } from "../types";
import type { ISODate } from "../week";
import { mergeDishes, reconcile } from "./merge";

/** The week's planned dishes (one entry per filled slot, so repeats count). */
export async function plannedDishes(weekId: string, settings: Settings) {
  const slots = await db.slots.where("weekId").equals(weekId).toArray();
  const ownIds = slots.map((s) => s.dishId).filter((id): id is string => !!id && !getLibraryDish(id));
  const own = new Map((await db.dishes.bulkGet(ownIds)).filter((d) => !!d).map((d) => [d.id, d]));

  const dishes: Dish[] = [];
  for (const slot of slots) {
    if (!settings.meals.includes(slot.meal) || !slot.dishId) continue;
    const dish = getLibraryDish(slot.dishId) ?? own.get(slot.dishId);
    if (dish) dishes.push(dish);
  }
  const withoutIngredients = [
    ...new Set(dishes.filter((d) => d.ingredients.length === 0).map((d) => d.name)),
  ];
  return { dishes, withoutIngredients };
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
