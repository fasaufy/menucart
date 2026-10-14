"use client";

import type { GenerateResponse } from "@/app/api/dishes/generate/route";
import { db } from "./db";
import { saveDish } from "./dishes/edit";

// Queue for AI ingredient generation (step 7). Dishes the library doesn't
// know are saved with aiStatus "pending" and filled in whenever there's a
// connection: offline additions get their ingredients once back online.

async function requestIngredients(name: string): Promise<GenerateResponse> {
  try {
    const res = await fetch("/api/dishes/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.status === 400) return { status: "unrecognized" };
    return (await res.json()) as GenerateResponse;
  } catch {
    return { status: "retry", reason: "network" };
  }
}

let running: Promise<void> | null = null;

/** Works through pending dishes one at a time. Safe to call often. */
export function processAiQueue(): Promise<void> {
  running ??= run().finally(() => {
    running = null;
  });
  return running;
}

async function run() {
  const pending = await db.dishes.filter((d) => d.aiStatus === "pending").toArray();
  for (const dish of pending) {
    if (!navigator.onLine) return;
    const result = await requestIngredients(dish.name);
    if (result.status === "retry") return; // try again later (offline, busy or daily limit)
    await saveDish(dish, (current) => {
      if (result.status === "ok") {
        // The user may have typed ingredients in the meantime: theirs win.
        if (current.ingredients.length) return { aiStatus: undefined };
        const { ingredients, cuisine, meals, servings } = result.dish;
        return { source: "ai", ingredients, cuisine, meals, servings, aiStatus: undefined };
      }
      return { aiStatus: result.status === "unrecognized" ? "unrecognized" : "off" };
    });
  }
}
