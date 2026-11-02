import { formatRupiah } from "../money";
import { linePrice, quoteItem } from "../prices/price";
import { getStrings } from "../strings";
import type { City, ListItem } from "../types";
import { groupByStall, type Stall } from "./stalls";
import { formatAmount, formatBuy, roundForShopping } from "./units";

// "Titip belanja" (L7): the list for whoever shops, as one WhatsApp message.
// Always in Bahasa Indonesia, whatever the app's language: it goes to the
// seller's side of the trip. Grouped by stall, amounts the way sellers sell.

const ICONS: Record<Stall, string> = {
  sayur: "🥬",
  ayam_telur: "🍗",
  daging: "🥩",
  ikan: "🐟",
  tahu_tempe: "🫘",
  kelontong: "🧂",
  supermarket: "🏪",
};

export type TitipOptions = {
  budget: number;
  city: City;
  /** The day it's sent: "Selasa 13 Okt". */
  date: Date;
  /** Loose items (cabai, bawang, rempah) as "Rp5.000" rather than "± 50 g". */
  rupiahForLoose: boolean;
  /** Ends with "Dibuat pakai MenuCart". Off unless the user turns it on. */
  credit: boolean;
};

/** Only what's still to buy; can't-find replacements in place of the original. */
export function titipText(items: ListItem[], { budget, city, date, rupiahForLoose, credit }: TitipOptions): string {
  const id = getStrings("id");
  const toBuy = items.filter((i) => i.state === "to_buy" && !i.noLongerNeeded);
  const name = (i: ListItem) => i.localName ?? i.name;

  const day = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "short" }).format(date);
  const prices = toBuy.map((i) => linePrice(i, city));
  const total = prices.reduce((n, p) => n + (p?.cost ?? 0), 0);
  const lines = [
    `🛒 Titip belanja · ${day.replace(",", "")}`,
    `Estimasi: ${formatRupiah(total, { estimated: prices.some((p) => !p) })} (budget ${formatRupiah(budget)})`,
  ];

  for (const { stall, items: group } of groupByStall(toBuy)) {
    lines.push("", `${ICONS[stall]} ${id.stalls[stall]}`);
    for (const item of [...group].sort((a, b) => name(a).localeCompare(name(b)))) {
      const what = item.replacedBy ? `${item.replacedBy} (pengganti ${name(item)})` : `${name(item)} ${amount(item)}`;
      lines.push(`• ${what}${item.note ? `, ${item.note}` : ""}`);
    }
  }
  if (!toBuy.length) lines.push("", id.list.nothingToBuy);
  if (credit) lines.push("", "Dibuat pakai MenuCart");
  return lines.join("\n");

  function amount(item: ListItem) {
    const quote = quoteItem(item, city);
    if (!quote) return item.amounts.map((a) => formatAmount(a, id.units, "id-ID")).join(" + ");
    if (!quote.buy.loose) return formatBuy(quote.buy, id);
    if (rupiahForLoose) return formatRupiah(linePrice(item, city)?.cost ?? quote.cost);
    return `± ${formatAmount(roundForShopping(quote.needed), id.units, "id-ID")}`;
  }
}
