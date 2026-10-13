import type { Dish, Ingredient, Meal } from "../types";
import { INGREDIENTS, type IngredientKey } from "./ingredients";

// Hard-coded starter library: the 50 dishes in dish-suggestions.md plus a few
// extras (breakfast quick picks, a ready halal carbonara). Replaced by the
// shared, server-side dish library in step 7. Quantities are for 2 people and
// are placeholders pending the culinary lead's review. Meat is assumed to be
// halal-certified; only the ingredients themselves carry halal tags.

type Line = [key: IngredientKey, qty: number, unit: string];

const B: Meal = "breakfast";
const L: Meal = "lunch";
const D: Meal = "dinner";

function dish(
  id: string,
  name: string,
  cuisine: string,
  meals: Meal[],
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
  return { id, name, aliases, cuisine, meals, source: "library", servings: 2, ingredients };
}

export const DISH_LIBRARY: Dish[] = [
  // ── Indonesian & Malaysian ──────────────────────────────────────────────
  dish("nasi-goreng-kampung", "Nasi goreng kampung", "Indonesian", [B, L, D], ["nasi goreng", "fried rice"], [
    ["rice", 300, "g"], ["egg", 2, "pcs"], ["shallot", 4, "pcs"], ["garlic", 2, "cloves"],
    ["red_chili", 2, "pcs"], ["bird_eye_chili", 3, "pcs"], ["kecap_manis", 2, "tbsp"],
    ["shrimp_paste", 1, "tsp"], ["cooking_oil", 2, "tbsp"], ["salt", 1, "tsp"],
  ]),
  dish("mie-goreng", "Mie goreng", "Indonesian", [L, D], ["fried noodles", "bakmi goreng"], [
    ["egg_noodles", 200, "g"], ["egg", 2, "pcs"], ["chicken_breast", 150, "g"],
    ["bok_choy", 1, "bunch"], ["cabbage", 100, "g"], ["garlic", 3, "cloves"],
    ["shallot", 4, "pcs"], ["kecap_manis", 3, "tbsp"], ["oyster_sauce", 1, "tbsp"],
    ["cooking_oil", 2, "tbsp"],
  ]),
  dish("soto-ayam", "Soto ayam", "Indonesian", [B, L], ["chicken soto", "chicken soup"], [
    ["chicken", 500, "g"], ["lemongrass", 2, "stalks"], ["kaffir_lime_leaf", 3, "leaves"],
    ["turmeric", 1, "piece"], ["galangal", 1, "piece"], ["ginger", 1, "piece"],
    ["shallot", 6, "pcs"], ["garlic", 4, "cloves"], ["bean_sprouts", 100, "g"],
    ["egg", 2, "pcs"], ["celery", 1, "stalk"], ["lime", 1, "pcs"], ["rice", 200, "g"],
    ["cooking_oil", 2, "tbsp"], ["salt", 1, "tsp"],
  ]),
  dish("rendang", "Beef rendang", "Indonesian", [L, D], ["rendang", "rendang sapi"], [
    ["beef", 500, "g"], ["coconut_milk", 400, "ml"], ["shallot", 8, "pcs"],
    ["garlic", 5, "cloves"], ["red_chili", 8, "pcs"], ["ginger", 1, "piece"],
    ["galangal", 1, "piece"], ["turmeric", 1, "piece"], ["lemongrass", 2, "stalks"],
    ["kaffir_lime_leaf", 4, "leaves"], ["salt", 1, "tsp"],
  ]),
  dish("ayam-goreng", "Ayam goreng", "Indonesian", [L, D], ["fried chicken"], [
    ["chicken", 600, "g"], ["garlic", 4, "cloves"], ["coriander_seed", 1, "tsp"],
    ["turmeric", 1, "piece"], ["salt", 1, "tsp"], ["cooking_oil", 500, "ml"],
  ]),
  dish("sayur-asem", "Sayur asem", "Indonesian", [L, D], ["sayur asam", "tamarind vegetable soup"], [
    ["long_beans", 100, "g"], ["chayote", 1, "pcs"], ["corn", 1, "pcs"], ["peanuts", 50, "g"],
    ["tamarind", 2, "tbsp"], ["shallot", 4, "pcs"], ["garlic", 2, "cloves"],
    ["red_chili", 2, "pcs"], ["bay_leaf", 2, "leaves"], ["galangal", 1, "piece"],
    ["palm_sugar", 1, "tbsp"], ["salt", 1, "tsp"],
  ]),
  dish("sayur-lodeh", "Sayur lodeh", "Indonesian", [L, D], ["lodeh", "vegetables in coconut milk"], [
    ["young_jackfruit", 200, "g"], ["long_beans", 100, "g"], ["chayote", 1, "pcs"],
    ["eggplant", 1, "pcs"], ["tempe", 100, "g"], ["coconut_milk", 400, "ml"],
    ["shallot", 5, "pcs"], ["garlic", 3, "cloves"], ["red_chili", 2, "pcs"],
    ["galangal", 1, "piece"], ["bay_leaf", 2, "leaves"], ["palm_sugar", 1, "tbsp"], ["salt", 1, "tsp"],
  ]),
  dish("gado-gado", "Gado-gado", "Indonesian", [L], ["gado gado", "peanut salad"], [
    ["cabbage", 100, "g"], ["bean_sprouts", 100, "g"], ["long_beans", 100, "g"],
    ["potato", 2, "pcs"], ["tofu", 2, "pcs"], ["tempe", 100, "g"], ["egg", 2, "pcs"],
    ["cucumber", 1, "pcs"], ["peanuts", 150, "g"], ["palm_sugar", 2, "tbsp"],
    ["garlic", 2, "cloves"], ["red_chili", 2, "pcs"], ["tamarind", 1, "tbsp"], ["salt", 1, "tsp"],
  ]),
  dish("bubur-ayam", "Bubur ayam", "Indonesian", [B], ["chicken porridge", "congee"], [
    ["rice", 150, "g"], ["chicken_breast", 200, "g"], ["ginger", 1, "piece"],
    ["bay_leaf", 2, "leaves"], ["kecap_manis", 1, "tbsp"], ["celery", 1, "stalk"],
    ["fried_shallots", 2, "tbsp"], ["stock_cube", 1, "pcs"], ["salt", 1, "tsp"],
  ]),
  dish("nasi-uduk", "Nasi uduk", "Indonesian", [B, L], ["coconut rice"], [
    ["rice", 300, "g"], ["coconut_milk", 200, "ml"], ["lemongrass", 1, "stalk"],
    ["bay_leaf", 2, "leaves"], ["kaffir_lime_leaf", 2, "leaves"], ["salt", 1, "tsp"],
    ["fried_shallots", 2, "tbsp"], ["egg", 2, "pcs"],
  ]),
  dish("tempe-orek", "Tempe orek", "Indonesian", [L, D], ["orek tempe", "sweet soy tempeh"], [
    ["tempe", 300, "g"], ["kecap_manis", 3, "tbsp"], ["shallot", 4, "pcs"],
    ["garlic", 3, "cloves"], ["red_chili", 3, "pcs"], ["bay_leaf", 2, "leaves"],
    ["galangal", 1, "piece"], ["palm_sugar", 1, "tbsp"], ["cooking_oil", 3, "tbsp"], ["salt", 0.5, "tsp"],
  ]),
  dish("tempe-goreng", "Tempe goreng", "Indonesian", [L, D], ["fried tempeh", "tempe"], [
    ["tempe", 300, "g"], ["garlic", 2, "cloves"], ["coriander_seed", 1, "tsp"],
    ["salt", 1, "tsp"], ["cooking_oil", 250, "ml"],
  ]),
  dish("capcay", "Capcay", "Indonesian-Chinese", [L, D], ["cap cay", "chop suey"], [
    ["cabbage", 150, "g"], ["carrot", 1, "pcs"], ["cauliflower", 150, "g"],
    ["bok_choy", 1, "bunch"], ["chicken_breast", 150, "g"], ["garlic", 3, "cloves"],
    ["oyster_sauce", 2, "tbsp"], ["ang_ciu", 1, "tbsp"], ["cornstarch", 1, "tbsp"],
    ["cooking_oil", 2, "tbsp"], ["salt", 1, "tsp"],
  ]),
  dish("nasi-lemak", "Nasi lemak", "Malaysian", [B, L], ["coconut rice with sambal"], [
    ["rice", 300, "g"], ["coconut_milk", 200, "ml"], ["dried_anchovies", 50, "g"],
    ["peanuts", 50, "g"], ["egg", 2, "pcs"], ["cucumber", 1, "pcs"], ["dried_chili", 10, "pcs"],
    ["shallot", 5, "pcs"], ["garlic", 2, "cloves"], ["tamarind", 1, "tbsp"],
    ["sugar", 1, "tbsp"], ["cooking_oil", 3, "tbsp"], ["salt", 1, "tsp"],
  ]),
  dish("sate-ayam", "Sate ayam", "Indonesian", [L, D], ["satay", "chicken satay"], [
    ["chicken_breast", 500, "g"], ["kecap_manis", 4, "tbsp"], ["peanuts", 150, "g"],
    ["garlic", 3, "cloves"], ["shallot", 5, "pcs"], ["red_chili", 3, "pcs"],
    ["palm_sugar", 1, "tbsp"], ["lime", 1, "pcs"], ["cooking_oil", 2, "tbsp"],
  ]),
  dish("ayam-bakar-madu", "Ayam bakar madu", "Indonesian", [L, D], ["ayam bakar", "honey grilled chicken"], [
    ["chicken", 600, "g"], ["honey", 3, "tbsp"], ["kecap_manis", 3, "tbsp"],
    ["garlic", 4, "cloves"], ["shallot", 5, "pcs"], ["ginger", 1, "piece"],
    ["lime", 1, "pcs"], ["butter", 1, "tbsp"],
  ]),
  dish("sop-ayam", "Sop ayam", "Indonesian", [L, D], ["sup ayam", "chicken vegetable soup"], [
    ["chicken", 400, "g"], ["carrot", 2, "pcs"], ["potato", 2, "pcs"], ["cabbage", 100, "g"],
    ["celery", 1, "stalk"], ["spring_onion", 2, "stalks"], ["garlic", 3, "cloves"],
    ["black_pepper", 0.5, "tsp"], ["salt", 1, "tsp"],
  ]),
  dish("roti-bakar", "Roti bakar", "Indonesian", [B], ["toast", "toasted bread"], [
    ["bread", 4, "slices"], ["butter", 2, "tbsp"], ["condensed_milk", 3, "tbsp"],
  ]),

  // ── Rest of Asia ────────────────────────────────────────────────────────
  dish("pad-krapow-gai", "Pad krapow gai", "Thai", [L, D], ["pad kra pao", "thai basil chicken"], [
    ["chicken_thigh", 300, "g"], ["holy_basil", 1, "bunch"], ["garlic", 4, "cloves"],
    ["bird_eye_chili", 4, "pcs"], ["oyster_sauce", 1, "tbsp"], ["soy_sauce", 1, "tbsp"],
    ["fish_sauce", 1, "tsp"], ["sugar", 1, "tsp"], ["egg", 2, "pcs"],
    ["rice", 200, "g"], ["cooking_oil", 3, "tbsp"],
  ]),
  dish("tom-yum-goong", "Tom yum goong", "Thai", [L, D], ["tom yum", "tomyam"], [
    ["shrimp", 300, "g"], ["lemongrass", 2, "stalks"], ["galangal", 1, "piece"],
    ["kaffir_lime_leaf", 4, "leaves"], ["mushroom", 150, "g"], ["tomato", 1, "pcs"],
    ["bird_eye_chili", 4, "pcs"], ["fish_sauce", 2, "tbsp"], ["lime", 2, "pcs"],
    ["coriander_leaf", 1, "bunch"],
  ]),
  dish("thai-green-curry", "Thai green curry chicken", "Thai", [L, D], ["green curry", "kaeng khiao wan", "kari hijau"], [
    ["chicken_thigh", 400, "g"], ["green_curry_paste", 3, "tbsp"], ["coconut_milk", 400, "ml"],
    ["eggplant", 1, "pcs"], ["holy_basil", 1, "bunch"], ["kaffir_lime_leaf", 3, "leaves"],
    ["fish_sauce", 1, "tbsp"], ["palm_sugar", 1, "tbsp"], ["rice", 200, "g"], ["cooking_oil", 1, "tbsp"],
  ]),
  dish("pad-thai", "Pad thai", "Thai", [L, D], ["phad thai"], [
    ["rice_noodles", 200, "g"], ["shrimp", 200, "g"], ["egg", 2, "pcs"], ["tofu", 1, "pcs"],
    ["bean_sprouts", 100, "g"], ["spring_onion", 2, "stalks"], ["peanuts", 40, "g"],
    ["tamarind", 2, "tbsp"], ["fish_sauce", 2, "tbsp"], ["palm_sugar", 2, "tbsp"],
    ["garlic", 2, "cloves"], ["lime", 1, "pcs"], ["cooking_oil", 2, "tbsp"],
  ]),
  dish("pho-bo", "Pho bo", "Vietnamese", [B, L], ["pho", "beef noodle soup"], [
    ["beef", 300, "g"], ["rice_noodles", 200, "g"], ["onion", 1, "pcs"], ["ginger", 1, "piece"],
    ["star_anise", 3, "pcs"], ["cinnamon", 1, "pcs"], ["fish_sauce", 2, "tbsp"],
    ["bean_sprouts", 100, "g"], ["holy_basil", 1, "bunch"], ["lime", 1, "pcs"],
    ["spring_onion", 2, "stalks"], ["stock_cube", 1, "pcs"],
  ]),
  dish("tomato-egg-stir-fry", "Tomato and egg stir-fry", "Chinese", [L, D], ["tomato egg", "fan qie chao dan", "telur tomat"], [
    ["egg", 4, "pcs"], ["tomato", 3, "pcs"], ["spring_onion", 2, "stalks"],
    ["sugar", 1, "tsp"], ["salt", 0.5, "tsp"], ["cooking_oil", 2, "tbsp"],
  ]),
  dish("kung-pao-chicken", "Kung pao chicken", "Chinese", [L, D], ["kung po chicken", "ayam kung pao"], [
    ["chicken_thigh", 400, "g"], ["peanuts", 50, "g"], ["dried_chili", 8, "pcs"],
    ["sichuan_pepper", 1, "tsp"], ["garlic", 3, "cloves"], ["ginger", 1, "piece"],
    ["spring_onion", 2, "stalks"], ["soy_sauce", 2, "tbsp"], ["shaoxing_wine", 1, "tbsp"],
    ["rice_vinegar", 1, "tbsp"], ["sugar", 1, "tbsp"], ["cornstarch", 1, "tbsp"], ["cooking_oil", 2, "tbsp"],
  ]),
  dish("mapo-tofu", "Mapo tofu", "Chinese", [L, D], ["mapo doufu", "tahu mapo"], [
    ["tofu", 3, "pcs"], ["pork_mince", 150, "g"], ["doubanjiang", 2, "tbsp"],
    ["shaoxing_wine", 1, "tbsp"], ["sichuan_pepper", 1, "tsp"], ["garlic", 3, "cloves"],
    ["ginger", 1, "piece"], ["spring_onion", 2, "stalks"], ["soy_sauce", 1, "tbsp"],
    ["cornstarch", 1, "tbsp"], ["cooking_oil", 2, "tbsp"],
  ]),
  dish("chicken-teriyaki", "Chicken teriyaki", "Japanese", [L, D], ["teriyaki", "ayam teriyaki"], [
    ["chicken_thigh", 400, "g"], ["soy_sauce", 3, "tbsp"], ["mirin", 3, "tbsp"],
    ["sake", 2, "tbsp"], ["sugar", 1, "tbsp"], ["sesame_seeds", 1, "tsp"],
    ["rice", 200, "g"], ["cooking_oil", 1, "tbsp"],
  ]),
  dish("miso-soup", "Miso soup", "Japanese", [B, L, D], ["miso shiru", "sup miso"], [
    ["miso", 3, "tbsp"], ["tofu", 1, "pcs"], ["wakame", 5, "g"], ["spring_onion", 2, "stalks"],
  ]),
  dish("oyakodon", "Oyakodon", "Japanese", [L, D], ["chicken and egg rice bowl"], [
    ["chicken_thigh", 300, "g"], ["egg", 4, "pcs"], ["onion", 1, "pcs"], ["soy_sauce", 2, "tbsp"],
    ["mirin", 2, "tbsp"], ["sugar", 1, "tsp"], ["spring_onion", 1, "stalk"], ["rice", 200, "g"],
  ]),
  dish("bibimbap", "Bibimbap", "Korean", [L, D], ["bibimbab", "korean mixed rice"], [
    ["rice", 200, "g"], ["beef_mince", 200, "g"], ["spinach", 1, "bunch"], ["bean_sprouts", 100, "g"],
    ["carrot", 1, "pcs"], ["mushroom", 100, "g"], ["egg", 2, "pcs"], ["gochujang", 2, "tbsp"],
    ["sesame_oil", 1, "tbsp"], ["soy_sauce", 1, "tbsp"], ["garlic", 2, "cloves"], ["sesame_seeds", 1, "tsp"],
  ]),
  dish("kimchi-jjigae", "Kimchi jjigae", "Korean", [L, D], ["kimchi stew", "kimchi chigae"], [
    ["kimchi", 300, "g"], ["pork_belly", 200, "g"], ["tofu", 1, "pcs"], ["onion", 1, "pcs"],
    ["spring_onion", 2, "stalks"], ["gochujang", 1, "tbsp"], ["garlic", 2, "cloves"],
    ["sesame_oil", 1, "tbsp"],
  ]),
  dish("chicken-curry", "Chicken curry", "Indian", [L, D], ["kari ayam", "chicken masala"], [
    ["chicken_thigh", 500, "g"], ["onion", 2, "pcs"], ["tomato", 2, "pcs"], ["garlic", 4, "cloves"],
    ["ginger", 1, "piece"], ["yogurt", 100, "g"], ["curry_powder", 2, "tbsp"],
    ["garam_masala", 1, "tsp"], ["cumin", 1, "tsp"], ["coriander_leaf", 1, "bunch"],
    ["cooking_oil", 3, "tbsp"], ["salt", 1, "tsp"],
  ]),
  dish("dal-tadka", "Dal tadka", "Indian", [L, D], ["dal", "dhal", "lentil curry"], [
    ["red_lentils", 200, "g"], ["onion", 1, "pcs"], ["tomato", 2, "pcs"], ["garlic", 4, "cloves"],
    ["ginger", 1, "piece"], ["red_chili", 2, "pcs"], ["cumin", 1, "tsp"], ["turmeric_powder", 1, "tsp"],
    ["butter", 2, "tbsp"], ["coriander_leaf", 1, "bunch"], ["salt", 1, "tsp"],
  ]),
  dish("chicken-adobo", "Chicken adobo", "Filipino", [L, D], ["adobo", "adobong manok"], [
    ["chicken_thigh", 600, "g"], ["soy_sauce", 4, "tbsp"], ["vinegar", 4, "tbsp"],
    ["garlic", 6, "cloves"], ["bay_leaf_eu", 3, "leaves"], ["black_pepper", 1, "tsp"],
    ["sugar", 1, "tbsp"], ["cooking_oil", 1, "tbsp"], ["rice", 200, "g"],
  ]),
  dish("shakshuka", "Shakshuka", "Middle Eastern", [B, L], ["shakshouka", "eggs in tomato sauce"], [
    ["egg", 4, "pcs"], ["canned_tomatoes", 400, "g"], ["onion", 1, "pcs"], ["bell_pepper", 1, "pcs"],
    ["garlic", 3, "cloves"], ["cumin", 1, "tsp"], ["paprika_powder", 1, "tsp"],
    ["olive_oil", 2, "tbsp"], ["parsley", 1, "bunch"], ["bread", 4, "slices"], ["salt", 0.5, "tsp"],
  ]),

  // ── Europe ──────────────────────────────────────────────────────────────
  dish("spaghetti-carbonara", "Spaghetti carbonara", "Italian", [L, D], ["carbonara"], [
    ["spaghetti", 200, "g"], ["guanciale", 100, "g"], ["egg", 3, "pcs"],
    ["parmesan", 50, "g"], ["black_pepper", 1, "tsp"], ["salt", 1, "tsp"],
  ]),
  dish("carbonara-halal", "Carbonara, halal version", "Beef bacon instead of guanciale", [L, D], ["halal carbonara", "beef carbonara"], [
    ["spaghetti", 200, "g"], ["beef_bacon", 100, "g"], ["egg", 3, "pcs"],
    ["parmesan", 50, "g"], ["black_pepper", 1, "tsp"], ["salt", 1, "tsp"],
  ]),
  dish("chicken-carbonara", "Chicken carbonara", "Italian-style", [L, D], [], [
    ["spaghetti", 200, "g"], ["chicken_breast", 200, "g"], ["egg", 2, "pcs"],
    ["parmesan", 40, "g"], ["cooking_cream", 100, "ml"], ["garlic", 2, "cloves"],
    ["black_pepper", 1, "tsp"],
  ]),
  dish("spaghetti-bolognese", "Spaghetti bolognese", "Italian", [L, D], ["bolognese", "spag bol", "ragu"], [
    ["spaghetti", 200, "g"], ["beef_mince", 300, "g"], ["pancetta", 50, "g"],
    ["canned_tomatoes", 400, "g"], ["onion", 1, "pcs"], ["carrot", 1, "pcs"], ["celery", 1, "stalk"],
    ["garlic", 2, "cloves"], ["red_wine", 100, "ml"], ["tomato_paste", 1, "tbsp"],
    ["olive_oil", 2, "tbsp"], ["parmesan", 30, "g"],
  ]),
  dish("lasagna", "Lasagna", "Italian", [L, D], ["lasagne"], [
    ["lasagna_sheets", 200, "g"], ["beef_mince", 250, "g"], ["pork_mince", 150, "g"],
    ["canned_tomatoes", 400, "g"], ["onion", 1, "pcs"], ["garlic", 2, "cloves"],
    ["red_wine", 100, "ml"], ["milk", 500, "ml"], ["butter", 3, "tbsp"], ["flour", 3, "tbsp"],
    ["nutmeg", 0.5, "tsp"], ["parmesan", 50, "g"], ["mozzarella", 100, "g"],
  ]),
  dish("mushroom-risotto", "Mushroom risotto", "Italian", [L, D], ["risotto", "risotto ai funghi"], [
    ["arborio_rice", 200, "g"], ["mushroom", 250, "g"], ["onion", 1, "pcs"], ["garlic", 2, "cloves"],
    ["white_wine", 100, "ml"], ["stock_cube", 1, "pcs"], ["butter", 2, "tbsp"],
    ["parmesan", 40, "g"], ["parsley", 1, "bunch"], ["olive_oil", 1, "tbsp"],
  ]),
  dish("aglio-e-olio", "Spaghetti aglio e olio", "Italian", [L, D], ["aglio olio", "garlic spaghetti"], [
    ["spaghetti", 200, "g"], ["garlic", 6, "cloves"], ["olive_oil", 5, "tbsp"],
    ["dried_chili", 2, "pcs"], ["parsley", 1, "bunch"], ["salt", 1, "tsp"],
  ]),
  dish("beef-bourguignon", "Beef bourguignon", "French", [D], ["boeuf bourguignon", "beef stew"], [
    ["beef", 600, "g"], ["red_wine", 300, "ml"], ["lardons", 100, "g"], ["carrot", 2, "pcs"],
    ["onion", 1, "pcs"], ["mushroom", 150, "g"], ["garlic", 3, "cloves"], ["thyme", 1, "tsp"],
    ["flour", 2, "tbsp"], ["stock_cube", 1, "pcs"], ["butter", 1, "tbsp"],
  ]),
  dish("ratatouille", "Ratatouille", "French", [L, D], ["ratatuy", "provençal vegetable stew"], [
    ["eggplant", 1, "pcs"], ["zucchini", 1, "pcs"], ["bell_pepper", 1, "pcs"], ["tomato", 3, "pcs"],
    ["onion", 1, "pcs"], ["garlic", 3, "cloves"], ["thyme", 1, "tsp"], ["olive_oil", 3, "tbsp"],
    ["basil", 1, "bunch"], ["salt", 1, "tsp"],
  ]),
  dish("quiche-lorraine", "Quiche lorraine", "French", [B, L], ["quiche", "bacon and cheese tart"], [
    ["pastry", 1, "pcs"], ["lardons", 150, "g"], ["egg", 3, "pcs"], ["cooking_cream", 200, "ml"],
    ["gruyere", 80, "g"], ["nutmeg", 0.5, "tsp"], ["black_pepper", 0.5, "tsp"],
  ]),
  dish("french-omelette", "French omelette", "French", [B], ["omelette", "omelet", "telur dadar"], [
    ["egg", 4, "pcs"], ["butter", 1, "tbsp"], ["spring_onion", 1, "stalk"], ["salt", 0.5, "tsp"],
  ]),
  dish("croque-monsieur", "Croque monsieur", "French", [B, L], ["ham and cheese toastie"], [
    ["bread", 4, "slices"], ["ham", 4, "slices"], ["gruyere", 100, "g"], ["butter", 2, "tbsp"],
    ["milk", 200, "ml"], ["flour", 1, "tbsp"], ["nutmeg", 0.5, "tsp"],
  ]),
  dish("spanish-omelette", "Spanish omelette", "Spanish", [B, L], ["tortilla española", "potato omelette"], [
    ["egg", 5, "pcs"], ["potato", 3, "pcs"], ["onion", 1, "pcs"], ["olive_oil", 5, "tbsp"], ["salt", 1, "tsp"],
  ]),
  dish("paella", "Chicken and seafood paella", "Spanish", [L, D], ["paella", "paella mixta"], [
    ["arborio_rice", 250, "g"], ["chicken_thigh", 250, "g"], ["shrimp", 150, "g"], ["mussels", 200, "g"],
    ["chorizo", 80, "g"], ["bell_pepper", 1, "pcs"], ["peas", 80, "g"], ["tomato", 2, "pcs"],
    ["onion", 1, "pcs"], ["garlic", 3, "cloves"], ["turmeric_powder", 0.5, "tsp"],
    ["paprika_powder", 1, "tsp"], ["stock_cube", 1, "pcs"], ["lemon", 1, "pcs"], ["olive_oil", 3, "tbsp"],
  ]),
  dish("moussaka", "Moussaka", "Greek", [D], ["musaka"], [
    ["eggplant", 2, "pcs"], ["lamb_mince", 400, "g"], ["canned_tomatoes", 400, "g"], ["onion", 1, "pcs"],
    ["garlic", 2, "cloves"], ["red_wine", 100, "ml"], ["cinnamon", 1, "pcs"], ["milk", 400, "ml"],
    ["butter", 2, "tbsp"], ["flour", 2, "tbsp"], ["egg", 1, "pcs"], ["parmesan", 40, "g"], ["olive_oil", 3, "tbsp"],
  ]),
  dish("greek-salad", "Greek salad", "Greek", [L], ["horiatiki", "salad yunani"], [
    ["tomato", 3, "pcs"], ["cucumber", 1, "pcs"], ["red_onion", 1, "pcs"], ["bell_pepper", 1, "pcs"],
    ["olives", 80, "g"], ["feta", 150, "g"], ["oregano", 1, "tsp"], ["olive_oil", 3, "tbsp"],
  ]),
  dish("shepherds-pie", "Shepherd's pie", "British", [D], ["cottage pie", "shepherds pie"], [
    ["lamb_mince", 400, "g"], ["potato", 4, "pcs"], ["onion", 1, "pcs"], ["carrot", 1, "pcs"],
    ["peas", 80, "g"], ["tomato_paste", 1, "tbsp"], ["worcestershire", 1, "tbsp"],
    ["red_wine", 100, "ml"], ["stock_cube", 1, "pcs"], ["butter", 2, "tbsp"], ["milk", 100, "ml"],
  ]),
  dish("full-english", "Full English breakfast", "British", [B], ["english breakfast", "fry up"], [
    ["pork_sausage", 4, "pcs"], ["bacon", 4, "slices"], ["black_pudding", 2, "slices"], ["egg", 4, "pcs"],
    ["baked_beans", 400, "g"], ["mushroom", 100, "g"], ["tomato", 2, "pcs"], ["bread", 4, "slices"],
    ["butter", 1, "tbsp"], ["cooking_oil", 1, "tbsp"],
  ]),
  dish("fish-and-chips", "Fish and chips", "British", [L, D], ["fish n chips", "battered fish"], [
    ["white_fish", 400, "g"], ["potato", 4, "pcs"], ["flour", 150, "g"], ["beer", 200, "ml"],
    ["lemon", 1, "pcs"], ["peas", 100, "g"], ["cooking_oil", 1, "l"], ["salt", 1, "tsp"],
  ]),
  // Traditionally pork; dish-suggestions.md suggests chicken breast as the swap.
  dish("schnitzel", "Schnitzel", "German/Austrian", [L, D], ["chicken schnitzel", "wiener schnitzel"], [
    ["pork_cutlet", 400, "g"], ["egg", 2, "pcs"], ["flour", 50, "g"], ["breadcrumbs", 100, "g"],
    ["lemon", 1, "pcs"], ["cooking_oil", 250, "ml"], ["salt", 1, "tsp"],
  ]),
  dish("beef-goulash", "Beef goulash", "Hungarian", [L, D], ["goulash", "gulyás", "gulai"], [
    ["beef", 500, "g"], ["lard", 2, "tbsp"], ["onion", 2, "pcs"], ["bell_pepper", 1, "pcs"],
    ["tomato", 2, "pcs"], ["garlic", 2, "cloves"], ["paprika_powder", 2, "tbsp"], ["cumin", 0.5, "tsp"],
    ["potato", 2, "pcs"], ["stock_cube", 1, "pcs"], ["salt", 1, "tsp"],
  ]),
  dish("beef-stroganoff", "Beef stroganoff", "Russian", [D], ["stroganoff"], [
    ["beef", 400, "g"], ["mushroom", 200, "g"], ["onion", 1, "pcs"], ["white_wine", 100, "ml"],
    ["sour_cream", 150, "g"], ["butter", 2, "tbsp"], ["flour", 1, "tbsp"], ["stock_cube", 1, "pcs"],
    ["parsley", 1, "bunch"], ["egg_noodles", 200, "g"],
  ]),

  // ── Other Western ───────────────────────────────────────────────────────
  dish("oatmeal", "Oatmeal", "Western", [B], ["porridge", "overnight oats"], [
    ["oats", 100, "g"], ["milk", 400, "ml"], ["honey", 2, "tbsp"], ["banana", 2, "pcs"],
  ]),
  dish("club-sandwich", "Club sandwich", "Western", [B, L], ["sandwich"], [
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

/**
 * A few library dishes usually eaten at this meal. Rotates with `seed`
 * (e.g. the day) so each day suggests something different.
 */
export function suggestionsFor(meal: Meal, seed: number, count = 6): Dish[] {
  const fits = DISH_LIBRARY.filter((d) => d.meals?.includes(meal));
  const start = (seed * count) % fits.length;
  return [...fits.slice(start), ...fits.slice(0, start)].slice(0, count);
}

export function hasNonHalal(dish: Dish): boolean {
  return dish.ingredients.some((i) => i.halal === "non_halal");
}
