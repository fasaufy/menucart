import { createSerwistRoute } from "@serwist/turbopack";
import { PRECACHE_ROUTES } from "@/lib/precache-routes";

// A fresh revision per build makes the service worker pick up new HTML after an update.
const revision = crypto.randomUUID();

export const { generateStaticParams, GET } = createSerwistRoute({
  additionalPrecacheEntries: PRECACHE_ROUTES.map((url) => ({ url, revision })),
  swSrc: "src/sw.ts",
  useNativeEsbuild: true,
});
