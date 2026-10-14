import { readFileSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// drizzle-kit runs outside Next, so read DATABASE_URL from .env.local here.
function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const line = readFileSync(".env.local", "utf8")
    .split("\n")
    .find((l) => l.startsWith("DATABASE_URL="));
  if (!line) throw new Error("DATABASE_URL is not set (.env.local)");
  return line.slice("DATABASE_URL=".length).trim();
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: databaseUrl() },
});
