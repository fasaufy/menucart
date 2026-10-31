import type { ReactNode } from "react";
import { formatRupiah } from "@/lib/money";
import { Checkbox } from "./Checkbox";

export type ItemRowRight = "price" | "priceUnit" | "addPrice" | "atHome";

type Props = {
  name: string;
  /** One line under the name: "± 50 g", "400 g needed", "At home". */
  detail?: string;
  detailTone?: "default" | "warning";
  /**
   * What sits on the right (Figma "Item row", design-update-v2 §4.1). atHome
   * shows the amount only: for lines at home, and for lines with no price yet.
   */
  right: ItemRowRight;
  /** Rupiah, for price and priceUnit. */
  price?: number;
  /** Shown with "≈": a MenuCart or Bapanas estimate rather than a paid price. */
  estimated?: boolean;
  /** The unit pill under the price ("2 ikat"), or the amount for atHome ("4 siung"). */
  unit?: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: (checked: boolean) => void;
  /** For addPrice: the link that opens Edit a price. */
  addPrice?: { label: string; onClick: () => void };
  /** Badges under the text: halal status, swap tag. */
  extra?: ReactNode;
  /** Shopping mode: bigger text for one-handed use in the shop. */
  size?: "md" | "lg";
  /** Bought: the name is struck through. */
  done?: boolean;
};

/**
 * Every list line (pantry, By menu, By aisle, shopping): checkbox, name and
 * detail, and the money on the right. The checkbox and text toggle together;
 * "Add price" is its own button.
 */
export function ItemRow({
  name,
  detail,
  detailTone = "default",
  right,
  price,
  estimated,
  unit,
  checked,
  disabled,
  onToggle,
  addPrice,
  extra,
  size = "md",
  done,
}: Props) {
  const lg = size === "lg";
  const money =
    right === "atHome" ? (
      unit && <span className="text-sm text-text-muted tabular-nums">{unit}</span>
    ) : right === "addPrice" ? null : (
      price !== undefined && (
        <span className="flex flex-col items-end gap-1">
          <span className={`${lg ? "text-base" : "text-sm"} leading-tight font-semibold tabular-nums`}>
            {formatRupiah(price, { estimated })}
          </span>
          {right === "priceUnit" && unit && (
            <span className="rounded-pill bg-border px-1.5 py-px text-[0.625rem] leading-[1.4] font-semibold text-text-quiet tabular-nums">
              {unit}
            </span>
          )}
        </span>
      )
    );

  return (
    <div className="flex items-center gap-3">
      <label
        className={`flex min-w-0 flex-1 cursor-pointer items-center gap-3 ${lg ? "min-h-16 py-2.5" : detail || extra ? "min-h-[3.375rem] py-2" : "min-h-tap py-2"}`}
      >
        <Checkbox checked={checked} disabled={disabled} onChange={(e) => onToggle(e.target.checked)} />
        <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
          <span
            className={`${lg ? "text-lg leading-[1.3]" : "text-body leading-[1.3]"} font-medium [overflow-wrap:anywhere] ${done ? "line-through" : ""}`}
          >
            {name}
          </span>
          {detail && (
            <span
              className={`${lg ? "text-sm" : "text-xs"} leading-[1.3] ${detailTone === "warning" ? "text-halal-flag-text" : "text-text-muted"}`}
            >
              {detail}
            </span>
          )}
          {extra}
        </span>
        {money && <span className="shrink-0">{money}</span>}
      </label>
      {right === "addPrice" && addPrice && (
        <button
          type="button"
          onClick={addPrice.onClick}
          className="flex min-h-tap shrink-0 items-center text-sm font-semibold text-accent"
        >
          {addPrice.label}
        </button>
      )}
    </div>
  );
}
