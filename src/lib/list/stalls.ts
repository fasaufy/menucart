import type { ListItem, Section } from "../types";

// By aisle groups the list the way a pasar trip goes: stall by stall, not by
// supermarket section. Shopping mode keeps the sections.

export type Stall = "sayur" | "ayam_telur" | "daging" | "ikan" | "tahu_tempe" | "kelontong" | "supermarket";

export const STALL_ORDER: Stall[] = ["sayur", "ayam_telur", "daging", "ikan", "tahu_tempe", "kelontong", "supermarket"];

const BY_SECTION: Record<Section, Stall> = {
  produce: "sayur",
  meat_poultry: "daging",
  seafood: "ikan",
  dairy_eggs: "supermarket",
  dry_goods_spices: "kelontong",
  others: "kelontong",
};

/** Where a key is bought when its section says otherwise. */
const OVERRIDES: Record<string, Stall> = {
  chicken: "ayam_telur",
  chicken_thigh: "ayam_telur",
  chicken_breast: "ayam_telur",
  chicken_wings: "ayam_telur",
  egg: "ayam_telur",
  tofu: "tahu_tempe",
  tempe: "tahu_tempe",
  // Pressed fresh at the pasar.
  coconut_milk: "sayur",
  grated_coconut: "sayur",
  // Halal swaps for cured pork and imported dairy: supermarket shelves.
  beef_bacon: "supermarket",
  smoked_beef: "supermarket",
  smoked_turkey: "supermarket",
  smoked_chicken: "supermarket",
  chicken_ham: "supermarket",
  beef_chorizo: "supermarket",
  beef_sausage: "supermarket",
  chicken_sausage: "supermarket",
  canned_tuna: "supermarket",
  olive_oil: "supermarket",
  spaghetti: "supermarket",
};

export function stallOf(item: Pick<ListItem, "key" | "section">): Stall {
  return OVERRIDES[item.key] ?? BY_SECTION[item.section];
}

/** Lines grouped by stall, in walking order; empty stalls left out. */
export function groupByStall<T extends Pick<ListItem, "key" | "section">>(items: T[]) {
  return STALL_ORDER.map((stall) => ({ stall, items: items.filter((i) => stallOf(i) === stall) })).filter(
    (g) => g.items.length > 0,
  );
}
