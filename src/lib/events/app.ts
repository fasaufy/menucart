import { db, getSettings } from "../db";
import { plannedDishes } from "../list/actions";
import { weekMoney } from "../prices/price";
import { markPlanningStart, track, trackListGenerated } from "./track";

// The tester-week events with what they need from the app's data. All fire and forget.

export type AddMethod = "pick" | "own" | "repeat_day" | "repeat_week" | "copy_week";

/** Dishes went into a week's plan; the first one starts that week's planning time. */
export function trackDishAdded(weekStart: string, method: AddMethod, count = 1) {
  if (count < 1) return;
  void markPlanningStart(weekStart)
    .catch(() => {})
    .then(() => track("dish_added", { week_start: weekStart, method, count }));
}

/** After Generate: how many dishes and what the week costs. */
export async function trackGenerated(weekStart: string) {
  try {
    const settings = await getSettings();
    const items = await db.listItems.where("weekId").equals(weekStart).toArray();
    const { meals } = await plannedDishes(weekStart, settings);
    const money = weekMoney(items, settings.weeklyBudget, settings.city);
    await trackListGenerated(weekStart, {
      dish_count: meals.length,
      total: money.spend,
      budget_set: settings.weeklyBudget !== null,
    });
  } catch {
    // never in the way
  }
}
