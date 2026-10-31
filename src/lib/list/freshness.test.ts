import { describe, expect, it } from "vitest";
import type { Day, Dish } from "../types";
import { dishNotes, tooLate } from "./freshness";

const dish = (id: string, keys: string[]): Dish => ({
  id,
  name: id,
  aliases: [],
  source: "user",
  servings: 2,
  ingredients: keys.map((key) => ({ key, name: key === "spinach" ? "Spinach" : key === "tempe" ? "Tempe" : key, qty: 100, unit: "g", section: "produce", halal: "halal" })),
});

describe("tooLate", () => {
  it("is true once a short-lived ingredient is past its keeping time", () => {
    expect(tooLate("spinach", 2)).toBe(false);
    expect(tooLate("spinach", 3)).toBe(true);
    expect(tooLate("rice", 6)).toBe(false);
  });
});

describe("dishNotes", () => {
  const plan = (entries: [Day, Dish][]) => entries.map(([day, d]) => ({ day, dish: d }));

  it("warns when a dish is too late in the week for something bought on shopping day", () => {
    const notes = dishNotes(plan([[4, dish("tumis-bayam", ["spinach", "garlic"])]]), 0);
    expect(notes.get("4:tumis-bayam")).toMatchObject({ kind: "late", ingredient: { key: "spinach" }, keeps: [1, 2] });
  });

  it("notes leftovers from an earlier dish", () => {
    const notes = dishNotes(plan([[0, dish("tempe-goreng", ["tempe"])], [1, dish("tempe-orek", ["tempe"])]]), 0);
    expect(notes.get("1:tempe-orek")).toMatchObject({ kind: "uses", ingredient: { key: "tempe" }, day: 0 });
    expect(notes.has("0:tempe-goreng")).toBe(false);
  });

  it("counts from the shopping day and skips days before it", () => {
    const d = dish("tumis-bayam", ["spinach"]);
    expect(dishNotes(plan([[4, d]]), 3).has("4:tumis-bayam")).toBe(false);
    expect(dishNotes(plan([[1, d]]), 3).has("1:tumis-bayam")).toBe(false);
  });
});
