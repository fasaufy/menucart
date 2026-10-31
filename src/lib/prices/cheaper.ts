import { ALTERNATIVES } from "../dishes/alternatives";
import { replacementLines } from "../dishes/swaps";
import type { City, Ingredient, ListItem } from "../types";
import { linePrice, quoteItem } from "./price";
import { BAPANAS_JATENG } from "./bapanas-jateng";
import { PASAR } from "./pasar";

// Cheaper this week: the "Can't find" alternatives that cost less than the line
// (over budget, price jumped), and month-on-month price moves from Bapanas.

export type CheaperOption = {
  id: string;
  /** What to buy instead: one ingredient, or two ("Beef brisket + Paprika powder"). */
  lines: Pick<Ingredient, "name" | "localName">[];
  note: string;
  cost: number;
  saving: number;
};

/** Smaller savings aren't worth changing the menu for. */
const MIN_SAVING = 2_000;

/** Priced alternatives at least Rp2.000 cheaper than the line, biggest saving first. Empty without a price. */
export function cheaperOptions(item: ListItem, city: City): CheaperOption[] {
  const current = linePrice(item, city);
  const options = ALTERNATIVES.get(item.key);
  if (!current || !options || item.replacedBy) return [];
  const first = item.amounts[0];
  if (!first) return [];
  const base: Ingredient = { ...item, qty: first.qty, unit: first.unit };

  return options
    .flatMap((option) => {
      const lines = replacementLines(base, option);
      const quotes = lines.map((l) => quoteItem({ key: l.key, amounts: [{ qty: l.qty, unit: l.unit }] }, city));
      if (quotes.some((q) => !q)) return [];
      const cost = quotes.reduce((n, q) => n + q!.cost, 0);
      if (current.cost - cost < MIN_SAVING) return [];
      const names = lines.map(({ name, localName }) => ({ name, localName }));
      return [{ id: option.id, lines: names, note: option.note, cost, saving: current.cost - cost }];
    })
    .sort((a, b) => b.saving - a.saving);
}

/** A rise this big since last month gets flagged ("up 23% since Oct"). */
const JUMP = 0.2;

export type PriceChange = { change: number; previousMonth: string };

/**
 * How much a Bapanas-priced line moved since the month before, if it jumped.
 * Monthly data, so this is "since last month", not "this week".
 */
export function priceJump(key: string, table = BAPANAS_JATENG): PriceChange | undefined {
  const entry = PASAR[key as keyof typeof PASAR];
  if (!entry || typeof entry.price === "number") return undefined;
  const row = table[entry.price.bapanas];
  if (!row?.previous) return undefined;
  const change = row.price / row.previous - 1;
  if (change < JUMP) return undefined;
  const [year, month] = row.month.split("-").map(Number);
  const previousMonth = month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
  return { change, previousMonth };
}
