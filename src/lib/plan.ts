import { db } from "./db";
import { normalize } from "./dishes/search";
import type { Day, Dish, Meal, Slot } from "./types";
import type { ISODate } from "./week";

// Planner writes. All local (IndexedDB); nothing here touches the network.
// A week's id is its Monday until accounts exist, which keeps writes idempotent.

export type SlotRef = { day: Day; meal: Meal };
type DishRef = Pick<Dish, "id" | "name">;

export function weekIdFor(startDate: ISODate): string {
  return startDate;
}

async function ensureWeek(startDate: ISODate) {
  const id = weekIdFor(startDate);
  if (!(await db.weeks.get(id))) {
    await db.weeks.put({ id, ownerId: null, startDate });
  }
  return id;
}

function slotFor(weekId: string, { day, meal }: SlotRef, dish: DishRef): Slot {
  return { weekId, day, meal, dishId: dish.id, dishName: dish.name, updatedAt: Date.now() };
}

export function setSlotDish(startDate: ISODate, ref: SlotRef, dish: DishRef) {
  return db.transaction("rw", db.weeks, db.slots, async () => {
    const weekId = await ensureWeek(startDate);
    await db.slots.put(slotFor(weekId, ref, dish));
  });
}

export function clearSlot(startDate: ISODate, { day, meal }: SlotRef) {
  return db.slots.delete([weekIdFor(startDate), day, meal]);
}

/** Moves a dish to another slot; if that slot is filled, the two swap. */
export function moveSlot(startDate: ISODate, from: SlotRef, to: SlotRef) {
  const weekId = weekIdFor(startDate);
  return db.transaction("rw", db.slots, async () => {
    const [a, b] = await Promise.all([
      db.slots.get([weekId, from.day, from.meal]),
      db.slots.get([weekId, to.day, to.meal]),
    ]);
    if (!a) return;
    await db.slots.delete([weekId, from.day, from.meal]);
    await db.slots.put({ ...a, ...to, updatedAt: Date.now() });
    if (b) await db.slots.put({ ...b, ...from, updatedAt: Date.now() });
  });
}

/** Fills the given days' empty slots for this meal with the dish. Never overwrites. */
export function repeatMeal(startDate: ISODate, meal: Meal, days: Day[], dish: DishRef) {
  return db.transaction("rw", db.weeks, db.slots, async () => {
    const weekId = await ensureWeek(startDate);
    const existing = await db.slots.where("weekId").equals(weekId).toArray();
    const filled = new Set(existing.filter((s) => s.meal === meal).map((s) => s.day));
    const toAdd = days
      .filter((day) => !filled.has(day))
      .map((day) => slotFor(weekId, { day, meal }, dish));
    await db.slots.bulkPut(toAdd);
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
    ingredients: [], // added by the user on the dish sheet (step 3)
  };
  await db.dishes.put(dish);
  return dish;
}
