import { db, recordDeletes } from "./db";
import { listItemKey, slotKey } from "./sync/keys";
import type { Slot } from "./types";
import { addDays, dayIndex, weekStartOf, type ISODate } from "./week";

// Changing the day weeks start on (Settings). Planned meals keep their dates:
// each one moves into the new week that date falls in. The current list moves
// to the new current week, where it updates against that week's plan.

/** Planned meals re-keyed for the new start day; unchanged ones are left out. put[i] replaces remove[i]. */
export function rebucket(slots: Slot[], startsOn: number, now = Date.now()): { put: Slot[]; remove: Slot[] } {
  const put: Slot[] = [];
  const remove: Slot[] = [];
  for (const slot of slots) {
    const date = addDays(slot.weekId, slot.day);
    const weekId = weekStartOf(date, startsOn);
    if (weekId === slot.weekId) continue;
    remove.push(slot);
    put.push({ ...slot, weekId, day: dayIndex(date, startsOn), updatedAt: now });
  }
  return { put, remove };
}

/** Moves the plan and the current list to weeks starting on `startsOn`. Save the setting with it. */
export async function changeWeekStart(startsOn: number, today: ISODate) {
  await db.transaction("rw", [db.weeks, db.slots, db.listItems, db.meta, db.tombstones], async () => {
    const now = Date.now();
    const { put, remove } = rebucket(await db.slots.toArray(), startsOn, now);
    await db.slots.bulkDelete(remove.map((s) => [s.weekId, s.day, s.meal] as [string, Slot["day"], Slot["meal"]]));
    await recordDeletes("slots", remove.map(slotKey));
    await db.slots.bulkPut(put);

    // New weeks inherit the owner of the week their meals came from (put[i] came from remove[i]).
    const owners = new Map((await db.weeks.toArray()).map((w) => [w.id, w.ownerId]));
    for (const [i, slot] of put.entries()) {
      if (owners.has(slot.weekId)) continue;
      const ownerId = owners.get(remove[i].weekId) ?? null;
      owners.set(slot.weekId, ownerId);
      await db.weeks.put({ id: slot.weekId, ownerId, startDate: slot.weekId, updatedAt: now });
    }

    // The list being shopped follows to the new week that holds today (or its own start).
    const active = await db.meta.get("activeList");
    if (!active || active.id !== "activeList") return;
    const from = active.weekId;
    const containsToday = from <= today && today <= addDays(from, 6);
    const to = weekStartOf(containsToday ? today : from, startsOn);
    if (to === from) return;
    if ((await db.listItems.where("weekId").equals(to).count()) === 0) {
      const items = await db.listItems.where("weekId").equals(from).toArray();
      await db.listItems.bulkDelete(items.map((i) => [i.weekId, i.key] as [string, string]));
      await recordDeletes("listItems", items.map(listItemKey));
      await db.listItems.bulkPut(items.map((i) => ({ ...i, weekId: to, updatedAt: now })));
    }
    await db.meta.put({ id: "activeList", weekId: to, updatedAt: now });
    await db.meta.delete("listChange");
  });
}
