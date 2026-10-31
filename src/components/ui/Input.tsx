/** Text field look shared by email, dish search and ingredient amounts. */
export const inputClasses =
  "h-button w-full rounded-card border border-border bg-surface px-3.5 text-base outline-none placeholder:text-text-muted/70 focus:border-accent focus:ring-1 focus:ring-accent aria-invalid:border-halal-flag-text";

/** Small uppercase heading above chip groups ("Quick picks"). */
export const overlineClasses = "text-xs leading-[1.35] font-semibold tracking-[0.04em] text-text-muted uppercase";

/** Pill chip: quick picks, budget shortcuts. A chosen one (aria-pressed) sits flat on a warm tint. */
export const chipClasses =
  "min-h-tap rounded-pill bg-surface px-3.5 text-sm leading-[1.4] shadow-float aria-pressed:bg-bg aria-pressed:font-semibold aria-pressed:shadow-none";

/** Bottom-sheet title. */
export const sheetTitleClasses = "text-xl leading-tight font-semibold";

/** Native <select> styled like the inputs; pair with a ChevronDownIcon overlay. */
export const selectClasses =
  "h-button w-full appearance-none rounded-card border border-border bg-surface pr-10 pl-3.5 text-body outline-none focus:border-accent focus:ring-1 focus:ring-accent";
