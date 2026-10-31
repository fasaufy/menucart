import type { IngredientKey } from "../dishes/ingredients";
import { effectiveIngredients } from "../dishes/swaps";
import type { Day, Dish, Ingredient } from "../types";

// The list is bought in one trip, so short-lived ingredients should be cooked
// early in the week. Days in a cool kitchen or a home fridge; placeholder
// figures pending the culinary lead's review.

export const KEEPS: Partial<Record<IngredientKey, [min: number, max: number]>> = {
  spinach: [1, 2],
  water_spinach: [1, 2],
  bean_sprouts: [1, 2],
  holy_basil: [1, 2],
  bok_choy: [2, 3],
  coriander_leaf: [2, 3],
  lettuce: [2, 3],
  mushroom: [2, 3],
  tofu: [2, 3],
  tempe: [2, 3],
  coconut_milk: [1, 1],
  shrimp: [1, 2],
  whole_fish: [1, 2],
  chicken: [1, 2],
  chicken_thigh: [1, 2],
  chicken_breast: [1, 2],
  beef_mince: [1, 2],
  beef: [2, 3],
  goat_meat: [2, 3],
};

/** How long a key keeps, or undefined for things that last the week. */
export function keeps(key: string): [number, number] | undefined {
  return KEEPS[key as IngredientKey];
}

/** True when a dish `daysAfter` the shopping day would use it past its keeping time. */
export function tooLate(key: string, daysAfter: number): boolean {
  const k = keeps(key);
  return !!k && daysAfter > k[1];
}

export type DishNote =
  /** An ingredient won't keep from shopping day until this dish. */
  | { kind: "late"; ingredient: Ingredient; keeps: [number, number] }
  /** A short-lived pack bought for an earlier dish covers this one too. */
  | { kind: "uses"; ingredient: Ingredient; day: Day };

/**
 * At most one note per planned dish, keyed "day:dishId": something that won't
 * keep until its day comes first, else leftovers from an earlier dish.
 */
export function dishNotes(planned: { day: Day; dish: Dish }[], shopDay: Day): Map<string, DishNote> {
  const first = new Map<string, { day: Day; dishId: string }>();
  for (const { day, dish } of [...planned].sort((a, b) => a.day - b.day)) {
    for (const ing of effectiveIngredients(dish)) {
      if (keeps(ing.key) && !first.has(ing.key)) first.set(ing.key, { day, dishId: dish.id });
    }
  }
  const notes = new Map<string, DishNote>();
  for (const { day, dish } of planned) {
    if (day < shopDay) continue;
    const ings = effectiveIngredients(dish).filter((i) => keeps(i.key));
    const late = ings.find((i) => tooLate(i.key, day - shopDay));
    const shared = ings.find((i) => {
      const f = first.get(i.key);
      return f && f.day < day && f.dishId !== dish.id;
    });
    if (late) notes.set(`${day}:${dish.id}`, { kind: "late", ingredient: late, keeps: keeps(late.key)! });
    else if (shared) notes.set(`${day}:${dish.id}`, { kind: "uses", ingredient: shared, day: first.get(shared.key)!.day });
  }
  return notes;
}
