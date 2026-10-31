import { PROVINCE } from "../region/places";
import type { City } from "../types";
import { BAPANAS_JATENG } from "./bapanas-jateng";
import type { PasarEntry } from "./pasar";

// Where a price comes from. Sources are tried in order; an official city
// survey (SP2KP) slots in first once its owner allows automated use.
// Everything here ships with the app, so prices work offline.

export type SourceId = "bapanas" | "menucart" | "user";

export type SourceInfo = {
  id: SourceId;
  /** Province or city the price is for. */
  area: string;
  /** "YYYY-MM" for monthly data. */
  month?: string;
};

export interface PriceSource {
  id: SourceId;
  /** Rupiah for one sell unit of this ingredient where the user shops, if this source has it. */
  unitPrice(entry: PasarEntry, city: City): { amount: number; info: SourceInfo } | undefined;
}

/** Badan Pangan Nasional monthly consumer average for the province, per kg or liter. */
const bapanas: PriceSource = {
  id: "bapanas",
  unitPrice(entry, city) {
    if (typeof entry.price === "number" || !city.id.startsWith(PROVINCE.id)) return undefined;
    const row = BAPANAS_JATENG[entry.price.bapanas];
    if (!row) return undefined;
    return {
      amount: (row.price * entry.sell.size) / 1000,
      info: { id: "bapanas", area: PROVINCE.name, month: row.month },
    };
  },
};

/** MenuCart's own estimate per sell unit for Jawa Tengah. */
const menucart: PriceSource = {
  id: "menucart",
  unitPrice(entry) {
    if (typeof entry.price !== "number") return undefined;
    return { amount: entry.price, info: { id: "menucart", area: PROVINCE.name } };
  },
};

export const SOURCES: PriceSource[] = [bapanas, menucart];
