import { db, getMeta, recordDeletes, saveSettings } from "./db";
import { getLibraryDish } from "./dishes/library";
import { weekIdFor } from "./plan";
import { slotKey } from "./sync/keys";
import type { Day, Meal, Settings, Slot } from "./types";
import { dayOfWeek, mondayOf, type ISODate } from "./week";

// First run: onboarding, the guest sample week and one-time tips.

/** The sample week's dishes (wireframe GuestSample): one shows a halal swap. */
const SAMPLE_DISHES = ["nasi-goreng-kampung", "spaghetti-carbonara", "soto-ayam"];

export async function completeOnboarding(settings: Settings, { today, sample }: { today: ISODate; sample: boolean }) {
  await saveSettings(settings);
  await db.meta.put({ id: "onboarded", at: Date.now() });
  if (sample) await seedSampleWeek(today, settings.meals);
}

/**
 * Puts 3 sample dishes in the next open lunch/dinner slots of this week
 * (from today on, since past days are read-only). Skipped if the week
 * already has something planned.
 */
export async function seedSampleWeek(today: ISODate, meals: Meal[]) {
  const weekStart = mondayOf(today);
  const weekId = weekIdFor(weekStart);
  await db.transaction("rw", db.weeks, db.slots, async () => {
    if ((await db.slots.where("weekId").equals(weekId).count()) > 0) return;
    const targets: { day: Day; meal: Meal }[] = [];
    for (let day = dayOfWeek(today); day <= 6; day++) {
      for (const meal of ["lunch", "dinner"] as const) {
        if (meals.includes(meal)) targets.push({ day: day as Day, meal });
      }
    }
    const now = Date.now();
    const slots: Slot[] = targets.slice(0, SAMPLE_DISHES.length).map((t, i) => {
      const dish = getLibraryDish(SAMPLE_DISHES[i])!;
      return { weekId, ...t, dishId: dish.id, dishName: dish.name, isSample: true, updatedAt: now };
    });
    if (!slots.length) return;
    await db.weeks.put({ id: weekId, ownerId: null, startDate: weekStart, updatedAt: now });
    await db.slots.bulkPut(slots);
  });
}

/** "Keep sample": the dishes become ordinary planned meals. */
export async function keepSample(weekId: string) {
  const samples = await db.slots.where("weekId").equals(weekId).filter((s) => !!s.isSample).toArray();
  await db.slots.bulkPut(samples.map((s) => ({ ...s, isSample: false, updatedAt: Date.now() })));
}

/** "Start empty": remove the sample dishes. */
export function clearSample(weekId: string) {
  return db.transaction("rw", db.slots, db.tombstones, async () => {
    const samples = await db.slots.where("weekId").equals(weekId).filter((s) => !!s.isSample).toArray();
    await db.slots.bulkDelete(samples.map((s) => [s.weekId, s.day, s.meal] as [string, Day, Meal]));
    await recordDeletes("slots", samples.map(slotKey));
  });
}

// At most 3 one-time tips (PRD guest first run), never shown again once dismissed.
export const TIPS = ["generate", "halal", "pantry"] as const;
export type TipId = (typeof TIPS)[number];

export async function dismissTip(id: TipId) {
  const seen = (await getMeta("tipsSeen"))?.ids ?? [];
  if (!seen.includes(id)) await db.meta.put({ id: "tipsSeen", ids: [...seen, id] });
}
