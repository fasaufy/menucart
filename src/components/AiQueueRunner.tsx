"use client";

import { useEffect } from "react";
import { processAiQueue } from "@/lib/ai";
import { onLocalChange } from "@/lib/db";

/** Fills in ingredients for new dishes when online: on launch, reconnect, foreground, after edits, and every 30 s. */
export function AiQueueRunner() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const run = () => void processAiQueue();
    const soon = () => {
      clearTimeout(timer);
      timer = setTimeout(run, 800);
    };
    const onVisible = () => document.visibilityState === "visible" && run();
    run();
    const stop = onLocalChange(soon);
    const interval = setInterval(run, 30_000);
    window.addEventListener("online", run);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      stop();
      window.removeEventListener("online", run);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return null;
}
