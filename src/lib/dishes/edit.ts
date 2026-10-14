import { db, recordDeletes } from "../db";
import type { Dish, HalalStatus, Ingredient, Section, SwapChoices } from "../types";
import { catalogIngredient, INGREDIENTS, type IngredientKey } from "./ingredients";
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
  const section = INGREDIENTS[key].section;
  const u = unit ?? DEFAULT_UNIT[section];
  return catalogIngredient(key, qty ?? (u === "g" ? 100 : 1), u);
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

/**
 * Writes a change on top of the latest saved copy, so ingredient edits and
 * swap choices made from different sheets don't overwrite each other.
 */
async function saveDish(dish: Dish, change: (current: Dish) => Partial<Dish>) {
  await db.transaction("rw", db.dishes, async () => {
    const current = (await db.dishes.get(dish.id)) ?? dish;
    const customized = current.source === "library" || current.customized;
    await db.dishes.put({
      ...current,
      ...change(current),
      ...(customized ? { customized: true } : {}),
      updatedAt: Date.now(),
    });
  });
}

export function saveDishIngredients(dish: Dish, ingredients: Ingredient[]) {
  return saveDish(dish, () => ({ ingredients }));
}

/** Back to the library version (only for customised library dishes). */
export function resetDish(id: string) {
  if (!getLibraryDish(id)) return Promise.resolve();
  return db.transaction("rw", db.dishes, db.tombstones, async () => {
    await db.dishes.delete(id);
    await recordDeletes("dishes", [id]);
  });
}

/** Records halal swap choices (option id, or "keep") for ingredients of the dish. */
export function setSwapChoices(dish: Dish, choices: SwapChoices) {
  return saveDish(dish, (current) => ({ swaps: { ...current.swaps, ...choices } }));
}

/** Undoes a swap: back to the original ingredient; the review asks again next time. */
export function clearSwapChoice(dish: Dish, key: string) {
  return saveDish(dish, (current) => {
    const swaps = { ...current.swaps };
    delete swaps[key];
    return { swaps };
  });
}
