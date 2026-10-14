"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
import type { ReactNode } from "react";

/**
 * Registers the service worker in production builds. Off in development so
 * the dev server never serves stale cached files.
 */
export function OfflineSupport({ children }: { children: ReactNode }) {
  return (
    <SerwistProvider
      swUrl="/serwist/sw.js"
      disable={process.env.NODE_ENV === "development"}
      // Don't reload the page when the signal comes back mid-shop.
      reloadOnOnline={false}
    >
      {children}
    </SerwistProvider>
  );
}
