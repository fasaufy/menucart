import Dexie, { type EntityTable, type Table } from "dexie";
import type { Day, Dish, IngredientReport, ListItem, Meal, Settings, Slot, Week } from "./types";

// Local-first store. Every write lands here first; server sync comes later.

export type SettingsRow = Settings & { id: "local"; updatedAt?: number };
/** A local deletion waiting to be synced (sync keys, see lib/sync). */
export type Tombstone = { entity: string; key: string; deletedAt: number };
export type SlotKey = [weekId: string, day: Day, meal: Meal];
export type ListItemKey = [weekId: string, key: string];
/** Small device-level flags. */
export type MetaRow =
  /** Which week's list the List and Shop tabs show. Synced across devices. */
  | { id: "activeList"; weekId: string; updatedAt?: number }
  /** Sync cursor for the signed-in account on this device. */
  | { id: "sync"; userId: string; pulledVersion: number; pushedAt: number }
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
  reports: EntityTable<IngredientReport, "id">;
  tombstones: Table<Tombstone, [string, string]>;
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

db.version(3).stores({
  reports: "++id, createdAt",
});

db.version(4).stores({
  tombstones: "[entity+key]",
});

// updatedAt indexes let sync read only what changed since its last run.
db.version(5).stores({
  weeks: "id, startDate, updatedAt",
  dishes: "id, name, updatedAt",
  listItems: "[weekId+key], weekId, updatedAt",
});

// Local-change notifications for sync: a middleware sees every write to a
// synced table. Writes made while applying remote rows don't notify, so sync
// doesn't loop on its own changes.
const SYNCED_TABLES = new Set(["settings", "weeks", "slots", "listItems", "dishes", "meta", "tombstones", "reports"]);
let applyingRemote = false;
const changeListeners = new Set<() => void>();

db.use({
  stack: "dbcore",
  name: "sync-notify",
  create(down) {
    return {
      ...down,
      table(name) {
        const table = down.table(name);
        if (!SYNCED_TABLES.has(name)) return table;
        return {
          ...table,
          async mutate(req) {
            const result = await table.mutate(req);
            if (!applyingRemote) changeListeners.forEach((l) => l());
            return result;
          },
        };
      },
    };
  },
});

export function onLocalChange(listener: () => void) {
  changeListeners.add(listener);
  return () => {
    changeListeners.delete(listener);
  };
}

export async function withRemoteApply<T>(fn: () => Promise<T>): Promise<T> {
  applyingRemote = true;
  try {
    return await fn();
  } finally {
    applyingRemote = false;
  }
}

export const DEFAULT_SETTINGS: Settings = {
  householdSize: 2,
  halalMode: true,
  autoSwap: false,
  meals: ["breakfast", "lunch", "dinner"],
  language: "en",
};

export async function getSettings(): Promise<Settings> {
  const row = await db.settings.get("local");
  if (!row) return DEFAULT_SETTINGS;
  const { householdSize, halalMode, meals, language } = row;
  // Settings saved before a field existed fall back to its default.
  return { householdSize, halalMode, meals, language, autoSwap: row.autoSwap ?? DEFAULT_SETTINGS.autoSwap };
}

export function saveSettings(settings: Settings) {
  return db.settings.put({ id: "local", ...settings, updatedAt: Date.now() });
}

/** Records local deletions so sync can remove them on the server too. Call inside the deleting transaction. */
export function recordDeletes(entity: string, keys: string[]) {
  const deletedAt = Date.now();
  return db.tombstones.bulkPut(keys.map((key) => ({ entity, key, deletedAt })));
}

/** Wipes everything this device stores for the app (sign out without keeping data). */
export function clearLocalData() {
  return db.transaction("rw", db.tables, () => Promise.all(db.tables.map((t) => t.clear())));
}

export function addReport(report: Omit<IngredientReport, "id" | "createdAt" | "sent">) {
  return db.reports.add({ ...report, createdAt: Date.now(), sent: false });
}
