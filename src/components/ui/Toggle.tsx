type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  labelledBy: string;
  describedBy?: string;
};

/** On/off switch (role="switch"), 44px tap target around a 52×32 track. */
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
        className={`flex h-8 w-13 items-center rounded-pill p-[3px] transition-colors ${checked ? "bg-accent" : "bg-border-strong"}`}
      >
        <span
          className={`size-[26px] rounded-pill bg-surface shadow-button transition-transform ${checked ? "translate-x-5" : ""}`}
        />
      </span>
    </button>
  );
}
