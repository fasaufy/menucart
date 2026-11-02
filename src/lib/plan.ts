import { AI_GENERATION_ENABLED } from "./ai-config";
import { db, recordDeletes } from "./db";
import { slotKey } from "./sync/keys";
import { normalize } from "./dishes/search";
import type { Day, Dish, Meal, Slot, SlotDish } from "./types";
import type { ISODate } from "./week";

// Planner writes. All local (IndexedDB); nothing here touches the network.
// A week's id is its Monday until accounts exist, which keeps writes idempotent.

export type SlotRef = { day: Day; meal: Meal };
/** One dish within a meal: its position in slotDishes(). */
export type SlotDishRef = SlotRef & { index: number };
type DishPick = Pick<Dish, "id" | "name">;

export function weekIdFor(startDate: ISODate): string {
  return startDate;
}

/** Every dish planned in a meal, first dish first. */
export function slotDishes(slot: Slot | undefined): SlotDish[] {
  if (!slot) return [];
  return [{ dishId: slot.dishId, dishName: slot.dishName }, ...(slot.more ?? [])];
}

/**
 * The slot record for these dishes, or null when there are none left. An edit
 * by the user makes the meal theirs, so it stops being part of the sample week.
 */
function slotWith({ weekId, day, meal }: Pick<Slot, "weekId" | "day" | "meal">, dishes: SlotDish[]): Slot | null {
  if (!dishes.length) return null;
  const [first, ...more] = dishes;
  return {
    weekId,
    day,
    meal,
    dishId: first.dishId,
    dishName: first.dishName,
    ...(more.length ? { more } : {}),
    updatedAt: Date.now(),
  };
}

async function ensureWeek(startDate: ISODate) {
  const id = weekIdFor(startDate);
  if (!(await db.weeks.get(id))) {
    await db.weeks.put({ id, ownerId: null, startDate, updatedAt: Date.now() });
  }
  return id;
}

const pick = (dish: DishPick): SlotDish => ({ dishId: dish.id, dishName: dish.name });

/** Saves a meal's dishes, deleting the slot (and syncing the deletion) when none are left. */
async function writeSlot(weekId: string, { day, meal }: SlotRef, existing: Slot | undefined, dishes: SlotDish[]) {
  const next = slotWith(existing ?? { weekId, day, meal }, dishes);
  if (next) await db.slots.put(next);
  else if (existing) {
    await db.slots.delete([weekId, day, meal]);
    await recordDeletes("slots", [slotKey({ weekId, day, meal })]);
  }
}

/** Adds a dish to a meal ("Add lunch", "Add more menu"). A dish already in the meal isn't added twice. */
export function addSlotDish(startDate: ISODate, ref: SlotRef, dish: DishPick) {
  return db.transaction("rw", db.weeks, db.slots, db.tombstones, async () => {
    const weekId = await ensureWeek(startDate);
    const slot = await db.slots.get([weekId, ref.day, ref.meal]);
    const dishes = slotDishes(slot);
    if (dishes.some((d) => d.dishId === dish.id)) return;
    await writeSlot(weekId, ref, slot, [...dishes, pick(dish)]);
  });
}

/** "Change dish": replaces one dish in a meal. */
export function replaceSlotDish(startDate: ISODate, ref: SlotDishRef, dish: DishPick) {
  return db.transaction("rw", db.weeks, db.slots, db.tombstones, async () => {
    const weekId = await ensureWeek(startDate);
    const slot = await db.slots.get([weekId, ref.day, ref.meal]);
    const dishes = slotDishes(slot);
    // Changing to a dish that's already in the meal just drops the old one.
    const next = dishes.some((d, i) => i !== ref.index && d.dishId === dish.id)
      ? dishes.filter((_, i) => i !== ref.index)
      : dishes.map((d, i) => (i === ref.index ? pick(dish) : d));
    await writeSlot(weekId, ref, slot, next);
  });
}

/** Removes one dish from a meal; the meal is cleared when it was the last one. */
export function removeSlotDish(startDate: ISODate, ref: SlotDishRef) {
  const weekId = weekIdFor(startDate);
  return db.transaction("rw", db.slots, db.tombstones, async () => {
    const slot = await db.slots.get([weekId, ref.day, ref.meal]);
    await writeSlot(weekId, ref, slot, slotDishes(slot).filter((_, i) => i !== ref.index));
  });
}

