import { describe, expect, it } from "vitest";
import { DISH_LIBRARY, getLibraryDish, hasNonHalal, suggestionsFor } from "./library";
import { searchDishes } from "./search";

// The 50 dishes from dish-suggestions.md, with the halal column.
// "swap" = has a non-halal ingredient; "check" = only check items.
const SUGGESTIONS: [name: string, halal: "halal" | "swap" | "check"][] = [
  ["Nasi goreng", "halal"], ["Mie goreng", "halal"], ["Soto ayam", "halal"],
  ["Beef rendang", "halal"], ["Ayam goreng", "halal"], ["Sayur asem", "halal"],
  ["Sayur lodeh", "halal"], ["Gado-gado", "halal"], ["Bubur ayam", "halal"],
  ["Nasi uduk", "halal"], ["Tempe orek", "halal"], ["Capcay", "swap"],
  ["Nasi lemak", "halal"], ["Pad krapow gai", "check"], ["Tom yum goong", "halal"],
  ["Thai green curry chicken", "check"], ["Pad thai", "halal"], ["Pho bo", "halal"],
  ["Tomato and egg stir-fry", "halal"], ["Kung pao chicken", "swap"], ["Mapo tofu", "swap"],
  ["Chicken teriyaki", "swap"], ["Miso soup", "check"], ["Oyakodon", "swap"],
  ["Bibimbap", "check"], ["Kimchi jjigae", "swap"], ["Chicken curry", "halal"],
  ["Dal tadka", "halal"], ["Chicken adobo", "halal"], ["Shakshuka", "halal"],
  ["Spaghetti carbonara", "swap"], ["Spaghetti bolognese", "swap"], ["Lasagna", "swap"],
  ["Mushroom risotto", "swap"], ["Spaghetti aglio e olio", "halal"], ["Beef bourguignon", "swap"],
  ["Ratatouille", "halal"], ["Quiche lorraine", "swap"], ["French omelette", "halal"],
  ["Croque monsieur", "swap"], ["Spanish omelette", "halal"], ["Chicken and seafood paella", "swap"],
  ["Moussaka", "swap"], ["Greek salad", "halal"], ["Shepherd's pie", "swap"],
  ["Full English breakfast", "swap"], ["Fish and chips", "swap"], ["Chicken schnitzel", "swap"],
  ["Beef goulash", "swap"], ["Beef stroganoff", "swap"],
];

describe("dish library", () => {
  it("has unique ids, ingredients and meals for every dish", () => {
    expect(new Set(DISH_LIBRARY.map((d) => d.id)).size).toBe(DISH_LIBRARY.length);
    for (const d of DISH_LIBRARY) {
      expect(d.ingredients.length, d.name).toBeGreaterThan(0);
      expect(d.meals?.length, d.name).toBeGreaterThan(0);
      expect(new Set(d.ingredients.map((i) => i.key)).size, `${d.name} repeats a key`).toBe(d.ingredients.length);
    }
  });

  it.each(SUGGESTIONS)("finds %s, with halal status matching the suggestions (%s)", (name, halal) => {
    const [dish] = searchDishes(DISH_LIBRARY, name, 1);
    expect(dish, name).toBeDefined();
    expect(hasNonHalal(dish)).toBe(halal === "swap");
    if (halal === "check") expect(dish.ingredients.some((i) => i.halal === "check")).toBe(true);
  });

  it("rotates meal suggestions by seed and only suggests fitting dishes", () => {
    const monday = suggestionsFor("dinner", 0);
    const tuesday = suggestionsFor("dinner", 1);
    expect(monday).toHaveLength(6);
    expect(monday.map((d) => d.id)).not.toEqual(tuesday.map((d) => d.id));
    expect(suggestionsFor("breakfast", 3).every((d) => d.meals!.includes("breakfast"))).toBe(true);
  });

  it("keeps the breakfast quick picks", () => {
    for (const id of ["bubur-ayam", "roti-bakar", "nasi-uduk", "oatmeal"]) {
      expect(getLibraryDish(id)?.meals).toContain("breakfast");
    }
  });
});
