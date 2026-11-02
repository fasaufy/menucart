import { describe, expect, it } from "vitest";
import { convertAmount } from "./convert";

describe("convertAmount", () => {
  it("turns pieces into grams and back with the piece weight", () => {
    expect(convertAmount("egg", 2, "pcs", "g")).toBe(120);
    expect(convertAmount("egg", 120, "g", "pcs")).toBe(2);
    expect(convertAmount("shallot", 4, "pcs", "g")).toBe(30); // 32 g → nearest 5
    expect(convertAmount("garlic", 3, "cloves", "g")).toBe(15);
    expect(convertAmount("eggplant", 1, "pcs", "kg")).toBe(0.2);
  });

  it("never rounds to nothing", () => {
    expect(convertAmount("bird_eye_chili", 1, "pcs", "g")).toBe(5);
    expect(convertAmount("egg", 10, "g", "pcs")).toBe(1);
  });

  it("has no answer without a piece weight or for unrelated units", () => {
    expect(convertAmount("cabbage", 1, "pcs", "g")).toBeUndefined();
    expect(convertAmount("egg", 2, "pcs", "tbsp")).toBeUndefined();
    expect(convertAmount("mystery", 2, "pcs", "g")).toBeUndefined();
  });
});
