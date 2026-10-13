// Data model from CLAUDE.md. Ownerless weeks (ownerId: null) are guest data.

export type Meal = "breakfast" | "lunch" | "dinner";
export type HalalStatus = "halal" | "non_halal" | "check";
export type Section =
  | "produce"
  | "meat_poultry"
  | "seafood"
  | "dairy_eggs"
  | "dry_goods_spices"
  | "others";
export type Language = "en" | "id";
export type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Settings {
  householdSize: number;
  halalMode: boolean;
  meals: Meal[];
  language: Language;
}

export interface Week {
  id: string;
  ownerId: string | null;
  /** Monday, ISO date */
  startDate: string;
}

export interface Slot {
  weekId: string;
  day: Day;
  meal: Meal;
  dishId?: string;
  dishName: string;
  isSample?: boolean;
  /** ms epoch; last edit per slot wins when syncing */
  updatedAt: number;
}

export interface Ingredient {
  key: string;
  name: string;
  localName?: string;
  qty: number;
  unit: string;
  section: Section;
  halal: HalalStatus;
}

export interface Dish {
  id: string;
  name: string;
  aliases: string[];
  source: "library" | "ai" | "user";
  /** Shown under the name in autocomplete, e.g. "Italian" */
  cuisine?: string;
  /** Quantities below are for this many people */
  servings: number;
  ingredients: Ingredient[];
}

export interface Swap {
  forKey: string;
  options: { name: string; note: string; rank: number }[];
}

export interface ListItem {
  weekId: string;
  key: string;
  qty: number;
  unit: string;
  dishIds: string[];
  state: "to_buy" | "at_home" | "bought" | "skipped";
  replacedBy?: string;
}
