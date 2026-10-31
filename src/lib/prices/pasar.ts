import type { IngredientKey } from "../dishes/ingredients";

// How each ingredient is bought at a Jawa Tengah pasar and what it costs.
// Recipes say "4 shallots" or "2 tbsp"; sellers sell by kg, ikat, ekor or
// bungkus, and loose spices and chillies by rupiah ("cabai Rp5.000").
//
// Prices are either Badan Pangan Nasional's monthly average for the province
// (per kg, per liter for oil) or a MenuCart estimate for one sell unit. The
// estimates are placeholders for late 2026 and need a market check before launch.

export type SellUnit =
  | "kg"
  | "liter"
  | "ikat"
  | "ekor"
  | "buah"
  | "bungkus"
  | "botol"
  | "sachet"
  | "kotak"
  | "kaleng"
  | "papan"
  | "cup";

export type PasarEntry = {
  /** What amounts convert to: grams, millilitres or pieces. */
  base: "g" | "ml" | "pcs";
  /** Base amount in one recipe unit, for units other than the base ({ clove: 5, tsp: 5 }). */
  per?: Partial<Record<string, number>>;
  /** One `unit` holds `size` of the base; buy in steps of `step` units (½ ekor, ¼ kg). */
  sell: { unit: SellUnit; size: number; step: number };
  /** Bought by rupiah amount, not by unit: chillies, bawang, rempah. */
  loose?: boolean;
  /** MenuCart estimate per sell unit, or the Bapanas commodity (price per kg/liter). */
  price: number | { bapanas: string };
};

const kg = (step = 0.25) => ({ unit: "kg" as const, size: 1000, step });
const unit = (u: SellUnit, size: number, step = 1) => ({ unit: u, size, step });
const bapanas = (commodity: string) => ({ bapanas: commodity });

// Spoon weights after the list merges tbsp into tsp (1 tbsp = 3 tsp).
const LIQUID = { tsp: 5 };

