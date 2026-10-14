"use client";

import { clearSample, keepSample } from "@/lib/onboarding";
import type { Strings } from "@/lib/strings";

/** Guest first run: keep or clear the sample week in one tap. */
export function SampleBanner({ weekId, t }: { weekId: string; t: Strings }) {
  return (
    <div role="region" aria-label={t.sample.title} className="flex flex-col gap-2 rounded-card bg-fill-muted p-3.5">
      <p className="text-body font-semibold">{t.sample.title}</p>
      <p className="text-sm text-text-muted">{t.sample.hint}</p>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => keepSample(weekId)}
          className="min-h-tap flex-1 rounded-row bg-text text-sm font-semibold text-surface"
        >
          {t.sample.keep}
        </button>
        <button
          type="button"
          onClick={() => clearSample(weekId)}
          className="min-h-tap flex-1 rounded-row border border-border-strong bg-surface text-sm font-semibold"
        >
          {t.sample.clear}
        </button>
      </div>
    </div>
  );
}
