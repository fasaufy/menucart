import { db } from "../db";
import type { Dish, HalalStatus, Ingredient, Section } from "../types";
import { INGREDIENTS, type IngredientKey } from "./ingredients";
import { getLibraryDish } from "./library";
import { normalize } from "./search";

// Ingredient editing (US-03). Edits are saved per dish and apply to every
// meal that uses it. Editing a library dish saves a customised copy under
// the same id; resetting deletes the copy.

export const UNITS = ["g", "kg", "ml", "l", "tsp", "tbsp", "pcs", "cloves", "stalks", "leaves", "slices", "pieces", "bunch"] as const;

const DEFAULT_UNIT: Record<Section, string> = {
  produce: "pcs",
  meat_poultry: "g",
  seafood: "g",
  dairy_eggs: "g",
  dry_goods_spices: "g",
  others: "pcs",
};

export function ingredientFromCatalog(key: IngredientKey, qty?: number, unit?: string): Ingredient {
  const entry = INGREDIENTS[key];
  return {
    key,
    name: entry.name,
    localName: entry.localName,
    qty: qty ?? (DEFAULT_UNIT[entry.section] === "g" ? 100 : 1),
    unit: unit ?? DEFAULT_UNIT[entry.section],
    section: entry.section,
    halal: entry.halal ?? "halal",
  };
}

/** An ingredient the catalog doesn't know. Its key is derived from the name so it still merges. */
export function customIngredient(name: string, section: Section = "others", halal: HalalStatus = "halal"): Ingredient {
  const trimmed = name.trim().replace(/\s+/g, " ");
  return {
    key: `custom:${normalize(trimmed).replace(/ /g, "_")}`,
    name: trimmed,
    qty: 1,
    unit: DEFAULT_UNIT[section],
    section,
    halal,
  };
}

/** Catalog matches for the "Add an ingredient" field, by English or local name. */
export function searchIngredients(query: string, limit = 5): IngredientKey[] {
  const q = normalize(query);
  if (!q) return [];
  const scored: [IngredientKey, number][] = [];
  for (const key of Object.keys(INGREDIENTS) as IngredientKey[]) {
    const { name, localName } = INGREDIENTS[key];
    const names = [name, localName].filter((n): n is string => !!n).map(normalize);
    const score = Math.max(
      ...names.map((n) => (n.startsWith(q) ? 3 : n.split(" ").some((w) => w.startsWith(q)) ? 2 : n.includes(q) ? 1 : 0)),
    );
    if (score) scored.push([key, score]);
  }
  return scored
    .sort((a, b) => b[1] - a[1] || INGREDIENTS[a[0]].name.localeCompare(INGREDIENTS[b[0]].name))
    .slice(0, limit)
    .map(([key]) => key);
}

export function saveDishIngredients(dish: Dish, ingredients: Ingredient[]) {
  const customized = dish.source === "library" || dish.customized;
  return db.dishes.put({ ...dish, ingredients, ...(customized ? { customized: true } : {}) });
}

/** Back to the library version (only for customised library dishes). */
export function resetDish(id: string) {
  if (!getLibraryDish(id)) return Promise.resolve();
  return db.dishes.delete(id);
}
