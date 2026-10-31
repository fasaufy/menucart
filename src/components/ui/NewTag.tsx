/** "New" next to lines, groups and dishes that came with the last plan change (L6). */
export function NewTag({ label }: { label: string }) {
  return (
    <span className="rounded-pill bg-halal-flag-bg px-2 py-px text-[0.6875rem] leading-[1.4] font-semibold text-halal-flag-text">
      {label}
    </span>
  );
}
