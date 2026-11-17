"use client";

import { db } from "@/lib/db";
import { useMeta, useSettings } from "@/lib/hooks";
import { getStrings } from "@/lib/strings";

/** Shown once on first open: during the trial we record how the app is used. In the page flow, never over it. */
export function TrialNote() {
  const seen = useMeta("trialNote");
  const t = getStrings(useSettings()?.language);
  // undefined while loading: show nothing rather than flash it.
  if (seen !== null) return null;
  return (
    <div role="status" className="mx-5 mt-3 flex items-center gap-3 rounded-card bg-notice px-4 py-3 shadow-float">
      <p className="min-w-0 flex-1 text-meta">{t.trial.note}</p>
      <button
        type="button"
        onClick={() => void db.meta.put({ id: "trialNote", at: Date.now() })}
        className="min-h-11 shrink-0 rounded-pill bg-surface px-4 text-sm font-semibold shadow-button"
      >
        {t.trial.ok}
      </button>
    </div>
  );
}
