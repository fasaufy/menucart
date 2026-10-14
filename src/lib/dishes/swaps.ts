import type { Dish, Ingredient } from "../types";
import { catalogIngredient, type IngredientKey } from "./ingredients";

// Halal swaps, ranked by how closely they keep the original's flavour role
// (PRD "Halal substitution logic" + dish-suggestions.md). Suggestions, not
// rulings; the swap table needs review by someone qualified before launch.

/** A replacement ingredient. Quantity is `ratio` × the original (same unit) unless `qty` is fixed. */
export type ReplacementLine = { key: IngredientKey; ratio?: number; qty?: number; unit?: string };

/** `lines: []` means leave the ingredient out. */
export type SwapOption = { id: string; lines: ReplacementLine[]; note: string };

export type SwapRule = {
  forKey: IngredientKey;
  /** What the original does in the dish, e.g. "pork, gives salty rendered fat". */
  role: string;
  options: SwapOption[];
};

const rules: SwapRule[] = [
  {
    forKey: "guanciale",
    role: "pork, gives salty rendered fat",
    options: [
      { id: "beef_bacon", lines: [{ key: "beef_bacon" }], note: "Closest: smoky, salty, renders fat" },
      { id: "beef_brisket", lines: [{ key: "beef_brisket" }], note: "Rich and fatty; dice small and render slowly" },
      { id: "smoked_turkey", lines: [{ key: "smoked_turkey" }, { key: "butter", qty: 1, unit: "tbsp" }], note: "Leaner; add 1 tbsp butter" },
    ],
  },
  {
    forKey: "pancetta",
    role: "pork, gives salty rendered fat",
    options: [
      { id: "beef_bacon", lines: [{ key: "beef_bacon" }], note: "Closest: smoky, salty, renders fat" },
      { id: "smoked_beef", lines: [{ key: "smoked_beef" }], note: "Less fat; fry in a little oil first" },
      { id: "omit", lines: [], note: "Leave it out; the sauce is still rich" },
    ],
  },
  {
    forKey: "lardons",
    role: "pork, gives smoky, salty fat",
    options: [
      { id: "beef_bacon", lines: [{ key: "beef_bacon" }], note: "Closest: smoky and salty" },
      { id: "smoked_beef", lines: [{ key: "smoked_beef" }], note: "Same smoke, a little leaner" },
      { id: "smoked_turkey", lines: [{ key: "smoked_turkey" }], note: "Milder; brown it well" },
    ],
  },
  {
    forKey: "bacon",
    role: "pork, gives smoke, crunch and salt",
    options: [
      { id: "beef_bacon", lines: [{ key: "beef_bacon" }], note: "Closest: crisps the same way" },
      { id: "smoked_chicken", lines: [{ key: "smoked_chicken" }], note: "Milder smoke, less fat" },
      {
        id: "paprika_mushroom",
        lines: [{ key: "mushroom", qty: 100, unit: "g" }, { key: "paprika_powder", qty: 1, unit: "tsp" }],
        note: "Meat-free: smoked paprika on fried mushrooms",
      },
    ],
  },
  {
    forKey: "ham",
    role: "pork, a cured, salty slice",
    options: [
      { id: "smoked_turkey", lines: [{ key: "smoked_turkey" }], note: "Closest texture and salt" },
      { id: "chicken_ham", lines: [{ key: "chicken_ham" }], note: "Look for a halal-certified pack" },
    ],
  },
  {
    forKey: "chorizo",
    role: "pork, gives paprika heat and fat",
    options: [
      { id: "beef_chorizo", lines: [{ key: "beef_chorizo" }], note: "Same paprika kick" },
      {
        id: "chicken_sausage",
        lines: [{ key: "chicken_sausage" }, { key: "paprika_powder", qty: 1, unit: "tsp" }],
        note: "Add smoked paprika for the colour and smoke",
      },
    ],
  },
  {
    forKey: "pork_mince",
    role: "pork, a fatty mince",
    options: [
      { id: "beef_mince", lines: [{ key: "beef_mince" }], note: "Pick 15–20% fat so it stays juicy" },
      { id: "chicken_thigh", lines: [{ key: "chicken_thigh" }], note: "Lighter; mince thigh, not breast" },
    ],
  },
  {
    forKey: "pork_belly",
    role: "pork, gives rich fat to the stew",
    options: [
      { id: "beef_brisket", lines: [{ key: "beef_brisket" }], note: "Same richness; slice thin" },
      { id: "canned_tuna", lines: [{ key: "canned_tuna", ratio: 0.75 }], note: "Classic kimchi-stew swap" },
    ],
  },
  {
    forKey: "pork_cutlet",
    role: "pork, the main cutlet",
    options: [{ id: "chicken_breast", lines: [{ key: "chicken_breast" }], note: "Pound thin; the classic chicken schnitzel" }],
  },
  {
    forKey: "pork_sausage",
    role: "pork, the breakfast sausage",
    options: [
      { id: "beef_sausage", lines: [{ key: "beef_sausage" }], note: "Closest; fries the same" },
      { id: "chicken_sausage", lines: [{ key: "chicken_sausage" }], note: "Milder and leaner" },
    ],
  },
  {
    forKey: "black_pudding",
    role: "pork blood sausage",
    options: [{ id: "omit", lines: [], note: "No close halal match; leave it out" }],
  },
  {
    forKey: "lard",
    role: "pork fat for cooking",
    options: [
      { id: "beef_tallow", lines: [{ key: "beef_tallow" }], note: "Same richness and high heat" },
      { id: "ghee", lines: [{ key: "ghee" }], note: "Nutty; easy to find" },
      { id: "butter", lines: [{ key: "butter" }], note: "Works; burns sooner, so lower the heat" },
    ],
  },
  {
    forKey: "red_wine",
    role: "alcohol, gives acidity and depth",
    options: [
      {
        id: "grape_vinegar",
        lines: [{ key: "grape_juice", ratio: 0.9 }, { key: "vinegar", qty: 1, unit: "tbsp" }],
        note: "Keeps the fruity acidity",
      },
      {
        id: "stock_lemon",
        lines: [{ key: "stock_cube", qty: 1, unit: "pcs" }, { key: "lemon", qty: 1, unit: "pcs" }],
        note: "Savoury depth; lemon for brightness",
      },
    ],
  },
  {
    forKey: "white_wine",
    role: "alcohol, gives acidity",
    options: [
      {
        id: "stock_lemon",
        lines: [{ key: "stock_cube", qty: 1, unit: "pcs" }, { key: "lemon", qty: 1, unit: "pcs" }],
        note: "Extra stock and a squeeze of lemon",
      },
      {
        id: "grape_vinegar",
        lines: [{ key: "grape_juice" }, { key: "vinegar", qty: 1, unit: "tsp" }],
        note: "White grape juice; a little sweeter",
      },
    ],
  },
  {
    forKey: "shaoxing_wine",
    role: "alcohol, gives aroma and depth",
    options: [
      {
        id: "stock_vinegar",
        lines: [{ key: "stock_cube", qty: 1, unit: "pcs" }, { key: "rice_vinegar", qty: 1, unit: "tsp" }],
        note: "Stock plus a dash of rice vinegar",
      },
      { id: "omit", lines: [], note: "Leave it out; the sauce still works" },
    ],
  },
  {
    forKey: "ang_ciu",
    role: "alcohol, gives aroma",
    options: [
      { id: "omit", lines: [], note: "Leave it out; the flavour stays close" },
      { id: "rice_vinegar", lines: [{ key: "rice_vinegar", qty: 1, unit: "tsp" }], note: "A splash adds the sharp note" },
    ],
  },
  {
    forKey: "mirin",
    role: "alcohol, gives sweet acidity",
    options: [
      {
        id: "vinegar_sugar",
        lines: [{ key: "rice_vinegar" }, { key: "sugar", ratio: 1, unit: "tsp" }],
        note: "Rice vinegar with 1 tsp sugar per tbsp",
      },
    ],
  },
  {
    forKey: "sake",
    role: "alcohol, gives umami",
    options: [
      { id: "stock", lines: [{ key: "stock_cube", qty: 1, unit: "pcs" }], note: "Use water or stock instead" },
      { id: "omit", lines: [], note: "Leave it out" },
    ],
  },
  {
    forKey: "beer",
    role: "alcohol, makes the batter light",
    options: [{ id: "sparkling_water", lines: [{ key: "sparkling_water" }], note: "Ice-cold; keeps the batter crisp" }],
  },
  {
    forKey: "brandy",
    role: "alcohol, gives warmth and depth",
    options: [
      {
        id: "stock_lemon",
        lines: [{ key: "stock_cube", qty: 1, unit: "pcs" }, { key: "lemon", qty: 1, unit: "pcs" }],
        note: "Stock and a squeeze of lemon",
      },
    ],
  },
];

