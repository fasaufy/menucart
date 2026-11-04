"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
import { useEffect, type ReactNode } from "react";

/**
 * Registers the service worker in production builds. Off in development so
 * the dev server never serves stale cached files.
 */
export function OfflineSupport({ children }: { children: ReactNode }) {
  useReloadOnUpdate();
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

/**
 * The worker takes over as soon as a new version installs, but an open app
 * keeps running the old screens until it's restarted (an installed app rarely
 * is). Reload once when that happens; everything is saved on the phone first.
 * Not on the very first install, when there was no older version.
 */
function useReloadOnUpdate() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development" || !("serviceWorker" in navigator)) return;
    const hadOlder = !!navigator.serviceWorker.controller;
    let reloaded = false;
    const onChange = () => {
      if (!hadOlder || reloaded) return;
      reloaded = true;
      location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onChange);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", onChange);
  }, []);
}
