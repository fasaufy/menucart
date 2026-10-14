// Every screen is statically prerendered, so all of them are precached by
// the service worker and open offline from the first launch.
// precache-routes.test.ts fails if a page is added without listing it here.
export const PRECACHE_ROUTES = [
  "/",
  "/plan",
  "/list",
  "/shop",
  "/pantry",
  "/review",
  "/onboarding",
  "/settings",
  "/sign-in",
  "/sign-in/verify",
  "/sign-in/link",
  "/sign-in/expired",
  "/terms",
  "/privacy",
];
