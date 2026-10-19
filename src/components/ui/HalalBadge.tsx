import { AlertIcon, CheckIcon, InfoIcon } from "@/components/icons";
import { getStrings } from "@/lib/strings";
import type { HalalStatus } from "@/lib/types";

// Halal status is always icon + text, never colour alone.

const styles: Record<HalalStatus, string> = {
  halal: "border-halal-ok-border bg-halal-ok-bg text-text",
  non_halal: "border-halal-flag-border bg-halal-flag-bg text-halal-flag-text",
  check: "border-halal-check-border bg-halal-check-bg text-halal-check-text",
};

const icons = { halal: CheckIcon, non_halal: AlertIcon, check: InfoIcon };

type HalalBadgeProps = {
  status: HalalStatus;
  /** Extra text after the status, e.g. "1 swap". */
  detail?: string;
  /** Replaces the status word, e.g. "Halal swap" or "Check for a halal logo". */
  label?: string;
};

export function HalalBadge({ status, detail, label }: HalalBadgeProps) {
  const Icon = icons[status];
  const text = label ?? getStrings().halal[status];

  return (
    <span
      className={`inline-flex items-center gap-1 self-start rounded-pill border px-2 py-0.5 text-xs leading-[1.35] font-medium ${styles[status]}`}
    >
      <Icon size={12} />
      {detail ? `${text} · ${detail}` : text}
    </span>
  );
}
