import type { City } from "../types";
import { DISTRICTS, REGENCIES } from "./jateng";

// Where the user shops (P3). City only, never coordinates: a kecamatan or
// desa/kelurahan maps to its kota/kabupaten, and GPS is used once to pick one.
// Only Jawa Tengah is covered for now; everything else uses its average.

export const PROVINCE = { id: "33", name: "Jawa Tengah" } as const;

export const PROVINCE_AVERAGE: City = { id: PROVINCE.id, name: PROVINCE.name, province: PROVINCE.name };

/** A 2-digit id is the province average, not a real city. */
export function isProvinceAverage(city: City) {
  return city.id.length === 2;
}

const byId = new Map(REGENCIES.map(([id, name]) => [id, name]));

export function regencyCity(id: string): City | undefined {
  const name = byId.get(id);
  return name ? { id, name, province: PROVINCE.name } : undefined;
}

export type PlaceKind = "regency" | "district" | "kelurahan" | "desa";

export type Place = {
  /** Unique per row: "3373", "3373:kec:Sidorejo", "3373:kBlotongan". */
  key: string;
  kind: PlaceKind;
  name: string;
  /** The kota/kabupaten whose prices it uses. */
  city: City;
};

/** "Kab." and "Kabupaten" are the same word to whoever is typing. */
function words(text: string) {
  return text
    .toLowerCase()
    .replace(/\bkab\.?(?=\s)/g, "kabupaten")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function matches(name: string, query: string[]) {
  const ws = words(name);
  return query.every((q) => ws.some((w) => w.startsWith(q)));
}

/** Every kota/kabupaten, for browsing before anything is typed. */
export function allRegencies(): Place[] {
  return REGENCIES.map(([id, name]) => ({ key: id, kind: "regency", name, city: regencyCity(id)! }));
}

/**
 * Kota/kabupaten first, then kecamatan, then desa/kelurahan (pass `villages`
 * once loaded; they're large). Each word typed must start a word in the name.
 */
export function searchPlaces(text: string, villages?: Record<string, string>, limit = 12): Place[] {
  const query = words(text);
  if (!query.length) return [];
  const out: Place[] = [];

  for (const place of allRegencies()) if (matches(place.name, query)) out.push(place);

  for (const [id, list] of Object.entries(DISTRICTS)) {
    const city = regencyCity(id)!;
    for (const name of list.split("|")) {
      // "Boyolali (kecamatan)" next to "Kab. Boyolali" only adds noise.
      if (!matches(name, query) || words(city.name).at(-1) === words(name).join(" ")) continue;
      out.push({ key: `${id}:kec:${name}`, kind: "district", name, city });
    }
  }

  // Desa/kelurahan only once a few letters narrow it down.
  if (villages && query.join("").length >= 3) {
    for (const [id, list] of Object.entries(villages)) {
      const city = regencyCity(id)!;
      const seen = new Set<string>();
      for (const entry of list.split("|")) {
        const name = entry.slice(1);
        // Several desa in one kabupaten can share a name; they'd be identical rows.
        if (!matches(name, query) || seen.has(entry)) continue;
        seen.add(entry);
        out.push({ key: `${id}:${entry}`, kind: entry[0] === "k" ? "kelurahan" : "desa", name, city });
        if (out.length >= limit) break;
      }
      if (out.length >= limit) break;
    }
  }

  return out.slice(0, limit);
}

type Ring = [number, number][];

/** Even–odd rule on [lat, lng] rings. */
function inside(lat: number, lng: number, rings: Ring[]) {
  let hit = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [yi, xi] = ring[i];
      const [yj, xj] = ring[j];
      if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit;
    }
  }
  return hit;
}

/** Shoelace area in square degrees: only compared, never shown. */
function area(rings: Ring[]) {
  let sum = 0;
  for (const ring of rings) {
    let a = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += (ring[j][1] + ring[i][1]) * (ring[j][0] - ring[i][0]);
    sum += Math.abs(a / 2);
  }
  return sum;
}

function km(lat1: number, lng1: number, lat2: number, lng2: number) {
  const rad = Math.PI / 180;
  const x = (lng2 - lng1) * rad * Math.cos(((lat1 + lat2) / 2) * rad);
  const y = (lat2 - lat1) * rad;
  return Math.hypot(x, y) * 6371;
}

/**
 * The kota/kabupaten a point falls in. Outlines are simplified (~300 m), so a
 * point just off every outline (a coast, a gap at a border) takes the one with
 * the nearest corner within 3 km. Null means outside Jawa Tengah.
 */
export function locate(lat: number, lng: number, shapes: Record<string, Ring[]>): City | null {
  // Enclaves (Kota Salatiga inside Kab. Semarang) aren't cut out of the outer
  // outline, so with two hits the smaller one wins.
  const hits = Object.entries(shapes).filter(([, rings]) => inside(lat, lng, rings));
  if (hits.length) {
    const [id] = hits.reduce((a, b) => (area(b[1]) < area(a[1]) ? b : a));
    return regencyCity(id)!;
  }
  let best: { id: string; d: number } | null = null;
  for (const [id, rings] of Object.entries(shapes)) {
    for (const ring of rings) {
      for (const [y, x] of ring) {
        const d = km(lat, lng, y, x);
        if (!best || d < best.d) best = { id, d };
      }
    }
  }
  return best && best.d <= 3 ? regencyCity(best.id)! : null;
}
