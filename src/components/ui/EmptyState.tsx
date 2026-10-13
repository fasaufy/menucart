type EmptyStateProps = { title: string; hint: string };

export function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-border-strong px-6 py-10 text-center">
      <p className="text-body font-semibold">{title}</p>
      <p className="text-meta text-text-muted">{hint}</p>
    </div>
  );
}
