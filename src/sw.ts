/// <reference lib="esnext" />
/// <reference lib="webworker" />
// Service worker (step 5). Bundled by Serwist via src/app/serwist/[path]/route.ts.
// Excluded from the app's tsconfig because the webworker lib clashes with the DOM lib.
import { defaultCache } from "@serwist/turbopack/worker";
import { Serwist, type PrecacheEntry, type SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  // Every page and its JS/CSS, so the app opens with no signal at all.
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    // A page we didn't precache (unknown URL) while offline: show the planner.
    entries: [{ url: "/plan", matcher: ({ request }) => request.destination === "document" }],
  },
});

serwist.addEventListeners();
