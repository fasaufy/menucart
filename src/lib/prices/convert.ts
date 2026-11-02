import { toBase } from "../list/units";
import { PASAR } from "./pasar";

// Switching an ingredient between grams and pieces in the dish editor
// ("2 pcs" eggs ↔ "120 g") keeps the amount, using the piece weight.

const GRAMS: Record<string, number> = { g: 1, kg: 1000 };

/**
 * The same amount in another unit, for ingredients with a known piece weight.
 * Undefined when there's no safe conversion (then the number stays as typed).
 */
export function convertAmount(key: string, qty: number, from: string, to: string): number | undefined {
  const entry = PASAR[key as keyof typeof PASAR];
  if (!entry || entry.base !== "g" || from === to) return undefined;
  const gramsPer = (unit: string) => GRAMS[unit] ?? entry.per?.[toBase({ qty: 1, unit }).unit];
  const a = gramsPer(from);
  const b = gramsPer(to);
  if (!a || !b) return undefined;
  const converted = (qty * a) / b;
  // Pieces in whole numbers; grams to the nearest 5, kilos to 0.05.
  if (to === "g") return Math.max(5, Math.round(converted / 5) * 5);
  if (to === "kg") return Math.max(0.05, Math.round(converted * 20) / 20);
  return Math.max(1, Math.round(converted));
}
