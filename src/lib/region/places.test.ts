import { describe, expect, it } from "vitest";
import { SHAPES } from "./jateng-shapes";
import { VILLAGES } from "./jateng-villages";
import { allRegencies, isProvinceAverage, locate, PROVINCE_AVERAGE, searchPlaces } from "./places";

describe("searchPlaces", () => {
  it("finds a kota by the start of its name, before its kecamatan", () => {
    const results = searchPlaces("Sala");
    expect(results[0]).toMatchObject({ kind: "regency", name: "Kota Salatiga", city: { id: "3373" } });
  });

  it("maps a kecamatan to its kota/kabupaten", () => {
    const sidorejo = searchPlaces("sidorejo").find((p) => p.kind === "district" && p.city.id === "3373");
    expect(sidorejo).toMatchObject({ name: "Sidorejo", city: { name: "Kota Salatiga", province: "Jawa Tengah" } });
  });

  it("treats Kab. and Kabupaten alike", () => {
    expect(searchPlaces("kabupaten boyolali")[0]?.name).toBe("Kab. Boyolali");
    expect(searchPlaces("kab boyo")[0]?.name).toBe("Kab. Boyolali");
  });

  it("skips a kecamatan that only repeats its kabupaten's name", () => {
    expect(searchPlaces("boyolali").filter((p) => p.kind === "district" && p.city.id === "3309")).toEqual([]);
  });

  it("maps desa/kelurahan once loaded and narrowed to 3+ letters", () => {
    expect(searchPlaces("blotongan").some((p) => p.kind === "kelurahan")).toBe(false);
    expect(searchPlaces("blotongan", VILLAGES)[0]).toMatchObject({ kind: "kelurahan", name: "Blotongan", city: { id: "3373" } });
    expect(searchPlaces("bl", VILLAGES).every((p) => p.kind !== "kelurahan" && p.kind !== "desa")).toBe(true);
  });

  it("gives every row a unique key, even when desa share a name", () => {
    const keys = searchPlaces("salam", VILLAGES, 100).map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("returns nothing for an empty query and caps long lists", () => {
    expect(searchPlaces("  ")).toEqual([]);
    expect(searchPlaces("s", VILLAGES).length).toBeLessThanOrEqual(12);
  });
});

describe("allRegencies", () => {
  it("lists the 35 kota/kabupaten of Jawa Tengah", () => {
    expect(allRegencies()).toHaveLength(35);
  });
});

describe("locate", () => {
  it("finds the kota/kabupaten a point is in", () => {
    expect(locate(-7.3305, 110.5084, SHAPES)?.id).toBe("3373"); // Salatiga town centre
    expect(locate(-6.9838, 110.4094, SHAPES)?.id).toBe("3374"); // Simpang Lima, Semarang
    expect(locate(-7.5755, 110.8243, SHAPES)?.id).toBe("3372"); // Surakarta
  });

  it("is null outside Jawa Tengah", () => {
    expect(locate(-6.2, 106.8167, SHAPES)).toBeNull(); // Jakarta
    expect(locate(-7.7956, 110.3695, SHAPES)).toBeNull(); // Yogyakarta
  });
});

describe("province average", () => {
  it("is marked by its 2-digit id", () => {
    expect(isProvinceAverage(PROVINCE_AVERAGE)).toBe(true);
    expect(isProvinceAverage({ id: "3373", name: "Kota Salatiga", province: "Jawa Tengah" })).toBe(false);
  });
});
