import { EmptyState } from "@/components/ui/EmptyState";
import { getStrings } from "@/lib/strings";

// Placeholder. The real planner (Dexie-backed day list) arrives in step 2.
export default function PlanPage() {
  const t = getStrings().plan;
  const planned = 0;
  const total = 21;

  return (
    <>
      <header className="flex flex-col gap-3 px-5 pt-12 pb-3">
        <h1 className="text-center text-xl font-semibold">{t.title}</h1>
        <div className="flex flex-col gap-1.5">
          <p className="text-meta text-text-muted">
            {t.progress(planned, total)}
          </p>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={planned}
            className="h-1.5 rounded-pill bg-track"
          >
            <div
              className="h-1.5 rounded-pill bg-text"
              style={{ width: `${(planned / total) * 100}%` }}
            />
          </div>
        </div>
      </header>
      <div className="px-5 pt-1 pb-6">
        <EmptyState title={t.emptyPrompt} hint={t.emptyHint} />
      </div>
    </>
  );
}
