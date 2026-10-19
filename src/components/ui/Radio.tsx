/** Native radio, restyled: grey ring, blue ring with a white centre when chosen. */
export const radioClasses =
  "size-5 shrink-0 appearance-none rounded-pill border-[1.5px] border-border-strong bg-surface transition-[border] checked:border-[6px] checked:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** A choice row (swap options, can't-find alternatives): blue edge when chosen. */
export function radioCardClasses(selected: boolean) {
  return `flex min-h-tap cursor-pointer items-start gap-3 rounded-card border bg-surface px-3.5 py-3 ${
    selected ? "border-accent" : "border-transparent shadow-float"
  }`;
}
