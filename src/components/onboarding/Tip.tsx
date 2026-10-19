"use client";

import { useMeta } from "@/lib/hooks";
import { dismissTip, TIPS, type TipId } from "@/lib/onboarding";
import type { Strings } from "@/lib/strings";

/** One-time tip; once dismissed it never shows again on this device. */
export function Tip({ id, t }: { id: TipId; t: Strings }) {
  const seen = useMeta("tipsSeen");
  if (seen === undefined || seen?.ids.includes(id)) return null;
  return (
    <div role="note" className="flex items-center justify-between gap-3 rounded-xl bg-tip px-3.5 py-2.5 text-surface">
      <p className="text-sm">
        {t.tips.progress(TIPS.indexOf(id) + 1)} ·{" "}
        {t.tips[id]}
      </p>
      <button
        type="button"
        onClick={() => dismissTip(id)}
        className="min-h-tap shrink-0 px-1 text-sm font-semibold underline underline-offset-4"
      >
        {t.tips.gotIt}
      </button>
    </div>
  );
}
