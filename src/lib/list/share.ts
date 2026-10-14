import type { Strings } from "../strings";
import type { Language, ListItem, Section } from "../types";
import { localeFor } from "../week";
import { formatAmount } from "./units";

const SECTION_ORDER: Section[] = ["produce", "meat_poultry", "seafood", "dairy_eggs", "dry_goods_spices", "others"];

/**
 * Plain-text list for WhatsApp (PRD F6): only what's still to buy, grouped
 * by market section, with amounts. Can't-find replacements show as bought-instead.
 */
export function shareText(items: ListItem[], weekRange: string, t: Strings, language: Language): string {
  const toBuy = items.filter((i) => i.state === "to_buy" && !i.noLongerNeeded);
  const name = (i: ListItem) => (language === "id" ? (i.localName ?? i.name) : i.name);
  const lines = [`${t.share.heading} · ${weekRange}`];
  for (const section of SECTION_ORDER) {
    const group = toBuy
      .filter((i) => i.section === section)
      .sort((a, b) => name(a).localeCompare(name(b)));
    if (!group.length) continue;
    lines.push("", `*${t.sections[section]}*`);
    for (const item of group) {
      const amount = item.amounts.map((a) => formatAmount(a, t.units, localeFor(language))).join(" + ");
      lines.push(item.replacedBy ? `- ${item.replacedBy} (${t.cantFind.instead(name(item))})` : `- ${name(item)} — ${amount}`);
    }
  }
  if (!toBuy.length) lines.push("", t.list.nothingToBuy);
  lines.push("", t.share.footer);
  return lines.join("\n");
}
