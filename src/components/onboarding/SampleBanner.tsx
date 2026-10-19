"use client";

import { Button } from "@/components/ui/Button";
import { clearSample, keepSample } from "@/lib/onboarding";
import type { Strings } from "@/lib/strings";

/** Guest first run: keep or clear the sample week in one tap. */
export function SampleBanner({ weekId, t }: { weekId: string; t: Strings }) {
  return (
    <div
      role="region"
      aria-label={t.sample.title}
      className="flex flex-col gap-1 rounded-sheet bg-sample p-1"
    >
      <div className="flex flex-col gap-0.5 p-4">
        <p className="font-display text-base leading-tight font-semibold">{t.sample.title}</p>
        <p className="text-meta text-text-muted">{t.sample.hint}</p>
      </div>
      <div className="flex gap-2 px-2 pb-2">
        <Button variant="secondary" className="flex-1" onClick={() => keepSample(weekId)}>
          {t.sample.keep}
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => clearSample(weekId)}>
          {t.sample.clear}
        </Button>
      </div>
    </div>
  );
}
