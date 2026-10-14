import type { Strings } from "@/lib/strings";

/** "[HALAL SWAP] for Guanciale" on list lines produced by a swap. */
export function SwapTag({ from, t, extra }: { from: string; t: Strings; extra?: string }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
      <span className="rounded-pill border border-text px-1.5 py-px text-[0.6875rem] font-semibold tracking-wide text-text uppercase">
        {t.swap.tag}
      </span>
      {t.swap.forOriginal(from)}
      {extra && ` · ${extra}`}
    </span>
  );
}
