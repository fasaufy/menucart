import type { HalalStatus, Section } from "../types";

// One entry per ingredient so every dish shares the same key, section and
// halal tag; merging relies on matching keys. Placeholder data: quantities,
// tags and local names need the culinary lead's review before launch.

export type CatalogEntry = {
  name: string;
  localName?: string;
  section: Section;
  halal?: HalalStatus; // defaults to "halal"
};

const CATALOG = {
  // Produce
  shallot: { name: "Shallots", localName: "Bawang merah", section: "produce" },
  garlic: { name: "Garlic", localName: "Bawang putih", section: "produce" },
  onion: { name: "Onion", localName: "Bawang bombay", section: "produce" },
  spring_onion: { name: "Spring onion", localName: "Daun bawang", section: "produce" },
  red_chili: { name: "Red chilies", localName: "Cabai merah", section: "produce" },
  bird_eye_chili: { name: "Bird's eye chilies", localName: "Cabai rawit", section: "produce" },
  ginger: { name: "Ginger", localName: "Jahe", section: "produce" },
  galangal: { name: "Galangal", localName: "Lengkuas", section: "produce" },
  turmeric: { name: "Turmeric", localName: "Kunyit", section: "produce" },
  lemongrass: { name: "Lemongrass", localName: "Serai", section: "produce" },
  kaffir_lime_leaf: { name: "Kaffir lime leaves", localName: "Daun jeruk", section: "produce" },
  bay_leaf: { name: "Indonesian bay leaves", localName: "Daun salam", section: "produce" },
  lime: { name: "Lime", localName: "Jeruk nipis", section: "produce" },
  celery: { name: "Celery", localName: "Seledri", section: "produce" },
  long_beans: { name: "Long beans", localName: "Kacang panjang", section: "produce" },
  chayote: { name: "Chayote", localName: "Labu siam", section: "produce" },
  corn: { name: "Sweet corn", localName: "Jagung manis", section: "produce" },
  cabbage: { name: "Cabbage", localName: "Kol", section: "produce" },
  carrot: { name: "Carrots", localName: "Wortel", section: "produce" },
  cauliflower: { name: "Cauliflower", localName: "Kembang kol", section: "produce" },
  bok_choy: { name: "Bok choy", localName: "Pakcoy", section: "produce" },
  bean_sprouts: { name: "Bean sprouts", localName: "Tauge", section: "produce" },
  potato: { name: "Potatoes", localName: "Kentang", section: "produce" },
  cucumber: { name: "Cucumber", localName: "Mentimun", section: "produce" },
  tomato: { name: "Tomatoes", localName: "Tomat", section: "produce" },
  lettuce: { name: "Lettuce", localName: "Selada", section: "produce" },
  mushroom: { name: "Mushrooms", localName: "Jamur", section: "produce" },
  banana: { name: "Bananas", localName: "Pisang", section: "produce" },

  // Meat & poultry
  chicken: { name: "Chicken (bone-in)", localName: "Ayam", section: "meat_poultry" },
  chicken_breast: { name: "Chicken breast", localName: "Dada ayam", section: "meat_poultry" },
  beef: { name: "Beef", localName: "Daging sapi", section: "meat_poultry" },
  beef_bacon: { name: "Beef bacon", localName: "Beef bacon", section: "meat_poultry" },
  guanciale: { name: "Guanciale", section: "meat_poultry", halal: "non_halal" },
  bacon: { name: "Bacon", section: "meat_poultry", halal: "non_halal" },

  // Dairy & eggs
  egg: { name: "Eggs", localName: "Telur", section: "dairy_eggs" },
  milk: { name: "Milk", localName: "Susu", section: "dairy_eggs" },
  condensed_milk: { name: "Sweetened condensed milk", localName: "Susu kental manis", section: "dairy_eggs" },
  butter: { name: "Butter", localName: "Mentega", section: "dairy_eggs" },
  cooking_cream: { name: "Cooking cream", localName: "Krim masak", section: "dairy_eggs" },
  parmesan: { name: "Parmesan", localName: "Keju parmesan", section: "dairy_eggs", halal: "check" },

  // Dry goods & spices
  rice: { name: "Rice", localName: "Beras", section: "dry_goods_spices" },
  spaghetti: { name: "Spaghetti", section: "dry_goods_spices" },
  egg_noodles: { name: "Egg noodles", localName: "Mie telur", section: "dry_goods_spices" },
  oats: { name: "Rolled oats", localName: "Oatmeal", section: "dry_goods_spices" },
  flour: { name: "Plain flour", localName: "Tepung terigu", section: "dry_goods_spices" },
  peanuts: { name: "Peanuts", localName: "Kacang tanah", section: "dry_goods_spices" },
  tamarind: { name: "Tamarind paste", localName: "Asam jawa", section: "dry_goods_spices" },
  coriander_seed: { name: "Ground coriander", localName: "Ketumbar bubuk", section: "dry_goods_spices" },
  black_pepper: { name: "Black pepper", localName: "Lada hitam", section: "dry_goods_spices" },
  thyme: { name: "Dried thyme", localName: "Timi kering", section: "dry_goods_spices" },
  salt: { name: "Salt", localName: "Garam", section: "dry_goods_spices" },
  sugar: { name: "Sugar", localName: "Gula pasir", section: "dry_goods_spices" },
  palm_sugar: { name: "Palm sugar", localName: "Gula merah", section: "dry_goods_spices" },
  honey: { name: "Honey", localName: "Madu", section: "dry_goods_spices" },
  cooking_oil: { name: "Cooking oil", localName: "Minyak goreng", section: "dry_goods_spices" },
  coconut_milk: { name: "Coconut milk", localName: "Santan", section: "dry_goods_spices" },
  shrimp_paste: { name: "Shrimp paste", localName: "Terasi", section: "dry_goods_spices" },
  fried_shallots: { name: "Fried shallots", localName: "Bawang goreng", section: "dry_goods_spices" },
  kecap_manis: { name: "Sweet soy sauce", localName: "Kecap manis", section: "dry_goods_spices", halal: "check" },
  oyster_sauce: { name: "Oyster sauce", localName: "Saus tiram", section: "dry_goods_spices", halal: "check" },
  stock_cube: { name: "Stock cube", localName: "Kaldu blok", section: "dry_goods_spices", halal: "check" },

  // Others
  tempe: { name: "Tempe", localName: "Tempe", section: "others" },
  tofu: { name: "Firm tofu", localName: "Tahu", section: "others" },
  bread: { name: "Sliced bread", localName: "Roti tawar", section: "others" },
  mayonnaise: { name: "Mayonnaise", localName: "Mayones", section: "others", halal: "check" },
  red_wine: { name: "Red wine", section: "others", halal: "non_halal" },
} satisfies Record<string, CatalogEntry>;

export type IngredientKey = keyof typeof CATALOG;
export const INGREDIENTS: Record<IngredientKey, CatalogEntry> = CATALOG;
