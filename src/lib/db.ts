import Dexie, { type EntityTable, type Table } from "dexie";
import type { Day, Dish, ListItem, Meal, Settings, Slot, Week } from "./types";

// Local-first store. Every write lands here first; server sync comes later.

export type SettingsRow = Settings & { id: "local" };
export type SlotKey = [weekId: string, day: Day, meal: Meal];
export type ListItemKey = [weekId: string, key: string];
/** Which week's list the List and Shop tabs show. */
export type MetaRow = { id: "activeList"; weekId: string };

export const db = new Dexie("menucart") as Dexie & {
  settings: EntityTable<SettingsRow, "id">;
  weeks: EntityTable<Week, "id">;
  slots: Table<Slot, SlotKey>;
  /** The user's own dishes. Library dishes live in code (lib/dishes). */
  dishes: EntityTable<Dish, "id">;
  listItems: Table<ListItem, ListItemKey>;
  meta: EntityTable<MetaRow, "id">;
};

db.version(1).stores({
  settings: "id",
  weeks: "id, startDate",
  slots: "[weekId+day+meal], weekId, updatedAt",
  dishes: "id, name",
});

db.version(2).stores({
  listItems: "[weekId+key], weekId",
  meta: "id",
});

export const DEFAULT_SETTINGS: Settings = {
  householdSize: 2,
  halalMode: true,
  meals: ["breakfast", "lunch", "dinner"],
  language: "en",
};

export async function getSettings(): Promise<Settings> {
  const row = await db.settings.get("local");
  if (!row) return DEFAULT_SETTINGS;
  const { householdSize, halalMode, meals, language } = row;
  return { householdSize, halalMode, meals, language };
}
