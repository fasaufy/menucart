import type { Dish, Ingredient } from "../types";
import { INGREDIENTS, type IngredientKey } from "./ingredients";

// Hard-coded starter library (step 2). Replaced by the shared, server-side
// dish library in step 7. Quantities are for 2 people.

type Line = [key: IngredientKey, qty: number, unit: string];

function dish(
  id: string,
  name: string,
  cuisine: string,
  aliases: string[],
  lines: Line[],
): Dish {
  const ingredients: Ingredient[] = lines.map(([key, qty, unit]) => {
    const entry = INGREDIENTS[key];
    return {
      key,
      name: entry.name,
      localName: entry.localName,
      qty,
      unit,
      section: entry.section,
      halal: entry.halal ?? "halal",
    };
  });
  return { id, name, aliases, cuisine, source: "library", servings: 2, ingredients };
}

export const DISH_LIBRARY: Dish[] = [
  dish("nasi-goreng-kampung", "Nasi goreng kampung", "Indonesian", ["nasi goreng", "fried rice"], [
    ["rice", 300, "g"], ["egg", 2, "pcs"], ["shallot", 4, "pcs"], ["garlic", 2, "cloves"],
    ["red_chili", 2, "pcs"], ["bird_eye_chili", 3, "pcs"], ["kecap_manis", 2, "tbsp"],
    ["shrimp_paste", 1, "tsp"], ["cooking_oil", 2, "tbsp"], ["salt", 1, "tsp"],
  ]),
  dish("soto-ayam", "Soto ayam", "Indonesian", ["chicken soto", "chicken soup"], [
    ["chicken", 500, "g"], ["lemongrass", 2, "stalks"], ["kaffir_lime_leaf", 3, "leaves"],
    ["turmeric", 1, "piece"], ["galangal", 1, "piece"], ["ginger", 1, "piece"],
    ["shallot", 6, "pcs"], ["garlic", 4, "cloves"], ["bean_sprouts", 100, "g"],
    ["egg", 2, "pcs"], ["celery", 1, "stalk"], ["lime", 1, "pcs"], ["rice", 200, "g"],
    ["cooking_oil", 2, "tbsp"], ["salt", 1, "tsp"],
  ]),
  dish("rendang", "Rendang", "Indonesian", ["beef rendang", "rendang sapi"], [
    ["beef", 500, "g"], ["coconut_milk", 400, "ml"], ["shallot", 8, "pcs"],
    ["garlic", 5, "cloves"], ["red_chili", 8, "pcs"], ["ginger", 1, "piece"],
    ["galangal", 1, "piece"], ["turmeric", 1, "piece"], ["lemongrass", 2, "stalks"],
    ["kaffir_lime_leaf", 4, "leaves"], ["salt", 1, "tsp"],
  ]),
  dish("ayam-goreng", "Ayam goreng", "Indonesian", ["fried chicken"], [
    ["chicken", 600, "g"], ["garlic", 4, "cloves"], ["coriander_seed", 1, "tsp"],
    ["turmeric", 1, "piece"], ["salt", 1, "tsp"], ["cooking_oil", 500, "ml"],
  ]),
  dish("sayur-asem", "Sayur asem", "Indonesian", ["sayur asam", "tamarind vegetable soup"], [
    ["long_beans", 100, "g"], ["chayote", 1, "pcs"], ["corn", 1, "pcs"], ["peanuts", 50, "g"],
    ["tamarind", 2, "tbsp"], ["shallot", 4, "pcs"], ["garlic", 2, "cloves"],
    ["red_chili", 2, "pcs"], ["bay_leaf", 2, "leaves"], ["galangal", 1, "piece"],
    ["palm_sugar", 1, "tbsp"], ["salt", 1, "tsp"],
  ]),
  dish("tempe-goreng", "Tempe goreng", "Indonesian", ["fried tempeh", "tempe"], [
    ["tempe", 300, "g"], ["garlic", 2, "cloves"], ["coriander_seed", 1, "tsp"],
    ["salt", 1, "tsp"], ["cooking_oil", 250, "ml"],
  ]),
  dish("capcay", "Capcay", "Chinese-Indonesian", ["cap cay", "chop suey"], [
    ["cabbage", 150, "g"], ["carrot", 1, "pcs"], ["cauliflower", 150, "g"],
    ["bok_choy", 1, "bunch"], ["chicken_breast", 150, "g"], ["garlic", 3, "cloves"],
    ["oyster_sauce", 2, "tbsp"], ["cooking_oil", 2, "tbsp"], ["salt", 1, "tsp"],
  ]),
  dish("bubur-ayam", "Bubur ayam", "Indonesian", ["chicken porridge", "congee"], [
    ["rice", 150, "g"], ["chicken_breast", 200, "g"], ["ginger", 1, "piece"],
    ["bay_leaf", 2, "leaves"], ["kecap_manis", 1, "tbsp"], ["celery", 1, "stalk"],
    ["fried_shallots", 2, "tbsp"], ["stock_cube", 1, "pcs"], ["salt", 1, "tsp"],
  ]),
  dish("nasi-uduk", "Nasi uduk", "Indonesian", ["coconut rice"], [
    ["rice", 300, "g"], ["coconut_milk", 200, "ml"], ["lemongrass", 1, "stalk"],
    ["bay_leaf", 2, "leaves"], ["kaffir_lime_leaf", 2, "leaves"], ["salt", 1, "tsp"],
    ["fried_shallots", 2, "tbsp"], ["egg", 2, "pcs"],
  ]),
  dish("roti-bakar", "Roti bakar", "Indonesian", ["toast", "toasted bread"], [
    ["bread", 4, "slices"], ["butter", 2, "tbsp"], ["condensed_milk", 3, "tbsp"],
  ]),
  dish("oatmeal", "Oatmeal", "Western", ["porridge", "overnight oats"], [
    ["oats", 100, "g"], ["milk", 400, "ml"], ["honey", 2, "tbsp"], ["banana", 2, "pcs"],
  ]),
  dish("gado-gado", "Gado-gado", "Indonesian", ["gado gado", "peanut salad"], [
    ["cabbage", 100, "g"], ["bean_sprouts", 100, "g"], ["long_beans", 100, "g"],
    ["potato", 2, "pcs"], ["tofu", 2, "pcs"], ["tempe", 100, "g"], ["egg", 2, "pcs"],
    ["cucumber", 1, "pcs"], ["peanuts", 150, "g"], ["palm_sugar", 2, "tbsp"],
    ["garlic", 2, "cloves"], ["red_chili", 2, "pcs"], ["tamarind", 1, "tbsp"], ["salt", 1, "tsp"],
  ]),
  dish("mie-goreng", "Mie goreng", "Indonesian", ["fried noodles", "bakmi goreng"], [
    ["egg_noodles", 200, "g"], ["egg", 2, "pcs"], ["chicken_breast", 150, "g"],
    ["bok_choy", 1, "bunch"], ["cabbage", 100, "g"], ["garlic", 3, "cloves"],
    ["shallot", 4, "pcs"], ["kecap_manis", 3, "tbsp"], ["oyster_sauce", 1, "tbsp"],
    ["cooking_oil", 2, "tbsp"],
  ]),
  dish("sate-ayam", "Sate ayam", "Indonesian", ["satay", "chicken satay"], [
    ["chicken_breast", 500, "g"], ["kecap_manis", 4, "tbsp"], ["peanuts", 150, "g"],
    ["garlic", 3, "cloves"], ["shallot", 5, "pcs"], ["red_chili", 3, "pcs"],
    ["palm_sugar", 1, "tbsp"], ["lime", 1, "pcs"], ["cooking_oil", 2, "tbsp"],
  ]),
  dish("ayam-bakar-madu", "Ayam bakar madu", "Indonesian", ["ayam bakar", "honey grilled chicken"], [
    ["chicken", 600, "g"], ["honey", 3, "tbsp"], ["kecap_manis", 3, "tbsp"],
    ["garlic", 4, "cloves"], ["shallot", 5, "pcs"], ["ginger", 1, "piece"],
    ["lime", 1, "pcs"], ["butter", 1, "tbsp"],
  ]),
  dish("sop-ayam", "Sop ayam", "Indonesian", ["sup ayam", "chicken vegetable soup"], [
    ["chicken", 400, "g"], ["carrot", 2, "pcs"], ["potato", 2, "pcs"], ["cabbage", 100, "g"],
    ["celery", 1, "stalk"], ["spring_onion", 2, "stalks"], ["garlic", 3, "cloves"],
    ["black_pepper", 0.5, "tsp"], ["salt", 1, "tsp"],
  ]),
  dish("spaghetti-carbonara", "Spaghetti carbonara", "Italian", ["carbonara"], [
    ["spaghetti", 200, "g"], ["guanciale", 100, "g"], ["egg", 3, "pcs"],
    ["parmesan", 50, "g"], ["black_pepper", 1, "tsp"], ["salt", 1, "tsp"],
  ]),
  dish("carbonara-halal", "Carbonara, halal version", "Beef bacon instead of guanciale", ["halal carbonara", "beef carbonara"], [
    ["spaghetti", 200, "g"], ["beef_bacon", 100, "g"], ["egg", 3, "pcs"],
    ["parmesan", 50, "g"], ["black_pepper", 1, "tsp"], ["salt", 1, "tsp"],
  ]),
  dish("chicken-carbonara", "Chicken carbonara", "Italian-style", [], [
    ["spaghetti", 200, "g"], ["chicken_breast", 200, "g"], ["egg", 2, "pcs"],
    ["parmesan", 40, "g"], ["cooking_cream", 100, "ml"], ["garlic", 2, "cloves"],
    ["black_pepper", 1, "tsp"],
  ]),
  dish("beef-bourguignon", "Beef bourguignon", "French", ["boeuf bourguignon", "beef stew"], [
    ["beef", 600, "g"], ["red_wine", 300, "ml"], ["carrot", 2, "pcs"], ["onion", 1, "pcs"],
    ["mushroom", 150, "g"], ["garlic", 3, "cloves"], ["thyme", 1, "tsp"],
    ["flour", 2, "tbsp"], ["stock_cube", 1, "pcs"], ["butter", 1, "tbsp"],
  ]),
  dish("club-sandwich", "Club sandwich", "Western", ["sandwich"], [
    ["bread", 6, "slices"], ["chicken_breast", 200, "g"], ["bacon", 4, "slices"],
    ["egg", 2, "pcs"], ["lettuce", 4, "leaves"], ["tomato", 1, "pcs"], ["mayonnaise", 3, "tbsp"],
  ]),
];

const byId = new Map(DISH_LIBRARY.map((d) => [d.id, d]));

export function getLibraryDish(id: string): Dish | undefined {
  return byId.get(id);
}

/** Breakfast quick picks from the PRD (F1). */
export const BREAKFAST_PICKS = ["bubur-ayam", "roti-bakar", "nasi-uduk", "oatmeal"];

export function hasNonHalal(dish: Dish): boolean {
  return dish.ingredients.some((i) => i.halal === "non_halal");
}
