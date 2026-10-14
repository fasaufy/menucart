type StepperProps = {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  decreaseLabel: string;
  increaseLabel: string;
  labelledBy: string;
};

export function Stepper({ value, min, max, onChange, decreaseLabel, increaseLabel, labelledBy }: StepperProps) {
  const button = "grid size-12 place-items-center rounded-row border border-border-strong bg-surface text-xl disabled:opacity-40";
  return (
    <div role="group" aria-labelledby={labelledBy} className="flex items-center gap-3">
      <button type="button" aria-label={decreaseLabel} disabled={value <= min} onClick={() => onChange(value - 1)} className={button}>
        −
      </button>
      <output aria-live="polite" className="w-8 text-center text-xl font-semibold tabular-nums">
        {value}
      </output>
      <button type="button" aria-label={increaseLabel} disabled={value >= max} onClick={() => onChange(value + 1)} className={button}>
        +
      </button>
    </div>
  );
}
