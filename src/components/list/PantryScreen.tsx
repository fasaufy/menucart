"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons";
import { buttonClasses } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { useActiveList } from "@/lib/hooks";
import { setItemState } from "@/lib/list/actions";
import { STAPLE_KEYS } from "@/lib/list/merge";
import { getStrings, type Strings } from "@/lib/strings";
import type { Language, ListItem } from "@/lib/types";
import { amountLines, groupBySection, itemNames } from "./format";

export function PantryScreen() {
  const router = useRouter();
  const list = useActiveList();
  const language = list?.settings.language ?? "en";
  const t = getStrings(language);

  // Bought items are past the pantry question.
  const items = (list?.items ?? []).filter(
    (i) => (i.state === "to_buy" || i.state === "at_home") && !i.noLongerNeeded,
  );
  const staples = items.filter((i) => STAPLE_KEYS.has(i.key));
  const others = groupBySection(
    items.filter((i) => !STAPLE_KEYS.has(i.key)),
    language,
  ).flatMap((g) => g.items);
  const toBuy = items.filter((i) => i.state === "to_buy").length;

  return (
    <>
      <header className="flex flex-col gap-2 px-5 pt-10 pb-4">
        <button
          type="button"
          onClick={() => (history.length > 1 ? router.back() : router.push("/list"))}
          className="-ml-2 flex min-h-tap items-center gap-0.5 self-start pr-2 text-sm text-text-muted"
        >
          <ChevronLeftIcon size={16} />
          {t.pantry.back}
        </button>
        <h1 className="text-2xl leading-tight font-semibold">{t.pantry.title}</h1>
        <p className="text-sm text-text-muted">{t.pantry.hint}</p>
      </header>

      {list && (
        <div className="flex flex-col gap-5 px-5 pb-6">
          {staples.length > 0 && (
            <PantryGroup title={t.pantry.staples} items={staples} weekId={list.weekId} t={t} language={language} />
          )}
          {others.length > 0 && (
            <PantryGroup
              title={t.pantry.fromDishes(list.dishCount)}
              items={others}
              weekId={list.weekId}
              t={t}
              language={language}
            />
          )}
        </div>
      )}

      <div className="sticky bottom-0 mt-auto flex flex-col gap-1 border-t border-divider bg-bg px-5 pt-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <Link href="/list" className={buttonClasses()}>
          {t.pantry.showList(toBuy)}
        </Link>
        <Link href="/list" className="flex min-h-tap items-center justify-center text-sm text-text-muted">
          {t.pantry.skip}
        </Link>
      </div>
    </>
  );
}

function PantryGroup({
  title,
  items,
  weekId,
  t,
  language,
}: {
  title: string;
  items: ListItem[];
  weekId: string;
  t: Strings;
  language: Language;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold tracking-wide text-text-muted uppercase">{title}</h2>
      <ul className="flex flex-col divide-y divide-fill-muted rounded-card border border-border bg-surface">
        {items.map((item) => (
          <li key={item.key}>
            <label className="flex min-h-tap items-center gap-3 px-3.5 py-3.5">
              <Checkbox
                checked={item.state === "at_home"}
                onChange={(e) =>
                  setItemState(weekId, item.key, e.target.checked ? "at_home" : "to_buy")
                }
              />
              <span className="min-w-0 flex-1 text-body">{itemNames(item, language).primary}</span>
              <span className="shrink-0 text-meta text-text-muted tabular-nums">
                {amountLines(item, t, language).join(" + ")}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
