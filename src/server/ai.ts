import Anthropic from "@anthropic-ai/sdk";
import { INGREDIENTS, catalogIngredient, type IngredientKey } from "@/lib/dishes/ingredients";
import { normalize } from "@/lib/dishes/search";
import type { HalalStatus, Ingredient, Meal, Section } from "@/lib/types";

// AI ingredient generation for dishes the library doesn't know (step 7).
// One structured-output call per *new* dish; results are cached by the caller.

export const AI_MODEL = "claude-opus-5-5";

const UNITS = ["g", "kg", "ml", "l", "tsp", "tbsp", "pcs", "cloves", "stalks", "leaves", "slices", "pieces", "bunch"] as const;
const SECTIONS: Section[] = ["produce", "meat_poultry", "seafood", "dairy_eggs", "dry_goods_spices", "others"];
const HALAL: HalalStatus[] = ["halal", "non_halal", "check"];
const MEALS: Meal[] = ["breakfast", "lunch", "dinner"];

/** Ingredients for the dish, as the API returns them (structured output). */
const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["recognized", "name", "cuisine", "meals", "ingredients"],
  properties: {
    recognized: { type: "boolean" },
    name: { type: "string" },
    cuisine: { type: "string" },
    meals: { type: "array", items: { type: "string", enum: MEALS } },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "name", "local_name", "qty", "unit", "section", "halal"],
        properties: {
          key: { type: "string" },
          name: { type: "string" },
          local_name: { type: "string" },
          qty: { type: "number" },
          unit: { type: "string", enum: UNITS },
          section: { type: "string", enum: SECTIONS },
          halal: { type: "string", enum: HALAL },
        },
      },
    },
  },
} as const;

type Output = {
  recognized: boolean;
  name: string;
  cuisine: string;
  meals: Meal[];
  ingredients: { key: string; name: string; local_name: string; qty: number; unit: string; section: Section; halal: HalalStatus }[];
};

// Stable system prompt (cached): the rules plus the shared ingredient catalog,
// so generated dishes reuse the same keys and merge with library dishes.
const CATALOG = (Object.keys(INGREDIENTS) as IngredientKey[])
  .map((k) => {
    const e = INGREDIENTS[k];
    return `${k} | ${e.name}${e.localName ? ` / ${e.localName}` : ""} | ${e.section} | ${e.halal ?? "halal"}`;
  })
  .join("\n");

const SYSTEM = `You write grocery ingredient lists for MenuCart, a meal-planning app for Muslim home cooks in Indonesia who shop at supermarkets and traditional markets (pasar).

Given a dish name (English, Bahasa Indonesia or mixed), return the ingredients a home cook buys to make it for 2 people.

Rules:
- recognized: false if the input isn't a dish you can identify (gibberish, a person's name, a non-food item, or too vague to cook). Then return an empty ingredients list.
- name: the dish's common name, capitalised like "Soto betawi" or "Chicken katsu curry". cuisine: one or two words, e.g. "Indonesian", "Japanese".
- meals: the meals this dish is usually eaten at.
- Quantities are for 2 servings, in amounts a shopper understands. Use only the allowed units. Count whole items with "pcs".
- 4 to 20 ingredients. Include basics like salt and cooking oil when the recipe uses them. Leave out water.
- key: if an ingredient is the same thing as an entry in the catalog below, use that entry's key exactly (left column). Otherwise use "new".
- name: the English ingredient name. local_name: the usual Bahasa Indonesia name (empty string if there isn't one).
- section: the market section where a shopper finds it.
- halal: "non_halal" for pork and pork products (bacon, ham, lard, pork-based sausages), alcohol (wine, beer, mirin, sake, rum, brandy, cooking wine), and anything containing them. "check" when it depends on the brand or source (cheese, gelatin, stock cubes, bottled sauces, pastes, sausages of unknown meat, vanilla extract, marshmallows). Otherwise "halal". Assume meat is bought halal-certified.
- Write the recipe as it is traditionally made, including non-halal ingredients if the traditional recipe has them: the app offers halal swaps separately.

Catalog (key | English / Bahasa Indonesia | section | halal):
${CATALOG}`;

export type GeneratedDish = {
  recognized: boolean;
  name: string;
  cuisine?: string;
  meals: Meal[];
  servings: number;
  ingredients: Ingredient[];
};

export class AiUnavailableError extends Error {}

let client: Anthropic | null = null;

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) throw new AiUnavailableError("ANTHROPIC_API_KEY is not set");
  client ??= new Anthropic();
  return client;
}

export const nameKeyOf = (name: string) => normalize(name);

/** Calls Claude for one dish. Throws AiUnavailableError, or the SDK's typed API errors. */
export async function generateDish(dishName: string): Promise<GeneratedDish> {
  const response = await getClient().beta.messages.create({
    model: AI_MODEL,
    max_tokens: 16000,
    // Extraction task: low effort keeps it fast and cheap.
    output_config: { effort: "low", format: { type: "json_schema", schema: OUTPUT_SCHEMA as unknown as Record<string, unknown> } },
    // If a safety classifier declines, retry on Anthropic's recommended fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: `Dish: ${dishName.slice(0, 120)}` }],
  });

  if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
    return { recognized: false, name: dishName, meals: [], servings: 2, ingredients: [] };
  }
  const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  return toDish(JSON.parse(text) as Output, dishName);
}

/** Maps the model's output onto the app's ingredient model; catalog entries win over the model for name/section/halal. */
export function toDish(out: Output, fallbackName: string): GeneratedDish {
  const seen = new Set<string>();
  const ingredients: Ingredient[] = [];
  for (const line of out.recognized ? out.ingredients.slice(0, 25) : []) {
    const qty = Number(line.qty);
    if (!Number.isFinite(qty) || qty <= 0 || qty > 10000) continue;
    const unit = (UNITS as readonly string[]).includes(line.unit) ? line.unit : "pcs";
    let ingredient: Ingredient;
    if (line.key in INGREDIENTS) {
      ingredient = catalogIngredient(line.key as IngredientKey, qty, unit);
    } else {
      const name = line.name.trim().slice(0, 60);
      if (!name) continue;
      ingredient = {
        key: `custom:${normalize(name).replace(/ /g, "_")}`,
        name,
        localName: line.local_name.trim().slice(0, 60) || undefined,
        qty,
        unit,
        section: SECTIONS.includes(line.section) ? line.section : "others",
        halal: HALAL.includes(line.halal) ? line.halal : "check",
      };
    }
    if (seen.has(ingredient.key)) continue;
    seen.add(ingredient.key);
    ingredients.push(ingredient);
  }
  const recognized = out.recognized && ingredients.length > 0;
  return {
    recognized,
    name: out.name.trim().slice(0, 80) || fallbackName,
    cuisine: out.cuisine.trim().slice(0, 30) || undefined,
    meals: out.meals.filter((m) => MEALS.includes(m)),
    servings: 2,
    ingredients,
  };
}
