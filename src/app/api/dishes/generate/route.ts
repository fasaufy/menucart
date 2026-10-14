import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { AI_MODEL, AiUnavailableError, generateDish, nameKeyOf, type GeneratedDish } from "@/server/ai";
import { currentUserId } from "@/server/auth";
import { getDb, schema } from "@/server/db";

const { dishLibrary, aiUsage } = schema;

// Daily caps on *new* generations (cache hits are free). Overridable per deploy.
const LIMITS = {
  user: Number(process.env.AI_DAILY_LIMIT_USER ?? 40),
  guest: Number(process.env.AI_DAILY_LIMIT_GUEST ?? 10),
  global: Number(process.env.AI_DAILY_LIMIT_GLOBAL ?? 300),
};

export type GenerateResponse =
  | { status: "ok"; dish: GeneratedDish; cached: boolean }
  | { status: "unrecognized" }
  /** Try again later: offline, rate-limited, daily cap or a temporary error. */
  | { status: "retry"; reason: string }
  /** Generation isn't configured on this deploy. */
  | { status: "off" };

/** Counts one generation against a bucket for today; returns the new count. */
async function bump(db: ReturnType<typeof getDb>, bucket: string) {
  const [row] = await db
    .insert(aiUsage)
    .values({ bucket, day: sql`current_date`, count: 1 })
    .onConflictDoUpdate({ target: [aiUsage.bucket, aiUsage.day], set: { count: sql`${aiUsage.count} + 1` } })
    .returning({ count: aiUsage.count });
  return row.count;
}

function guestBucket(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  // Hash so the table never stores raw IP addresses.
  return `guest:${createHash("sha256").update(`menucart:${ip}`).digest("hex").slice(0, 24)}`;
}

const json = (body: GenerateResponse, status = 200) => NextResponse.json(body, { status });

/** Ingredients for a dish the library doesn't know: shared cache first, then Claude. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { name?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
  const nameKey = nameKeyOf(name);
  if (!name || name.length > 80 || !nameKey) return NextResponse.json({ error: "name is required (max 80 characters)" }, { status: 400 });

  const db = getDb();
  const [hit] = await db.select().from(dishLibrary).where(eq(dishLibrary.nameKey, nameKey)).limit(1);
  if (hit) {
    await db.update(dishLibrary).set({ hits: sql`${dishLibrary.hits} + 1` }).where(eq(dishLibrary.nameKey, nameKey));
    return hit.recognized ? json({ status: "ok", dish: hit.dish as GeneratedDish, cached: true }) : json({ status: "unrecognized" });
  }

  if (!process.env.ANTHROPIC_API_KEY) return json({ status: "off" }, 503);

  const userId = await currentUserId();
  const bucket = userId ? `user:${userId}` : guestBucket(request);
  const [mine, everyone] = await Promise.all([bump(db, bucket), bump(db, "global")]);
  if (mine > (userId ? LIMITS.user : LIMITS.guest) || everyone > LIMITS.global) {
    return json({ status: "retry", reason: "daily limit" }, 429);
  }

  try {
    const dish = await generateDish(name);
    await db
      .insert(dishLibrary)
      .values({ nameKey, dish, recognized: dish.recognized, model: AI_MODEL })
      .onConflictDoNothing();
    return dish.recognized ? json({ status: "ok", dish, cached: false }) : json({ status: "unrecognized" });
  } catch (error) {
    if (error instanceof AiUnavailableError) return json({ status: "off" }, 503);
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("Anthropic key rejected", error.status);
      return json({ status: "off" }, 503);
    }
    if (error instanceof Anthropic.RateLimitError) return json({ status: "retry", reason: "busy" }, 503);
    if (error instanceof Anthropic.APIError) {
      console.error("Anthropic API error", error.status, error.message);
      return json({ status: "retry", reason: "ai error" }, 502);
    }
    if (error instanceof SyntaxError) {
      console.error("AI output wasn't valid JSON", error.message);
      return json({ status: "retry", reason: "bad output" }, 502);
    }
    throw error;
  }
}
