import { describe, expect, it } from "vitest";
import { formatRb, formatRupiah, parseRupiah, rupiahNumber } from "./money";

describe("formatRupiah", () => {
  it("uses Rp with Indonesian grouping and no space", () => {
    expect(formatRupiah(142500)).toBe("Rp142.500");
    expect(formatRupiah(200000)).toBe("Rp200.000");
    expect(formatRupiah(5000)).toBe("Rp5.000");
    expect(formatRupiah(0)).toBe("Rp0");
    expect(formatRupiah(1250000)).toBe("Rp1.250.000");
  });

  it("marks estimates with ≈ and no space", () => {
    expect(formatRupiah(6000, { estimated: true })).toBe("≈Rp6.000");
  });

  it("rounds to whole rupiah and keeps the sign in front", () => {
    expect(formatRupiah(9999.6)).toBe("Rp10.000");
    expect(formatRupiah(-13000)).toBe("-Rp13.000");
  });
});

describe("rupiahNumber", () => {
  it("is the grouped number without a prefix or sign", () => {
    expect(rupiahNumber(142500)).toBe("142.500");
    expect(rupiahNumber(-13000)).toBe("13.000");
  });
});

describe("formatRb", () => {
  it("shortens whole thousands for chips", () => {
    expect(formatRb(150000)).toBe("150rb");
    expect(formatRb(50000)).toBe("50rb");
  });

  it("falls back to the full number otherwise", () => {
    expect(formatRb(142500)).toBe("142.500");
  });
});

describe("parseRupiah", () => {
  it("reads digits from whatever was typed", () => {
    expect(parseRupiah("Rp 200.000")).toBe(200000);
    expect(parseRupiah("150000")).toBe(150000);
    expect(parseRupiah("")).toBe(0);
    expect(parseRupiah("abc")).toBe(0);
  });
});
