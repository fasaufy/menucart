"use client";

import { useSyncExternalStore } from "react";

let firstRead = 0;
const noop = () => () => {};

/**
 * A timestamp taken once on the client (0 while prerendering, where reading
 * the clock isn't allowed with Cache Components). Stable for the session.
 */
export function useMountTime(): number {
  return useSyncExternalStore(
    noop,
    () => (firstRead ||= Date.now()),
    () => 0,
  );
}
