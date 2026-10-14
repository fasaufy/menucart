import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { expect, it } from "vitest";
import { PRECACHE_ROUTES } from "./precache-routes";

function pages(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? pages(join(dir, e.name)) : e.name === "page.tsx" ? [join(dir, e.name)] : [],
  );
}

it("precaches every page so it opens offline", () => {
  const appDir = join(__dirname, "..", "app");
  const routes = pages(appDir).map((file) => {
    const segments = relative(appDir, file).split(sep).slice(0, -1);
    // Route groups like (app) don't appear in the URL.
    return "/" + segments.filter((s) => !s.startsWith("(")).join("/");
  });
  expect([...routes].sort()).toEqual([...PRECACHE_ROUTES].sort());
});
