"use client";

import { useEffect } from "react";
import { captureTesterCode, flushEvents } from "@/lib/events/track";

/**
 * Tester week: keeps the invite link's code (?t=…) on the device, then takes it
 * out of the address bar; sends queued events on open, when back online and
 * when the app goes to the background.
 */
export function EventsRunner() {
  useEffect(() => {
    void captureTesterCode(location.search).then((had) => {
      if (!had) return;
      const url = new URL(location.href);
      url.searchParams.delete("t");
      history.replaceState(history.state, "", url.pathname + url.search + url.hash);
    });
    void flushEvents();
    const flush = () => void flushEvents();
    const hidden = () => document.visibilityState === "hidden" && flush();
    window.addEventListener("online", flush);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("online", flush);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, []);
  return null;
}
