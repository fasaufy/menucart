import { EmptyState } from "@/components/ui/EmptyState";
import { getStrings } from "@/lib/strings";

// Placeholder. Offline shopping mode arrives in step 3.
export default function ShopPage() {
  const t = getStrings().shop;

  return (
    <>
      <header className="px-5 pt-12 pb-3">
        <h1 className="text-xl font-semibold">{t.title}</h1>
      </header>
      <div className="px-5 pt-1 pb-6">
        <EmptyState title={t.emptyTitle} hint={t.emptyHint} />
      </div>
    </>
  );
}
