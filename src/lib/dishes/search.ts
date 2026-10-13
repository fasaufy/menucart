import type { Dish } from "../types";

/** Lowercase, strip accents and extra spaces: "Bœuf  Bourguignon" ≈ "boeuf bourguignon". */
export function normalize(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/œ/g, "oe")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

// Higher is better; 0 means no match.
function scoreName(name: string, query: string, tokens: string[]): number {
  if (name === query) return 100;
  if (name.startsWith(query)) return 80;
  const words = name.split(" ");
  if (tokens.every((t) => words.some((w) => w.startsWith(t)))) return 60;
  if (name.includes(query)) return 40;
  return 0;
}

/**
 * Autocomplete over library and user dishes. Accepts English, Bahasa
 * Indonesia and mixed input through each dish's aliases.
 */
export function searchDishes(dishes: Dish[], rawQuery: string, limit = 5): Dish[] {
  const query = normalize(rawQuery);
  if (!query) return [];
  const tokens = query.split(" ");

  return dishes
    .map((dish) => {
      const nameScore = scoreName(normalize(dish.name), query, tokens);
      // Alias matches rank just below an equal match on the name.
      const aliasScore = Math.max(
        0,
        ...dish.aliases.map((a) => scoreName(normalize(a), query, tokens) - 5),
      );
      return { dish, score: Math.max(nameScore, aliasScore) };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.dish.name.localeCompare(b.dish.name))
    .slice(0, limit)
    .map((r) => r.dish);
}
