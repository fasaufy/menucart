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
  /** What the household spends on food a week, in whole rupiah. Things at home don't count. */
  weeklyBudget: number;
  /** Where prices come from. City only, never coordinates. */
  city: City;
}

/** A kota/kabupaten by its BPS code; a 2-digit id is a province average ("33" = Jawa Tengah). */
export interface City {
  id: string;
  name: string;
  province: string;
}

export interface Week {
  id: string;
  ownerId: string | null;
  /** Monday, ISO date */
  startDate: string;
  updatedAt?: number;
}

/** One dish planned in a meal. */
export interface SlotDish {
  dishId?: string;
  dishName: string;
}

export interface Slot {
  weekId: string;
  day: Day;
  meal: Meal;
  /** The meal's first dish. */
  dishId?: string;
  dishName: string;
  /** Further dishes in the same meal, in the order they were added. Use slotDishes() to read all of them. */
  more?: SlotDish[];
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
  /**
   * AI ingredient generation for a dish the library doesn't know:
   * pending = queued (offline or not yet tried), unrecognized = the AI couldn't
   * work it out, off = generation unavailable; absent = done or not needed.
   */
  aiStatus?: "pending" | "unrecognized" | "off";
  /** Last local change (ms), for sync. */
  updatedAt?: number;
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
  /** Dishes that use it; count > 1 when a dish is planned more than once. `amounts` is that dish's share (all its plannings). */
  uses: { dishId: string; dishName: string; count: number; amounts?: Amount[] }[];
  state: ListItemState;
  replacedBy?: string;
  /** Bought, then its dish was removed from the plan. */
  noLongerNeeded?: boolean;
  /** Not bought last week and carried into this week's list (key is "carried:<key>"). */
  carriedOver?: boolean;
  /** What the user paid or will pay for this line (rupiah), replacing the estimate for this week only. */
  userPrice?: number;
  /** The line's price when it was ticked bought, so later price changes don't move it. */
  boughtPrice?: number;
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
