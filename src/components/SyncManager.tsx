"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { onLocalChange, syncNow } from "@/lib/sync/engine";

const DEBOUNCE_MS = 2500;
const INTERVAL_MS = 60_000;

/**
 * Background sync for signed-in users: on sign-in, when the signal comes
 * back, when the app returns to the foreground, shortly after local edits,
 * and once a minute. Never blocks the UI. Mounted only when Clerk is set up.
 */
export function SyncManager() {
  const { isSignedIn, userId } = useAuth();

  useEffect(() => {
    if (!isSignedIn || !userId) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sync = () => void syncNow(userId);
    const soon = () => {
      clearTimeout(timer);
      timer = setTimeout(sync, DEBOUNCE_MS);
    };
    const onVisible = () => document.visibilityState === "visible" && sync();

    sync();
    const stopListening = onLocalChange(soon);
    const interval = setInterval(sync, INTERVAL_MS);
    window.addEventListener("online", sync);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      stopListening();
      window.removeEventListener("online", sync);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isSignedIn, userId]);

  return null;
}
