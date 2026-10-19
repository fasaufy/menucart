"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SessionBanner } from "@/components/auth/SessionBanner";
import { BackButton } from "@/components/ui/BackButton";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, Group, GroupHeader } from "@/components/ui/Group";
import { useActiveList } from "@/lib/hooks";
import { setItemState } from "@/lib/list/actions";
import { getStrings, type Strings } from "@/lib/strings";
import type { Language, ListItem } from "@/lib/types";
import { CantFindSheet } from "./CantFindSheet";
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
  const skipped = items.filter((i) => i.state === "skipped");
  const [cantFind, setCantFind] = useState<string | null>(null);
  const total = toBuy.length + bought.filter((i) => !i.noLongerNeeded).length;
  const done = total - toBuy.length;
  const rowProps = { t, language, halalMode: list?.settings.halalMode ?? true };

  return (
    <>
      <SessionBanner t={t} />
      <header className="sticky top-0 z-10 flex flex-col gap-6 bg-[linear-gradient(to_top,#fdfefc,#fbfaf6_20%,var(--bg))] px-5 pt-6 pb-3">
        <div className="flex min-h-tap items-center justify-between">
          <BackButton href="/list" label={t.shop.done} />
          <span className="text-xs text-text-muted">{t.shop.worksOffline}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-group bg-surface/40 p-1 shadow-group">
          <div className="flex items-end justify-between p-2">
            <h1 className="font-display text-2xl leading-tight font-semibold">{t.shop.title}</h1>
            {total > 0 && (
              <span className="text-body leading-[1.4] font-medium tabular-nums">{t.shop.progress(done, total)}</span>
            )}
          </div>
          <div className="p-2">
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={done}
              aria-label={t.shop.progress(done, total)}
              className="h-1.5 overflow-hidden rounded-pill bg-[#d6d6d1]"
            >
              <div
                className="h-1.5 rounded-pill bg-[linear-gradient(to_right,var(--progress-from),var(--progress-to))] transition-[width]"
                style={{ width: total ? `${(done / total) * 100}%` : 0 }}
              />
            </div>
          </div>
        </div>
      </header>

      {list && (
        <CantFindSheet
          item={items.find((i) => i.key === cantFind) ?? null}
          weekId={list.weekId}
          t={t}
          language={language}
          onClose={() => setCantFind(null)}
        />
      )}

      {list === null && (
        <div className="flex flex-col gap-3 px-5 pt-2">
          <EmptyState title={t.shop.emptyTitle} hint={t.shop.emptyHint} />
          <Link href="/plan" className={buttonClasses("secondary")}>
            {t.list.goPlan}
          </Link>
        </div>
      )}

      {list && (
        <div className="flex flex-col gap-5 px-5 pt-3 pb-8">
          {toBuy.length === 0 && bought.length > 0 && (
            <p role="status" className="py-4 text-center text-body font-semibold">
              {t.shop.allDone}
            </p>
          )}

          {groupBySection(toBuy, language).map(({ section, items }) => (
            <Group key={section}>
              <GroupHeader>
                <h2 className="text-body font-medium">{t.sections[section]}</h2>
              </GroupHeader>
              <ul className="flex flex-col gap-1">
                {items.map((item) => (
                  <ShopRow
                    key={item.key}
                    item={item}
                    weekId={list.weekId}
                    onCantFind={() => setCantFind(item.key)}
                    {...rowProps}
                  />
                ))}
              </ul>
            </Group>
          ))}

          {skipped.length > 0 && (
            <Group>
              <GroupHeader>
                <h2 className="text-body font-medium">{t.cantFind.skipped(skipped.length)}</h2>
              </GroupHeader>
              <ul className="flex flex-col gap-1">
                {skipped.map((item) => (
                  <li key={item.key}>
                    <Card className="min-h-17 flex-row items-center justify-between gap-3">
                      <span className="text-lg leading-[1.3] font-medium">{itemNames(item, language).primary}</span>
                      <SmallButton onClick={() => setItemState(list.weekId, item.key, "to_buy")}>{t.cantFind.putBack}</SmallButton>
                    </Card>
                  </li>
                ))}
              </ul>
            </Group>
          )}

          {bought.length > 0 && (
            <Group>
              <button
                type="button"
                aria-expanded={basketOpen}
                onClick={() => setBasketOpen((o) => !o)}
                className="flex min-h-tap flex-col items-start gap-3 px-3.5 py-3 text-left"
              >
                <h2 className="text-body font-medium">{t.shop.inBasket(bought.length)}</h2>
                {!basketOpen && (
                  <span className="line-clamp-2 w-full text-sm text-text-muted line-through">
                    {bought.map((i) => i.replacedBy ?? itemNames(i, language).primary).join(" · ")}
                  </span>
                )}
              </button>
              {basketOpen && (
                <ul className="flex flex-col gap-1">
                  {bought.map((item) => (
                    <ShopRow key={item.key} item={item} weekId={list.weekId} {...rowProps} />
                  ))}
                </ul>
              )}
            </Group>
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
  onCantFind,
}: {
  item: ListItem;
  weekId: string;
  t: Strings;
  language: Language;
  halalMode: boolean;
  onCantFind?: () => void;
}) {
  const bought = item.state === "bought";
  const { primary, secondary } = itemNames(item, language);
  // A can't-find replacement shows as the thing to buy, with the original underneath.
  const title = item.replacedBy ?? primary;
  const detail = [
    item.replacedBy ? null : secondary,
    item.replacedBy ? t.cantFind.instead(primary) : amountLines(item, t, language).join(" + "),
    halalMode && item.halal === "check" && !item.replacedBy ? t.shop.checkHalal : null,
    item.swappedFrom ? `${t.swap.tag} ${t.swap.forOriginal(item.swappedFrom)}` : null,
    item.noLongerNeeded ? t.list.noLongerNeeded : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="flex items-start gap-3 rounded-card bg-surface py-1 pr-3.5 pl-3.5 shadow-card">
      <label className="flex min-h-16 min-w-0 flex-1 items-start gap-3 py-2.5">
        <span className="pt-0.5">
          <Checkbox
            checked={bought}
            onChange={(e) => setItemState(weekId, item.key, e.target.checked ? "bought" : "to_buy")}
          />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-lg leading-[1.3] font-medium">{title}</span>
          <span className="text-sm text-text-muted">{detail}</span>
        </span>
      </label>
      {onCantFind && (
        <span className="flex min-h-tap shrink-0 items-center pt-2">
          <SmallButton onClick={onCantFind}>{t.cantFind.action}</SmallButton>
        </span>
      )}
    </li>
  );
}

/** 36px pill ("Can't find?", "Put back"), with a 44px tap target. */
function SmallButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <Button variant="secondary" size="sm" fullWidth={false} onClick={onClick} className="relative min-h-9 px-3 text-[0.8125rem] before:absolute before:-inset-y-1 before:inset-x-0">
      {children}
    </Button>
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
