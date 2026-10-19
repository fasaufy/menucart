type SegmentedProps<T extends string> = {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
};

/** Two or more mutually exclusive choices on a sunken track ("By menu · By aisle"). */
export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex min-h-15 rounded-card bg-fill-muted p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`flex flex-1 items-center justify-center rounded-xl px-3 text-[0.9375rem] font-medium ${
              active ? "bg-surface text-text-strong shadow-button" : "text-text-quiet"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
