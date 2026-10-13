import { AlertIcon, CheckIcon, InfoIcon } from "@/components/icons";
import { getStrings } from "@/lib/strings";
import type { HalalStatus } from "@/lib/types";

// Halal status is always icon + text, never colour alone.

const styles: Record<HalalStatus, string> = {
  halal: "bg-fill-muted text-text",
  non_halal: "bg-halal-flag-bg text-halal-flag-text",
  check: "border border-border-strong bg-surface text-text",
};

const icons = { halal: CheckIcon, non_halal: AlertIcon, check: InfoIcon };

type HalalBadgeProps = {
  status: HalalStatus;
  /** Extra text after the status, e.g. "1 swap". */
  detail?: string;
};

export function HalalBadge({ status, detail }: HalalBadgeProps) {
  const Icon = icons[status];
  const label = getStrings().halal[status];

  return (
    <span
      className={`inline-flex items-center gap-1 self-start rounded-pill px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      <Icon size={12} strokeWidth={2.2} />
      {detail ? `${label} · ${detail}` : label}
    </span>
  );
}
