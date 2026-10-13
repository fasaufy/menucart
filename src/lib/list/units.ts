import type { Amount } from "../types";

// Units that convert safely share a family and a base unit (g, ml, tsp).
// Everything else (cloves, pcs, bunch…) is its own family: 2 cloves and
// 1 bunch of garlic stay as separate sub-lines.

export type CountUnit = "pcs" | "clove" | "stalk" | "leaf" | "slice" | "piece" | "bunch";

const CONVERTIBLE: Record<string, { base: "g" | "ml" | "tsp"; factor: number }> = {
  g: { base: "g", factor: 1 },
  kg: { base: "g", factor: 1000 },
  ml: { base: "ml", factor: 1 },
  l: { base: "ml", factor: 1000 },
  tsp: { base: "tsp", factor: 1 },
  tbsp: { base: "tsp", factor: 3 },
};

const COUNT_ALIASES: Record<string, CountUnit> = {
  pc: "pcs", pcs: "pcs",
  clove: "clove", cloves: "clove",
  stalk: "stalk", stalks: "stalk",
  leaf: "leaf", leaves: "leaf",
  slice: "slice", slices: "slice",
  piece: "piece", pieces: "piece",
  bunch: "bunch", bunches: "bunch",
};

/** Converts to the family's base unit; unknown units pass through lowercased. */
export function toBase({ qty, unit }: Amount): Amount {
  const u = unit.trim().toLowerCase();
  const conv = CONVERTIBLE[u];
  if (conv) return { qty: qty * conv.factor, unit: conv.base };
  return { qty, unit: COUNT_ALIASES[u] ?? u };
}

/**
 * Rounds a base amount to something you can buy: whole items, the nearest
 * 5 g/ml under 100 (10 above), the nearest ½ tsp.
 */
export function roundForShopping({ qty, unit }: Amount): Amount {
  const round = (step: number) => Math.max(step, Math.round(qty / step) * step);
  switch (unit) {
    case "g":
    case "ml":
      return { qty: round(qty < 100 ? 5 : 10), unit };
    case "tsp":
      return { qty: round(0.5), unit };
    default:
      // Counts round up: 2.2 eggs means buying 3.
      return { qty: Math.ceil(qty - 1e-9), unit };
  }
}

export type UnitLabels = {
  [U in Exclude<CountUnit, "pcs">]: (n: number) => string;
} & { tsp: string; tbsp: string };

/** "1.25 kg", "2 tbsp", "4 tsp", "10 cloves", "3" (pcs show as a bare number). */
export function formatAmount({ qty, unit }: Amount, labels: UnitLabels, locale: string): string {
  const num = (n: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(n);
  switch (unit) {
    case "g":
      return qty >= 1000 ? `${num(qty / 1000)} kg` : `${num(qty)} g`;
    case "ml":
      return qty >= 1000 ? `${num(qty / 1000)} l` : `${num(qty)} ml`;
    case "tsp":
      return qty >= 3 && qty % 3 === 0
        ? `${num(qty / 3)} ${labels.tbsp}`
        : `${num(qty)} ${labels.tsp}`;
    case "pcs":
      return num(qty);
    default: {
      const label = labels[unit as keyof UnitLabels];
      return typeof label === "function" ? `${num(qty)} ${label(qty)}` : `${num(qty)} ${unit}`;
    }
  }
}
