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
  /** "Always apply halal swaps": Generate picks the top swap and skips the review. */
  autoSwap: boolean;
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
  /** Set on lines produced by a halal swap: the original ingredient's name. */
  swappedFrom?: string;
}

/** Per dish: original ingredient key → chosen swap option id, or "keep". */
export type SwapChoices = Record<string, string>;

export interface Dish {
  id: string;
  name: string;
  aliases: string[];
  source: "library" | "ai" | "user";
  /** Shown under the name in autocomplete, e.g. "Italian" */
  cuisine?: string;
  /** Meals it's usually eaten at; drives suggestions in the add-dish sheet */
  meals?: Meal[];
  /** Quantities below are for this many people */
  servings: number;
  ingredients: Ingredient[];
  /** A library dish the user edited; the saved copy overrides the library. */
  customized?: boolean;
  /** Halal swaps chosen for this dish; applied on top of `ingredients`. */
  swaps?: SwapChoices;
}

export interface Swap {
  forKey: string;
  options: { name: string; note: string; rank: number }[];
}

export interface Amount {
  qty: number;
  unit: string;
}

export type ListItemState = "to_buy" | "at_home" | "bought" | "skipped";

/**
 * One line of a week's grocery list, keyed by ingredient. Ingredient fields
 * are a snapshot so the list renders without the dish library.
 */
export interface ListItem {
  weekId: string;
  key: string;
  name: string;
  localName?: string;
  section: Section;
  halal: HalalStatus;
  /** One per unit family; more than one means incompatible units (sub-lines). */
  amounts: Amount[];
  /** This line is a halal swap for the named original ingredient. */
  swappedFrom?: string;
  /** Dishes that use it; count > 1 when a dish is planned more than once. */
  uses: { dishId: string; dishName: string; count: number }[];
  state: ListItemState;
  replacedBy?: string;
  /** Bought, then its dish was removed from the plan. */
  noLongerNeeded?: boolean;
  /** Not bought last week and carried into this week's list (key is "carried:<key>"). */
  carriedOver?: boolean;
  updatedAt: number;
}

export type ReportReason = "wrong_ingredient" | "wrong_amount" | "halal_tag" | "other";

/** "Report" on a library ingredient (PRD: improves the dish library). Sent to the server with sync. */
export interface IngredientReport {
  id?: number;
  dishId: string;
  dishName: string;
  ingredientKey: string;
  ingredientName: string;
  reason: ReportReason;
  note?: string;
  createdAt: number;
  sent: boolean;
}