export const SWAP_RULES: ReadonlyMap<string, SwapRule> = new Map(rules.map((r) => [r.forKey, r]));

/** The lines an option puts in place of `original`. */
export function replacementLines(original: Ingredient, option: SwapOption): Ingredient[] {
  return option.lines.map((line) => ({
    ...catalogIngredient(
      line.key,
      line.qty ?? original.qty * (line.ratio ?? 1),
      line.unit ?? original.unit,
    ),
    swappedFrom: original.name,
  }));
}

/** The dish's ingredients with its chosen swaps applied (original order kept). */
export function effectiveIngredients(dish: Dish): Ingredient[] {
  if (!dish.swaps) return dish.ingredients;
  return dish.ingredients.flatMap((ing) => {
    const choice = dish.swaps?.[ing.key];
    const option = choice && SWAP_RULES.get(ing.key)?.options.find((o) => o.id === choice);
    return option ? replacementLines(ing, option) : [ing];
  });
}

/** Non-halal ingredients the user hasn't decided on yet (no swap, not "keep"). */
export function pendingSwaps(dish: Dish): Ingredient[] {
  return dish.ingredients.filter(
    (i) => i.halal === "non_halal" && !dish.swaps?.[i.key] && SWAP_RULES.has(i.key),
  );
}

/** True if the dish, as it will be cooked, still contains something non-halal. */
export function hasNonHalal(dish: Dish): boolean {
  return effectiveIngredients(dish).some((i) => i.halal === "non_halal");
}
