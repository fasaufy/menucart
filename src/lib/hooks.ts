"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { db, getSettings } from "./db";
import { DISH_LIBRARY, getLibraryDish } from "./dishes/library";
import { plannedDishes } from "./list/actions";
import { diffList, mergeDishes } from "./list/merge";
import type { Dish } from "./types";

// Live views over IndexedDB. Each returns undefined while loading.

export function useSettings() {
  return useLiveQuery(getSettings);
}

export function useWeekSlots(weekId: string | null) {
  return useLiveQuery(
    () => (weekId ? db.slots.where("weekId").equals(weekId).toArray() : []),
    [weekId],
  );
}

/** Library dishes plus the user's own, with a lookup by id. */
export function useDishes() {
  const own = useLiveQuery(() => db.dishes.toArray());
  return useMemo(() => {
    if (!own) return undefined;
    const ownById = new Map(own.map((d) => [d.id, d]));
    return {
      all: [...DISH_LIBRARY.filter((d) => !ownById.has(d.id)), ...own],
      get: (id: string | undefined): Dish | undefined =>
        // The saved copy wins: it's either the user's own dish or their edit of a library dish.
        id ? (ownById.get(id) ?? getLibraryDish(id)) : undefined,
    };
  }, [own]);
}

/** Most recently planned distinct dishes, across all weeks. */
export function useRecentDishIds(limit = 6) {
  return useLiveQuery(async () => {
    const recent = await db.slots.orderBy("updatedAt").reverse().limit(60).toArray();
    const ids: string[] = [];
    for (const slot of recent) {
      if (slot.dishId && !ids.includes(slot.dishId)) ids.push(slot.dishId);
      if (ids.length === limit) break;
    }
    return ids;
  }, [limit]);
}

/**
 * The active grocery list plus how the current plan differs from it.
 * null when no list has been generated yet.
 */
export function useActiveList() {
  return useLiveQuery(async () => {
    const meta = await db.meta.get("activeList");
    if (!meta) return null;
    const settings = await getSettings();
    const [items, planned] = await Promise.all([
      db.listItems.where("weekId").equals(meta.weekId).toArray(),
      plannedDishes(meta.weekId, settings),
    ]);
    const merged = mergeDishes(planned.dishes, settings.householdSize);
    return {
      weekId: meta.weekId,
      settings,
      items,
      diff: diffList(items, merged),
      meals: planned.meals,
      dishCount: planned.dishes.length,
      withoutIngredients: planned.withoutIngredients,
    };
  });
}
