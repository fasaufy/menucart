"use client";

import { useSettings } from "@/lib/hooks";
import { getStrings } from "@/lib/strings";
import { useOnline } from "@/lib/useOnline";

/** Offline = a slim banner, never a modal (CLAUDE.md). Everything keeps working. */
export function OfflineBanner() {
  const online = useOnline();
  const t = getStrings(useSettings()?.language);
  if (online) return null;
  return (
    <p role="status" className="bg-text px-5 py-1.5 text-center text-xs font-medium text-surface">
      {t.offline.banner}
    </p>
  );
}
