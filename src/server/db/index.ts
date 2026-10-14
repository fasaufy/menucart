import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Supabase transaction pooler: no prepared statements, and keep the pool tiny
// because every serverless instance opens its own.
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

function client() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  globalForDb.sql ??= postgres(url, { prepare: false, max: 3, idle_timeout: 20, connect_timeout: 10 });
  return globalForDb.sql;
}

export function getDb() {
  return drizzle(client(), { schema });
}

export { schema };
