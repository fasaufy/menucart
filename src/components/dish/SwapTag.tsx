import { HalalBadge } from "@/components/ui/HalalBadge";
import type { Strings } from "@/lib/strings";

/** "[✓ Halal swap] for Guanciale" on list lines produced by a swap. */
export function SwapTag({ from, t, extra }: { from: string; t: Strings; extra?: string }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
      <HalalBadge status="halal" label={t.swap.tag} />
      {t.swap.forOriginal(from)}
      {extra && ` · ${extra}`}
    </span>
  );
}
