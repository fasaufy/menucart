import { MinusCircleIcon, PlusCircleIcon } from "@/components/icons";

type StepperProps = {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  decreaseLabel: string;
  increaseLabel: string;
  labelledBy: string;
};

const button =
  "grid size-tap place-items-center rounded-pill bg-surface text-accent shadow-float disabled:text-border-strong";

/** − value + across a white card. */
export function Stepper({ value, min, max, onChange, decreaseLabel, increaseLabel, labelledBy }: StepperProps) {
  return (
    <div role="group" aria-labelledby={labelledBy} className="flex items-center justify-between">
      <button type="button" aria-label={decreaseLabel} disabled={value <= min} onClick={() => onChange(value - 1)} className={button}>
        <MinusCircleIcon />
      </button>
      <output aria-live="polite" className="font-display text-xl font-semibold tabular-nums">
        {value}
      </output>
      <button type="button" aria-label={increaseLabel} disabled={value >= max} onClick={() => onChange(value + 1)} className={button}>
        <PlusCircleIcon />
      </button>
    </div>
  );
}
