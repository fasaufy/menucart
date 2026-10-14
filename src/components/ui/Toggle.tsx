type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  labelledBy: string;
  describedBy?: string;
};

/** On/off switch (role="switch"), 44px tap target. */
export function Toggle({ checked, onChange, labelledBy, describedBy }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onClick={() => onChange(!checked)}
      className="grid min-h-tap shrink-0 place-items-center"
    >
      <span
        className={`flex h-8 w-13 items-center rounded-pill p-1 transition-colors ${checked ? "bg-text" : "bg-border-strong"}`}
      >
        <span
          className={`size-6 rounded-pill bg-surface shadow-sm transition-transform ${checked ? "translate-x-5" : ""}`}
        />
      </span>
    </button>
  );
}
