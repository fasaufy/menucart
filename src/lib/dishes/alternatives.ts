import type { IngredientKey } from "./ingredients";
import type { SwapOption } from "./swaps";

// "Can't find it?" alternatives (wireframe 08): 1–3 common, halal-safe
// substitutes per ingredient, best first, each with a one-line taste note.
// Bundled with the app, so they work offline in the store. Placeholder data
// pending the culinary lead's review.

type Alt = [id: string, lines: SwapOption["lines"], note: string];

const a = (key: IngredientKey, extra: Partial<SwapOption["lines"][number]> = {}) => ({ key, ...extra });

const table: Partial<Record<IngredientKey, Alt[]>> = {
  // Meat & poultry
  beef_bacon: [
    ["smoked_beef", [a("smoked_beef")], "Closest taste. Usually near the deli counter."],
    ["brisket_paprika", [a("beef_brisket"), a("paprika_powder", { qty: 1, unit: "tsp" })], "Same richness, smoke from the spice."],
    ["smoked_chicken", [a("smoked_chicken")], "Milder. Add a little butter for fat."],
  ],
  smoked_beef: [
    ["beef_bacon", [a("beef_bacon")], "Fattier and saltier; fry until crisp."],
    ["smoked_chicken", [a("smoked_chicken")], "Milder smoke."],
  ],
  smoked_turkey: [
    ["smoked_chicken", [a("smoked_chicken")], "Very close; slightly softer."],
    ["chicken_ham", [a("chicken_ham")], "Look for a halal-certified pack."],
  ],
  smoked_chicken: [["smoked_turkey", [a("smoked_turkey")], "Very close; slightly firmer."]],
  chicken_ham: [["smoked_turkey", [a("smoked_turkey")], "Same use in sandwiches."]],
  beef_chorizo: [["beef_sausage_paprika", [a("beef_sausage"), a("paprika_powder", { qty: 1, unit: "tsp" })], "Add smoked paprika for the chorizo taste."]],
  beef_sausage: [["chicken_sausage", [a("chicken_sausage")], "Milder and leaner."]],
  chicken_sausage: [["beef_sausage", [a("beef_sausage")], "A little richer."]],
  beef_brisket: [["beef", [a("beef")], "Leaner; cook it a little longer."]],
  beef: [["beef_brisket", [a("beef_brisket")], "Fattier; slow-cook it."]],
  beef_mince: [
    ["chicken_thigh", [a("chicken_thigh")], "Mince thigh meat; lighter taste."],
    ["lamb_mince", [a("lamb_mince")], "Stronger flavour."],
  ],
  lamb_mince: [["beef_mince", [a("beef_mince"), a("cumin", { qty: 0.5, unit: "tsp" })], "Milder; a pinch of cumin brings it closer."]],
  chicken_thigh: [
    ["chicken", [a("chicken")], "Cook on the bone or debone it."],
    ["chicken_breast", [a("chicken_breast")], "Leaner; don't overcook."],
  ],
  chicken_breast: [["chicken_thigh", [a("chicken_thigh")], "Juicier; cooks a little longer."]],
  chicken: [["chicken_thigh", [a("chicken_thigh")], "Boneless; cooks faster."]],

  // Seafood
  shrimp: [
    ["white_fish", [a("white_fish")], "Firm fish cubes work in soups and stir-fries."],
    ["chicken_breast", [a("chicken_breast")], "Thin slices; a different but easy swap."],
  ],
  mussels: [["shrimp", [a("shrimp")], "Same sea flavour; cooks fast."]],
  white_fish: [["shrimp", [a("shrimp")], "Sweeter; batter it the same way."]],

  // Dairy & eggs
  parmesan: [["cheddar", [a("cheddar")], "Softer and milder; grate it finely."]],
  gruyere: [
    ["cheddar", [a("cheddar")], "Melts well; a little sharper."],
    ["mozzarella", [a("mozzarella")], "Milder and stretchier."],
  ],
  mozzarella: [["cheddar", [a("cheddar")], "Melts well; stronger taste."]],
  feta: [["tofu_lemon", [a("tofu", { qty: 1, unit: "pcs" }), a("lemon", { qty: 1, unit: "pcs" })], "Crumble firm tofu with salt and lemon."]],
  sour_cream: [["yogurt", [a("yogurt")], "Tangier; stir in off the heat."]],
  yogurt: [
    ["sour_cream", [a("sour_cream")], "Richer, less tangy."],
    ["coconut_milk", [a("coconut_milk", { unit: "ml" })], "Richer; works well in curries."],
  ],
  cooking_cream: [
    ["milk_butter", [a("milk"), a("butter", { qty: 1, unit: "tbsp" })], "Lighter sauce; simmer to thicken."],
    ["coconut_milk", [a("coconut_milk")], "Richer, with a coconut note."],
  ],
  butter: [["ghee", [a("ghee")], "Same richness; nuttier."]],
  ghee: [["butter", [a("butter")], "Works; lower the heat a little."]],
  condensed_milk: [["honey", [a("honey")], "Sweet but less creamy."]],
  mayonnaise: [["yogurt", [a("yogurt", { unit: "tbsp" })], "Lighter; add a pinch of salt."]],

  // Produce
  holy_basil: [["basil", [a("basil")], "Sweeter; still works."]],
  basil: [["holy_basil", [a("holy_basil")], "More peppery."]],
  coriander_leaf: [
    ["parsley", [a("parsley")], "Milder; adds freshness."],
    ["celery", [a("celery", { qty: 1, unit: "stalk" })], "Use the leaves."],
  ],
  parsley: [
    ["coriander_leaf", [a("coriander_leaf")], "Stronger flavour."],
    ["celery", [a("celery", { qty: 1, unit: "stalk" })], "Use the leaves."],
  ],
  celery: [["parsley", [a("parsley", { qty: 1, unit: "bunch" })], "Same fresh green note."]],
  lemongrass: [["lime_ginger", [a("lime", { qty: 1, unit: "pcs" }), a("ginger", { qty: 1, unit: "piece" })], "Lime zest and ginger cover the citrus note."]],
  galangal: [["ginger", [a("ginger")], "Sharper, less piney; use a little less."]],
  kaffir_lime_leaf: [["lime", [a("lime", { qty: 1, unit: "pcs" })], "Use the zest for the citrus aroma."]],
  turmeric: [["turmeric_powder", [a("turmeric_powder", { qty: 1, unit: "tsp" })], "Same colour; 1 tsp per thumb-sized piece."]],
  turmeric_powder: [["turmeric", [a("turmeric", { qty: 1, unit: "piece" })], "Fresher, brighter taste."]],
  lemon: [["lime", [a("lime")], "Sharper; use a little less."]],
  lime: [["lemon", [a("lemon")], "Milder acidity."]],
  shallot: [["onion", [a("onion", { ratio: 0.25 })], "Sweeter; one onion for about four shallots."]],
  onion: [["shallot", [a("shallot", { ratio: 4 })], "Sharper; about four shallots per onion."]],
  red_onion: [["onion", [a("onion")], "A little sharper raw."]],
  spring_onion: [["shallot", [a("shallot", { qty: 2, unit: "pcs" })], "Slice thin for a similar bite."]],
  bok_choy: [
    ["spinach", [a("spinach")], "Softer; add at the end."],
    ["cabbage", [a("cabbage", { qty: 150, unit: "g" })], "Crunchier; cook a little longer."],
  ],
  spinach: [["bok_choy", [a("bok_choy")], "Crunchier stems."]],
  zucchini: [["chayote", [a("chayote")], "Labu siam cooks the same way."]],
  eggplant: [["zucchini", [a("zucchini")], "Firmer; less creamy."]],
  chayote: [["zucchini", [a("zucchini")], "Softer; cook it less."]],
  young_jackfruit: [["chayote", [a("chayote", { qty: 1, unit: "pcs" })], "Keeps a similar bite in coconut milk."]],
  peas: [["corn", [a("corn", { qty: 1, unit: "pcs" })], "Sweet and colourful."]],
  bean_sprouts: [["cabbage", [a("cabbage")], "Shred thinly for crunch."]],
  tempe: [["tofu", [a("tofu", { qty: 2, unit: "pcs" })], "Softer; fry until golden."]],
  tofu: [["tempe", [a("tempe", { qty: 100, unit: "g" })], "Nuttier and firmer."]],

  // Dry goods & spices
  arborio_rice: [["rice", [a("rice")], "Short-grain rice; stir often and add stock slowly."]],
  rice_noodles: [
    ["egg_noodles", [a("egg_noodles")], "Different texture, still good."],
    ["spaghetti", [a("spaghetti")], "Cook al dente and toss in the sauce."],
  ],
  egg_noodles: [
    ["rice_noodles", [a("rice_noodles")], "Lighter and chewier."],
    ["spaghetti", [a("spaghetti")], "Works in stir-fries; cook al dente."],
  ],
  spaghetti: [["egg_noodles", [a("egg_noodles")], "Softer; cook a minute less."]],
  breadcrumbs: [["oats", [a("oats")], "Blitz rolled oats for a crisp coating."]],
  cornstarch: [["flour", [a("flour", { ratio: 2 })], "Use twice as much; slightly cloudier."]],
  canned_tomatoes: [["tomato", [a("tomato", { qty: 4, unit: "pcs" })], "Chop fresh tomatoes and cook down longer."]],
  tomato_paste: [["canned_tomatoes", [a("canned_tomatoes", { qty: 100, unit: "g" })], "Cook down to thicken."]],
  olive_oil: [["cooking_oil", [a("cooking_oil")], "Neutral taste."]],
  sesame_oil: [["oil_sesame", [a("cooking_oil"), a("sesame_seeds", { qty: 1, unit: "tsp" })], "Toast the seeds for the nutty note."]],
  rice_vinegar: [
    ["vinegar", [a("vinegar", { ratio: 0.75 })], "Sharper; use a little less."],
    ["lime", [a("lime", { qty: 1, unit: "pcs" })], "Fresh acidity."],
  ],
  vinegar: [
    ["lime", [a("lime", { qty: 1, unit: "pcs" })], "Fresher acidity."],
    ["rice_vinegar", [a("rice_vinegar")], "Milder."],
  ],
  fish_sauce: [["shrimp_paste", [a("shrimp_paste", { ratio: 0.5, unit: "tsp" })], "Terasi gives the same salty funk; use less."]],
  kecap_manis: [["soy_sugar", [a("soy_sauce"), a("palm_sugar")], "Mix soy sauce 1:1 with palm sugar. Check for a halal logo."]],
  soy_sauce: [["kecap_manis", [a("kecap_manis")], "Sweeter; add a pinch of salt. Check for a halal logo."]],
  oyster_sauce: [["soy_sugar", [a("soy_sauce"), a("sugar", { qty: 1, unit: "tsp" })], "Soy sauce with a little sugar. Check for a halal logo."]],
  green_curry_paste: [
    [
      "fresh_paste",
      [a("bird_eye_chili", { qty: 6, unit: "pcs" }), a("lemongrass", { qty: 1, unit: "stalk" }), a("coriander_leaf", { qty: 1, unit: "bunch" })],
      "Pound fresh green chilies, lemongrass and coriander.",
    ],
  ],
  gochujang: [["chili_honey", [a("chili_powder", { qty: 1, unit: "tsp" }), a("honey", { qty: 1, unit: "tsp" })], "Sweet heat; a little thinner."]],
  doubanjiang: [["chili_soy", [a("chili_powder", { qty: 1, unit: "tsp" }), a("soy_sauce", { qty: 1, unit: "tbsp" })], "Salty heat. Check the soy sauce for a halal logo."]],
  kimchi: [
    [
      "quick_pickle",
      [a("cabbage"), a("chili_powder", { qty: 1, unit: "tbsp" }), a("vinegar", { qty: 1, unit: "tbsp" })],
      "Quick-pickle cabbage with chili and vinegar.",
    ],
  ],
  wakame: [["spinach", [a("spinach", { qty: 1, unit: "bunch" })], "Different, but adds greens to the soup."]],
  thyme: [["oregano", [a("oregano")], "Similar dried-herb warmth."]],
  oregano: [["thyme", [a("thyme")], "A little earthier."]],
  bay_leaf_eu: [["bay_leaf", [a("bay_leaf")], "Daun salam: different, but just as aromatic."]],
  bay_leaf: [["bay_leaf_eu", [a("bay_leaf_eu")], "European bay leaves; a little stronger."]],
  star_anise: [["cinnamon", [a("cinnamon", { qty: 1, unit: "pcs" })], "Warm spice without the liquorice note."]],
  cinnamon: [["star_anise", [a("star_anise", { qty: 1, unit: "pcs" })], "Stronger; use one."]],
  sichuan_pepper: [["pepper_coriander", [a("black_pepper"), a("coriander_seed", { qty: 0.5, unit: "tsp" })], "Heat without the tingle."]],
  garam_masala: [["curry_powder", [a("curry_powder")], "Close enough in a curry."]],
  curry_powder: [["garam_masala_turmeric", [a("garam_masala"), a("turmeric_powder", { qty: 0.5, unit: "tsp" })], "Add turmeric for the colour."]],
  cumin: [["coriander_seed", [a("coriander_seed")], "Lighter, more citrusy."]],
  coriander_seed: [["cumin", [a("cumin", { ratio: 0.5 })], "Earthier; use half."]],
  paprika_powder: [["chili_powder", [a("chili_powder", { ratio: 0.5 })], "Hotter; use half."]],
  chili_powder: [
    ["paprika_powder", [a("paprika_powder", { ratio: 2 })], "Milder; use twice as much."],
    ["dried_chili", [a("dried_chili", { qty: 3, unit: "pcs" })], "Crush them yourself."],
  ],
  dried_chili: [
    ["red_chili", [a("red_chili")], "Fresher; a little less heat."],
    ["chili_powder", [a("chili_powder", { qty: 1, unit: "tsp" })], "Easy; same heat."],
  ],
  red_chili: [["bird_eye_chili", [a("bird_eye_chili", { ratio: 0.5 })], "Much hotter; use half."]],
  bird_eye_chili: [["red_chili", [a("red_chili", { ratio: 2 })], "Milder; use twice as many."]],
  shrimp_paste: [["fish_sauce", [a("fish_sauce", { ratio: 2 })], "Same salty depth, no funk."]],
  coconut_milk: [["milk", [a("milk")], "Lighter, no coconut taste."]],
  tamarind: [["lime", [a("lime", { qty: 1, unit: "pcs" })], "Brighter sourness."]],
  fried_shallots: [["shallot", [a("shallot", { qty: 4, unit: "pcs" })], "Slice thin and fry until golden."]],
  dried_anchovies: [["peanuts", [a("peanuts", { qty: 50, unit: "g" })], "Keeps the crunch, loses the salt; add a pinch."]],
  mushroom: [["eggplant", [a("eggplant", { qty: 1, unit: "pcs" })], "Soaks up sauce the same way."]],
  bell_pepper: [["zucchini", [a("zucchini")], "Same bite, less sweet."]],
  miso: [["soy_sauce", [a("soy_sauce")], "Salty umami; thinner. Check for a halal logo."]],
  nutmeg: [["cinnamon", [a("cinnamon", { qty: 1, unit: "pcs" })], "Different warm spice; use a pinch."]],
  worcestershire: [["soy_vinegar", [a("soy_sauce"), a("vinegar", { qty: 1, unit: "tsp" })], "Soy sauce with a dash of vinegar."]],
  oats: [["rice", [a("rice", { ratio: 0.5 })], "Make it a rice porridge instead."]],
  lettuce: [["cabbage", [a("cabbage", { qty: 100, unit: "g" })], "Crunchier; shred it thin."]],
  sesame_seeds: [["peanuts", [a("peanuts", { qty: 20, unit: "g" })], "Chop and toast for crunch."]],
  water_spinach: [["spinach", [a("spinach")], "Softer; cook it for less time."]],
  green_beans: [["long_beans", [a("long_beans")], "Same crunch; cut into short lengths."]],
  grated_coconut: [["coconut_milk", [a("coconut_milk", { qty: 100, unit: "ml" })], "Toss the vegetables in a little reduced santan."]],
  candlenut: [["peanuts", [a("peanuts", { qty: 20, unit: "g" })], "A few ground peanuts thicken the paste the same way."]],
  tapioca_flour: [["cornstarch", [a("cornstarch")], "Works the same for binding."]],
  rice_vermicelli: [["rice_noodles", [a("rice_noodles")], "Wider noodles, same taste."]],
  basmati_rice: [["rice", [a("rice")], "Shorter grains, a little stickier."]],
  goat_meat: [["beef", [a("beef")], "Milder; same cooking time."]],
  oxtail: [["beef_brisket", [a("beef_brisket")], "Rich enough for soup; less gelatinous."]],
  catfish: [["whole_fish", [a("whole_fish")], "Tilapia or mackerel fries just as well."]],
  whole_fish: [["white_fish", [a("white_fish")], "Fillets cook faster; less bone."]],
  squid: [["shrimp", [a("shrimp")], "Same sauce, sweeter bite."]],
  rice_cake: [["rice", [a("rice", { qty: 200, unit: "g" })], "Serve with plain rice instead."]],
  burger_buns: [["bread", [a("bread", { qty: 4, unit: "slices" })], "Toast the slices for a firmer bun."]],
  flatbread: [["bread", [a("bread")], "Wrap in soft sliced bread or a chapati."]],
  tomato_ketchup: [["paste_sugar", [a("tomato_paste", { qty: 2, unit: "tbsp" }), a("sugar", { qty: 1, unit: "tsp" })], "Tomato paste with a little sugar and vinegar."]],
  chili_sauce: [["fresh_chili", [a("red_chili", { qty: 3, unit: "pcs" })], "Blend fresh chilies with a pinch of salt and sugar."]],
  chicken_wings: [["chicken", [a("chicken")], "Any chicken pieces work."]],
  honey: [["sugar", [a("sugar")], "Sweet without the floral note."]],
  palm_sugar: [["sugar", [a("sugar")], "Less caramel taste."]],
  sugar: [["palm_sugar", [a("palm_sugar")], "Adds a caramel note."]],
};

export const ALTERNATIVES: ReadonlyMap<string, SwapOption[]> = new Map(
  Object.entries(table).map(([key, alts]) => [key, alts!.map(([id, lines, note]) => ({ id, lines, note }))]),
);
