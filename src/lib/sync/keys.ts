import type { Day, ListItem, Meal, Slot } from "../types";

// Stable string keys for synced records (server sync_rows.key).

export const slotKey = (s: Pick<Slot, "weekId" | "day" | "meal">) => `${s.weekId}|${s.day}|${s.meal}`;
export const listItemKey = (i: Pick<ListItem, "weekId" | "key">) => `${i.weekId}|${i.key}`;

export function parseSlotKey(key: string): [string, Day, Meal] {
  const [weekId, day, meal] = key.split("|");
  return [weekId, Number(day) as Day, meal as Meal];
}

export function parseListItemKey(key: string): [string, string] {
  const i = key.indexOf("|");
  return [key.slice(0, i), key.slice(i + 1)];
}