export const PASAR: Partial<Record<IngredientKey, PasarEntry>> = {
  // ── Produce ──────────────────────────────────────────────────────────
  shallot: { base: "g", per: { pcs: 8 }, sell: kg(), loose: true, price: bapanas("Bawang Merah") },
  garlic: { base: "g", per: { clove: 5, pcs: 40 }, sell: kg(), loose: true, price: bapanas("Bawang Putih (Bonggol)") },
  red_chili: { base: "g", per: { pcs: 8 }, sell: kg(), loose: true, price: bapanas("Cabai Merah Keriting") },
  bird_eye_chili: { base: "g", per: { pcs: 1.5 }, sell: kg(), loose: true, price: bapanas("Cabai Rawit Merah") },
  dried_chili: { base: "g", per: { pcs: 1 }, sell: kg(), loose: true, price: 90_000 },
  ginger: { base: "g", per: { piece: 15 }, sell: kg(), loose: true, price: 25_000 },
  galangal: { base: "g", per: { piece: 15 }, sell: kg(), loose: true, price: 15_000 },
  turmeric: { base: "g", per: { piece: 10 }, sell: kg(), loose: true, price: 20_000 },
  candlenut: { base: "g", per: { pcs: 2 }, sell: kg(), loose: true, price: 50_000 },
  onion: { base: "g", per: { pcs: 150 }, sell: kg(), price: 30_000 },
  red_onion: { base: "g", per: { pcs: 120 }, sell: kg(), price: 30_000 },
  tomato: { base: "g", per: { pcs: 100 }, sell: kg(), price: 12_000 },
  potato: { base: "g", per: { pcs: 150 }, sell: kg(), price: 18_000 },
  carrot: { base: "g", per: { pcs: 100 }, sell: kg(), price: 14_000 },
  cabbage: { base: "g", sell: kg(), price: 10_000 },
  cucumber: { base: "g", per: { pcs: 200 }, sell: kg(), price: 10_000 },
  eggplant: { base: "g", per: { pcs: 200 }, sell: kg(), price: 12_000 },
  spring_onion: { base: "g", per: { stalk: 15 }, sell: unit("ikat", 100), price: 3_000 },
  lemongrass: { base: "pcs", per: { stalk: 1 }, sell: unit("ikat", 5), price: 2_000 },
  celery: { base: "pcs", per: { stalk: 1 }, sell: unit("ikat", 5), price: 2_000 },
  kaffir_lime_leaf: { base: "pcs", per: { leaf: 1 }, sell: unit("ikat", 20), price: 2_000 },
  bay_leaf: { base: "pcs", per: { leaf: 1 }, sell: unit("ikat", 20), price: 2_000 },
  lettuce: { base: "pcs", per: { leaf: 1 }, sell: unit("ikat", 10), price: 4_000 },
  long_beans: { base: "g", sell: unit("ikat", 250), price: 3_000 },
  bok_choy: { base: "g", per: { bunch: 250 }, sell: unit("ikat", 250), price: 4_000 },
  water_spinach: { base: "g", per: { bunch: 250 }, sell: unit("ikat", 250), price: 2_500 },
  spinach: { base: "g", per: { bunch: 200 }, sell: unit("ikat", 200), price: 3_000 },
  holy_basil: { base: "g", per: { bunch: 50 }, sell: unit("ikat", 50), price: 2_000 },
  coriander_leaf: { base: "g", per: { bunch: 50 }, sell: unit("ikat", 50), price: 3_000 },
  parsley: { base: "g", per: { bunch: 50 }, sell: unit("ikat", 50), price: 5_000 },
  bean_sprouts: { base: "g", sell: unit("bungkus", 250), price: 3_000 },
  mushroom: { base: "g", sell: unit("bungkus", 200), price: 15_000 },
  peas: { base: "g", sell: unit("bungkus", 250), price: 15_000 },
  lime: { base: "pcs", sell: unit("buah", 1), price: 1_000 },
  lemon: { base: "pcs", sell: unit("buah", 1), price: 5_000 },
  bell_pepper: { base: "pcs", sell: unit("buah", 1), price: 8_000 },
  chayote: { base: "pcs", sell: unit("buah", 1), price: 2_500 },
  corn: { base: "pcs", sell: unit("buah", 1), price: 4_000 },
  banana: { base: "pcs", sell: unit("buah", 1), price: 2_000 },

  // ── Meat, fish, eggs, soy ────────────────────────────────────────────
  egg: { base: "g", per: { pcs: 60 }, sell: kg(), price: bapanas("Telur Ayam Ras") },
  chicken: { base: "g", sell: unit("ekor", 1000, 0.5), price: bapanas("Daging Ayam Ras") },
  chicken_thigh: { base: "g", sell: kg(), price: 42_000 },
  chicken_breast: { base: "g", sell: kg(), price: 55_000 },
  beef: { base: "g", sell: kg(), price: bapanas("Daging Sapi Murni") },
  beef_mince: { base: "g", sell: kg(), price: 135_000 },
  beef_brisket: { base: "g", sell: kg(), price: 140_000 },
  goat_meat: { base: "g", sell: kg(), price: 145_000 },
  shrimp: { base: "g", sell: kg(), price: 80_000 },
  whole_fish: { base: "g", sell: kg(), price: bapanas("Ikan Kembung") },
  dried_anchovies: { base: "g", sell: kg(), loose: true, price: 100_000 },
  tofu: { base: "pcs", sell: unit("buah", 1), price: 2_000 },
  tempe: { base: "g", sell: unit("papan", 300), price: 5_000 },
  canned_tuna: { base: "g", sell: unit("kaleng", 150), price: 15_000 },
  // Halal swaps for pork and cured meats (supermarket).
  beef_bacon: { base: "g", sell: unit("bungkus", 200), price: 35_000 },
  smoked_beef: { base: "g", sell: unit("bungkus", 250), price: 40_000 },
  smoked_turkey: { base: "g", sell: unit("bungkus", 200), price: 45_000 },
  smoked_chicken: { base: "g", sell: unit("bungkus", 250), price: 35_000 },
  chicken_ham: { base: "g", sell: unit("bungkus", 200), price: 30_000 },
  beef_chorizo: { base: "g", sell: unit("bungkus", 200), price: 50_000 },
  beef_sausage: { base: "pcs", sell: unit("bungkus", 6), price: 25_000 },
  chicken_sausage: { base: "pcs", sell: unit("bungkus", 10), price: 20_000 },

  // ── Dairy ────────────────────────────────────────────────────────────
  butter: { base: "g", per: { tsp: 4.7 }, sell: unit("bungkus", 200), price: 11_000 },
  ghee: { base: "g", per: { tsp: 4.5 }, sell: unit("botol", 200), price: 45_000 },
  milk: { base: "ml", sell: unit("kotak", 1000), price: 20_000 },
  cooking_cream: { base: "ml", sell: unit("kotak", 200), price: 20_000 },
  yogurt: { base: "g", sell: unit("cup", 200), price: 12_000 },
  parmesan: { base: "g", sell: unit("bungkus", 80), price: 55_000 },
  mozzarella: { base: "g", sell: unit("bungkus", 200), price: 45_000 },
  cheddar: { base: "pcs", per: { slice: 1 }, sell: unit("bungkus", 10), price: 22_000 },

  // ── Rice, noodles, bread ─────────────────────────────────────────────
  rice: { base: "g", sell: kg(0.5), price: bapanas("Beras Medium") },
  flour: { base: "g", per: { tsp: 3 }, sell: kg(), price: bapanas("Tepung Terigu Kemasan") },
  cornstarch: { base: "g", per: { tsp: 2.7 }, sell: unit("bungkus", 100), price: 4_000 },
  spaghetti: { base: "g", sell: unit("bungkus", 450), price: 15_000 },
  egg_noodles: { base: "g", sell: unit("bungkus", 200), price: 8_000 },
  rice_vermicelli: { base: "g", sell: unit("bungkus", 250), price: 6_000 },
  rice_noodles: { base: "g", sell: unit("bungkus", 250), price: 7_000 },
  rice_cake: { base: "pcs", sell: unit("buah", 1), price: 3_000 },
  bread: { base: "pcs", per: { slice: 1 }, sell: unit("bungkus", 14), price: 16_000 },
  breadcrumbs: { base: "g", sell: unit("bungkus", 200), price: 10_000 },
  oats: { base: "g", sell: unit("bungkus", 500), price: 25_000 },
  crackers: { base: "g", sell: unit("bungkus", 250), price: 10_000 },
  peanuts: { base: "g", sell: kg(), price: 32_000 },

  // ── Oil, sugar, salt, sauces ─────────────────────────────────────────
  cooking_oil: { base: "ml", per: LIQUID, sell: unit("liter", 1000, 0.5), price: bapanas("Minyak Goreng Kemasan") },
  sugar: { base: "g", per: { tsp: 4 }, sell: kg(), price: bapanas("Gula Pasir Lokal/Curah") },
  salt: { base: "g", per: { tsp: 6 }, sell: unit("bungkus", 250), price: bapanas("Garam Konsumsi") },
  palm_sugar: { base: "g", per: { tsp: 4 }, sell: kg(), loose: true, price: 22_000 },
  // Santan pressed at the pasar, sold in small bags.
  coconut_milk: { base: "ml", sell: unit("bungkus", 250), price: 5_000 },
  kecap_manis: { base: "ml", per: LIQUID, sell: unit("botol", 135), price: 7_500 },
  soy_sauce: { base: "ml", per: LIQUID, sell: unit("botol", 135), price: 8_000 },
  oyster_sauce: { base: "ml", per: LIQUID, sell: unit("botol", 133), price: 10_000 },
  fish_sauce: { base: "ml", per: LIQUID, sell: unit("botol", 200), price: 20_000 },
  tomato_ketchup: { base: "ml", per: LIQUID, sell: unit("botol", 340), price: 12_000 },
  chili_sauce: { base: "ml", per: LIQUID, sell: unit("botol", 340), price: 12_000 },
  mayonnaise: { base: "g", per: LIQUID, sell: unit("bungkus", 200), price: 12_000 },
  vinegar: { base: "ml", per: LIQUID, sell: unit("botol", 150), price: 5_000 },
  rice_vinegar: { base: "ml", per: LIQUID, sell: unit("botol", 150), price: 15_000 },
  olive_oil: { base: "ml", per: LIQUID, sell: unit("botol", 250), price: 55_000 },
  sesame_oil: { base: "ml", per: { tsp: 4.5 }, sell: unit("botol", 150), price: 25_000 },
  honey: { base: "g", per: { tsp: 7 }, sell: unit("botol", 250), price: 35_000 },
  tamarind: { base: "g", per: { tsp: 5 }, sell: unit("bungkus", 100), price: 4_000 },
  shrimp_paste: { base: "g", per: { tsp: 5 }, sell: unit("bungkus", 20), price: 2_000 },
  fried_shallots: { base: "g", per: { tsp: 1.7 }, sell: unit("bungkus", 100), price: 12_000 },
  stock_cube: { base: "pcs", sell: unit("buah", 1), price: 1_000 },
  canned_tomatoes: { base: "g", sell: unit("kaleng", 400), price: 25_000 },
  tomato_paste: { base: "g", per: { tsp: 5 }, sell: unit("sachet", 70), price: 8_000 },

  // ── Spices ───────────────────────────────────────────────────────────
  black_pepper: { base: "g", per: { tsp: 2.5 }, sell: unit("sachet", 4), price: 1_000 },
  coriander_seed: { base: "g", per: { tsp: 2 }, sell: unit("sachet", 15), price: 2_500 },
  cumin: { base: "g", per: { tsp: 2 }, sell: unit("sachet", 15), price: 3_000 },
  turmeric_powder: { base: "g", per: { tsp: 3 }, sell: unit("sachet", 15), price: 2_000 },
  nutmeg: { base: "g", per: { tsp: 2.2 }, sell: unit("sachet", 10), price: 3_000 },
  curry_powder: { base: "g", per: { tsp: 2 }, sell: unit("sachet", 20), price: 3_000 },
  chili_powder: { base: "g", per: { tsp: 2.5 }, sell: unit("sachet", 15), price: 3_000 },
  paprika_powder: { base: "g", per: { tsp: 2.3 }, sell: unit("botol", 40), price: 15_000 },
  garam_masala: { base: "g", per: { tsp: 2 }, sell: unit("botol", 40), price: 15_000 },
  baking_powder: { base: "g", per: { tsp: 4 }, sell: unit("sachet", 45), price: 5_000 },
  cinnamon: { base: "pcs", sell: unit("bungkus", 10), price: 4_000 },
  star_anise: { base: "pcs", sell: unit("bungkus", 10), price: 3_000 },
};
