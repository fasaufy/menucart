import Dexie, { type EntityTable, type Table } from "dexie";
import type { Day, Dish, ListItem, Meal, Settings, Slot, Week } from "./types";

// Local-first store. Every write lands here first; server sync comes later.

export type SettingsRow = Settings & { id: "local" };
export type SlotKey = [weekId: string, day: Day, meal: Meal];
export type ListItemKey = [weekId: string, key: string];
/** Small device-level flags. */
export type MetaRow =
  /** Which week's list the List and Shop tabs show. */
  | { id: "activeList"; weekId: string }
  /** First-run setup done (guest or account). */
  | { id: "onboarded"; at: number }
  /** Guest sign-up prompts hidden until this time ("Not now" = 3 days). */
  | { id: "signupSnooze"; until: number }
  /** One-time tips already dismissed. */
  | { id: "tipsSeen"; ids: string[] }
  /** Last signed-in account on this device, to tell "session expired" from "guest". */
  | { id: "lastUser"; userId: string; email?: string };

type MetaId = MetaRow["id"];
export type Meta<K extends MetaId> = Extract<MetaRow, { id: K }>;

export async function getMeta<K extends MetaId>(id: K): Promise<Meta<K> | undefined> {
  return (await db.meta.get(id)) as Meta<K> | undefined;
}

export const db = new Dexie("menucart") as Dexie & {
  settings: EntityTable<SettingsRow, "id">;
  weeks: EntityTable<Week, "id">;
  slots: Table<Slot, SlotKey>;
  /** The user's own dishes. Library dishes live in code (lib/dishes). */
  dishes: EntityTable<Dish, "id">;
  listItems: Table<ListItem, ListItemKey>;
  meta: Table<MetaRow, MetaRow["id"]>;
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

export function saveSettings(settings: Settings) {
  return db.settings.put({ id: "local", ...settings });
}

/** Wipes everything this device stores for the app (sign out without keeping data). */
export function clearLocalData() {
  return db.transaction("rw", db.tables, () => Promise.all(db.tables.map((t) => t.clear())));
}
