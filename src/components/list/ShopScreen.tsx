"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeftIcon } from "@/components/icons";
import { buttonClasses } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { useActiveList } from "@/lib/hooks";
import { setItemState } from "@/lib/list/actions";
import { getStrings, type Strings } from "@/lib/strings";
import type { Language, ListItem } from "@/lib/types";
import { amountLines, groupBySection, itemNames } from "./format";

export function ShopScreen() {
  const list = useActiveList();
  const language = list?.settings.language ?? "en";
  const t = getStrings(language);
  const [basketOpen, setBasketOpen] = useState(false);
  useRestoreScroll(list ? `menucart:shop-scroll:${list.weekId}` : null);

  const items = list?.items ?? [];
  const toBuy = items.filter((i) => i.state === "to_buy");
  const bought = items.filter((i) => i.state === "bought");
  const total = toBuy.length + bought.filter((i) => !i.noLongerNeeded).length;
  const done = total - toBuy.length;
  const rowProps = { t, language, halalMode: list?.settings.halalMode ?? true };

  return (
    <>
      <header className="sticky top-0 z-10 flex flex-col gap-2 bg-bg px-5 pt-10 pb-3">
        <div className="flex items-center justify-between">
          <Link
            href="/list"
            className="-ml-2 flex min-h-tap items-center gap-0.5 pr-2 text-sm text-text-muted"
          >
            <ChevronLeftIcon size={16} />
            {t.shop.done}
          </Link>
          <span className="text-xs text-text-muted">{t.shop.worksOffline}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold">{t.shop.title}</h1>
          {total > 0 && (
            <span className="text-body font-semibold tabular-nums">{t.shop.progress(done, total)}</span>
          )}
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-label={t.shop.progress(done, total)}
          className="h-2 rounded-pill bg-track"
        >
          <div
            className="h-2 rounded-pill bg-text"
            style={{ width: total ? `${(done / total) * 100}%` : 0 }}
          />
        </div>
      </header>

      {list === null && (
        <div className="flex flex-col gap-3 px-5 pt-2">
          <EmptyState title={t.shop.emptyTitle} hint={t.shop.emptyHint} />
          <Link href="/plan" className={buttonClasses("secondary")}>
            {t.list.goPlan}
          </Link>
        </div>
      )}

      {list && (
        <div className="flex flex-col gap-3 px-5 pt-1 pb-8">
          {toBuy.length === 0 && bought.length > 0 && (
            <p role="status" className="py-4 text-center text-body font-semibold">
              {t.shop.allDone}
            </p>
          )}

          {groupBySection(toBuy, language).map(({ section, items }) => (
            <section key={section} className="flex flex-col gap-2">
              <h2 className="pt-1 text-xs font-semibold tracking-wide text-text-muted uppercase">
                {t.sections[section]}
              </h2>
              <ul className="flex flex-col gap-2">
                {items.map((item) => (
                  <ShopRow key={item.key} item={item} weekId={list.weekId} {...rowProps} />
                ))}
              </ul>
            </section>
          ))}

          {bought.length > 0 && (
            <section className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                aria-expanded={basketOpen}
                onClick={() => setBasketOpen((o) => !o)}
                className="flex min-h-tap flex-col items-start gap-1.5 text-left"
              >
                <span className="text-xs font-semibold tracking-wide text-text-muted uppercase">
                  {t.shop.inBasket(bought.length)}
                </span>
                {!basketOpen && (
                  <span className="line-clamp-2 w-full rounded-row bg-fill-muted px-3.5 py-2.5 text-sm text-text-muted line-through">
                    {bought.map((i) => itemNames(i, language).primary).join(" · ")}
                  </span>
                )}
              </button>
              {basketOpen && (
                <ul className="flex flex-col gap-2">
                  {bought.map((item) => (
                    <ShopRow key={item.key} item={item} weekId={list.weekId} {...rowProps} />
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}
    </>
  );
}

function ShopRow({
  item,
  weekId,
  t,
  language,
  halalMode,
}: {
  item: ListItem;
  weekId: string;
  t: Strings;
  language: Language;
  halalMode: boolean;
}) {
  const bought = item.state === "bought";
  const { primary, secondary } = itemNames(item, language);
  const detail = [
    amountLines(item, t, language).join(" + "),
    halalMode && item.halal === "check" ? t.shop.checkHalal : null,
    item.swappedFrom ? `${t.swap.tag} ${t.swap.forOriginal(item.swappedFrom)}` : null,
    item.noLongerNeeded ? t.list.noLongerNeeded : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li>
      <label
        className={`flex min-h-16 items-center gap-3.5 rounded-card border border-border bg-surface px-4 py-3 ${bought ? "text-text-muted" : ""}`}
      >
        <Checkbox
          size="lg"
          checked={bought}
          onChange={(e) => setItemState(weekId, item.key, e.target.checked ? "bought" : "to_buy")}
        />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className={`text-lg leading-snug font-medium ${bought ? "line-through" : ""}`}>
            {primary}
            {secondary && (
              <span className="text-sm font-normal text-text-muted"> · {secondary}</span>
            )}
          </span>
          <span className="text-sm text-text-muted">{detail}</span>
        </span>
      </label>
    </li>
  );
}

/** Reopen at the same scroll position after the app is killed mid-shop. */
function useRestoreScroll(storageKey: string | null) {
  const restored = useRef(false);

  useEffect(() => {
    if (!storageKey) return;
    if (!restored.current) {
      restored.current = true;
      try {
        const y = Number(localStorage.getItem(storageKey));
        if (y > 0) requestAnimationFrame(() => window.scrollTo(0, y));
      } catch {
        // Storage can be unavailable (private mode); scroll restore is a nicety.
      }
    }
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        try {
          localStorage.setItem(storageKey, String(Math.round(window.scrollY)));
        } catch {}
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [storageKey]);
}