/** Moves one dish to another meal, after the dishes already there. */
export function moveSlotDish(startDate: ISODate, from: SlotDishRef, to: SlotRef) {
  const weekId = weekIdFor(startDate);
  return db.transaction("rw", db.slots, db.tombstones, async () => {
    const [a, b] = await Promise.all([
      db.slots.get([weekId, from.day, from.meal]),
      db.slots.get([weekId, to.day, to.meal]),
    ]);
    const moving = slotDishes(a)[from.index];
    if (!moving) return;
    await writeSlot(weekId, from, a, slotDishes(a).filter((_, i) => i !== from.index));
    const target = slotDishes(b);
    if (!target.some((d) => d.dishId && d.dishId === moving.dishId)) {
      await writeSlot(weekId, to, b, [...target, moving]);
    }
  });
}

/**
 * "Repeat to all week": copies a day's meals onto the given days. Only meals
 * that are still empty there are filled; nothing already planned is replaced.
 * Returns how many days got at least one meal.
 */
export function repeatDay(startDate: ISODate, from: Day, days: Day[], meals: Meal[]) {
  return db.transaction("rw", db.weeks, db.slots, async () => {
    const weekId = await ensureWeek(startDate);
    const existing = await db.slots.where("weekId").equals(weekId).toArray();
    const source = existing.filter((s) => s.day === from && meals.includes(s.meal));
    const taken = new Set(existing.map((s) => `${s.day}-${s.meal}`));
    const now = Date.now();
    const toAdd: Slot[] = [];
    const filledDays = new Set<Day>();
    for (const day of days) {
      if (day === from) continue;
      for (const s of source) {
        if (taken.has(`${day}-${s.meal}`)) continue;
        toAdd.push({ ...s, day, isSample: false, updatedAt: now });
        filledDays.add(day);
      }
    }
    await db.slots.bulkPut(toAdd);
    return filledDays.size;
  });
}

/**
 * "Repeat for a whole day": puts one dish in the day's other meals that are
 * still empty. Nothing already planned is replaced. Returns how many meals it filled.
 */
export function repeatForDay(startDate: ISODate, ref: SlotDishRef, meals: Meal[]) {
  return db.transaction("rw", db.weeks, db.slots, async () => {
    const weekId = await ensureWeek(startDate);
    const dish = slotDishes(await db.slots.get([weekId, ref.day, ref.meal]))[ref.index];
    if (!dish) return 0;
    const filled: Slot[] = [];
    for (const meal of meals) {
      if (meal === ref.meal || (await db.slots.get([weekId, ref.day, meal]))) continue;
      filled.push(slotWith({ weekId, day: ref.day, meal }, [dish])!);
    }
    await db.slots.bulkPut(filled);
    return filled.length;
  });
}

// crypto.randomUUID only exists in secure contexts (https, localhost), not
// when testing over plain http on the local network.
function newId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Saves a dish the library doesn't know. Reuses one with the same name. */
export async function saveOwnDish(name: string): Promise<Dish> {
  const trimmed = name.trim().replace(/\s+/g, " ");
  const key = normalize(trimmed);
  const existing = (await db.dishes.toArray()).find((d) => normalize(d.name) === key);
  if (existing) return existing;

  const dish: Dish = {
    id: `user-${newId()}`,
    name: trimmed,
    aliases: [],
    source: "user",
    servings: 2,
    ingredients: [], // added by the user in the ingredient editor (or by AI generation, when on)
    ...(AI_GENERATION_ENABLED ? { aiStatus: "pending" as const } : {}),
    updatedAt: Date.now(),
  };
  await db.dishes.put(dish);
  return dish;
}

/** "Copy this week": copies a week's dishes into another week's empty slots. */
export function copyWeek(fromStart: ISODate, toStart: ISODate) {
  return db.transaction("rw", db.weeks, db.slots, async () => {
    const toId = await ensureWeek(toStart);
    const [from, to] = await Promise.all([
      db.slots.where("weekId").equals(weekIdFor(fromStart)).toArray(),
      db.slots.where("weekId").equals(toId).toArray(),
    ]);
    const taken = new Set(to.map((s) => `${s.day}-${s.meal}`));
    const now = Date.now();
    await db.slots.bulkPut(
      from
        .filter((s) => !taken.has(`${s.day}-${s.meal}`))
        .map((s) => ({ ...s, weekId: toId, isSample: false, updatedAt: now })),
    );
  });
}
