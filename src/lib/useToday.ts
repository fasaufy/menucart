"use client";

import { useSyncExternalStore } from "react";
import { toISODate, type ISODate } from "./week";

function subscribe(onChange: () => void) {
  // Re-check when the app comes back to the foreground (e.g. past midnight).
  document.addEventListener("visibilitychange", onChange);
  window.addEventListener("focus", onChange);
  return () => {
    document.removeEventListener("visibilitychange", onChange);
    window.removeEventListener("focus", onChange);
  };
}

/**
 * Today's local date, or null while prerendering. Reading the clock during
 * prerender is not allowed with Cache Components, so callers render a
 * date-free shell until this resolves on the client.
 */
export function useToday(): ISODate | null {
  return useSyncExternalStore(
    subscribe,
    () => toISODate(new Date()),
    () => null,
  );
}
