import type { City } from "../types";
import { BAPANAS_NATIONAL } from "./bapanas-national";
import type { PasarEntry } from "./pasar";

// Where a price comes from. Sources are tried in order; an official city
// survey (SP2KP) slots in first once its owner allows automated use.
// Everything here ships with the app, so prices work offline.
//
// For the user test everyone gets the national average. The city is still
// stored and the Jawa Tengah table (bapanas-jateng.ts) kept, to switch back to
// province prices after the test.

export type SourceId = "bapanas" | "menucart" | "user";

export type SourceInfo = {
  id: SourceId;
  /** What the price covers: "national" for now; a province or city later. */
  area: "national" | string;
  /** "YYYY-MM" for monthly data. */
  month?: string;
};

export interface PriceSource {
  id: SourceId;
  /** Rupiah for one sell unit of this ingredient where the user shops, if this source has it. */
  unitPrice(entry: PasarEntry, city: City): { amount: number; info: SourceInfo } | undefined;
}

/** Badan Pangan Nasional monthly consumer price, national average, per kg or liter. */
const bapanas: PriceSource = {
  id: "bapanas",
  unitPrice(entry) {
    if (typeof entry.price === "number") return undefined;
    const row = BAPANAS_NATIONAL[entry.price.bapanas];
    if (!row) return undefined;
    return {
      amount: (row.price * entry.sell.size) / 1000,
      info: { id: "bapanas", area: "national", month: row.month },
    };
  },
};

/** MenuCart's own estimate per sell unit (vegetables, tahu, tempe…), not tied to a place. */
const menucart: PriceSource = {
  id: "menucart",
  unitPrice(entry) {
    if (typeof entry.price !== "number") return undefined;
    return { amount: entry.price, info: { id: "menucart", area: "national" } };
  },
};

export const SOURCES: PriceSource[] = [bapanas, menucart];
