"use client";

import Link from "next/link";
import { useState } from "react";
import { GuestSaveSheet } from "@/components/auth/GuestSaveSheet";
import { SessionBanner } from "@/components/auth/SessionBanner";
import { SwapTag } from "@/components/dish/SwapTag";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { HalalBadge } from "@/components/ui/HalalBadge";
import { useActiveList } from "@/lib/hooks";
import { generateList } from "@/lib/list/actions";
import { getStrings, type Strings } from "@/lib/strings";
import type { Language, ListItem } from "@/lib/types";
import { amountLines, groupBySection, itemNames, usesText } from "./format";
import { CantFindSheet } from "./CantFindSheet";
import { MenuCards } from "./MenuCards";

type View = "menu" | "aisle";
const VIEW_KEY = "menucart:list-view";

function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === "aisle" ? "aisle" : "menu";
  } catch {
    return "menu";
  }
}

export function ListScreen() {
  const list = useActiveList();
  const language = list?.settings.language ?? "en";
  const t = getStrings(language);
  // Read lazily: the toggle only renders after the list loads on the client.
  const [view, setView] = useState<View>(() => (typeof window === "undefined" ? "menu" : readView()));

  const [cantFind, setCantFind] = useState<string | null>(null);

  function chooseView(next: View) {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {}
  }

  if (list === undefined) return <Header t={t} />;
  if (list === null) {
    return (
      <>
        <Header t={t} />
        <div className="flex flex-col gap-3 px-5 pt-1 pb-6">
          <EmptyState title={t.list.emptyTitle} hint={t.list.emptyHint} />
          <Link href="/plan" className={buttonClasses("secondary")}>
            {t.list.goPlan}
          </Link>
        </div>
      </>
    );
  }

  const { items, diff, settings } = list;
  const toBuy = items.filter((i) => i.state === "to_buy");
  const atHome = items.filter((i) => i.state === "at_home");
  const bought = items.filter((i) => i.state === "bought");
  const skipped = items.filter((i) => i.state === "skipped");
  const planChanged = diff.added + diff.changed + diff.removed > 0;
  const rowProps = { t, language, halalMode: settings.halalMode };

  return (
    <>
      <SessionBanner t={t} />
      <Header t={t} summary={t.list.summary(toBuy.length, atHome.length, list.dishCount)} />
      <GuestSaveSheet hasList={items.length > 0} t={t} />

      <CantFindSheet
        item={items.find((i) => i.key === cantFind) ?? null}
        weekId={list.weekId}
        t={t}
        language={language}
        onClose={() => setCantFind(null)}
      />

      <div className="flex flex-col gap-4 px-5 pt-1 pb-6">
        {planChanged && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-card bg-fill-muted py-2 pr-2 pl-3.5"
          >
            <span className="text-sm">
              {t.list.planChangedPrefix} · {t.list.planChanged(diff)}
            </span>
            <button
              type="button"
              onClick={() => generateList(list.weekId)}
              className="flex min-h-tap shrink-0 items-center"
            >
              <span className="flex h-8 items-center rounded-pill border-[1.5px] border-text px-3 text-sm font-medium">
                {t.list.update}
              </span>
            </button>
          </div>
        )}

        <div role="group" aria-label={t.list.viewLabel} className="flex rounded-card bg-fill-muted p-1">
          {(["menu", "aisle"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => chooseView(v)}
              className={`min-h-tap flex-1 rounded-row text-sm font-medium ${
                view === v ? "bg-surface text-text shadow-sm" : "text-text-muted"
              }`}
            >
              {v === "menu" ? t.list.byMenu : t.list.byAisle}
            </button>
          ))}
        </div>

        {view === "menu" && (
          <MenuCards
            weekId={list.weekId}
            meals={list.meals}
            items={items}
            householdSize={settings.householdSize}
            halalMode={settings.halalMode}
            t={t}
            language={language}
          />
        )}

        {view === "aisle" && list.withoutIngredients.length > 0 && (
          <p className="text-meta text-text-muted">
            {t.list.withoutIngredients(list.withoutIngredients.join(", "))}
          </p>
        )}

        {toBuy.length === 0 && bought.length === 0 && atHome.length > 0 && (
          <EmptyState title={t.list.nothingToBuy} hint={t.list.nothingToBuyHint} />
        )}

        {view === "aisle" && (
          <>
            {groupBySection(toBuy, language).map(({ section, items }) => (
              <ItemGroup key={section} title={`${t.sections[section]} · ${items.length}`}>
                {items.map((item) => (
                  <ListRow key={item.key} item={item} onCantFind={() => setCantFind(item.key)} {...rowProps} />
                ))}
              </ItemGroup>
            ))}

            {skipped.length > 0 && (
              <ItemGroup title={t.cantFind.skipped(skipped.length)} muted>
                {skipped.map((item) => (
                  <ListRow key={item.key} item={item} onCantFind={() => setCantFind(item.key)} {...rowProps} />
                ))}
              </ItemGroup>
            )}

            {bought.length > 0 && (
              <ItemGroup title={`${t.list.inBasket} · ${bought.length}`} muted>
                {bought.map((item) => (
                  <ListRow key={item.key} item={item} {...rowProps} />
                ))}
              </ItemGroup>
            )}

            {atHome.length > 0 && (
              <ItemGroup title={`${t.list.atHome} · ${atHome.length}`} muted>
                {atHome.map((item) => (
                  <ListRow key={item.key} item={item} {...rowProps} />
                ))}
              </ItemGroup>
            )}
          </>
        )}

        <Link
          href="/pantry"
          className="flex min-h-tap items-center justify-center text-body text-text-muted underline underline-offset-4"
        >
          {t.list.editPantry}
        </Link>
      </div>

      {toBuy.length > 0 && (
        <div className="sticky bottom-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom))] mt-auto border-t border-divider bg-bg px-5 py-3">
          <Link href="/shop" className={buttonClasses()}>
            {t.list.startShopping}
          </Link>
        </div>
      )}
    </>
  );
}

function Header({ t, summary }: { t: Strings; summary?: string }) {
  return (
    <header className="flex flex-col gap-1 px-5 pt-12 pb-3">
      <h1 className="text-2xl font-semibold">{t.list.title}</h1>
      <p className="min-h-[1lh] text-meta text-text-muted">{summary}</p>
    </header>
  );
}

function ItemGroup({
  title,
  muted,
  children,
}: {
  title: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold tracking-wide text-text-muted uppercase">{title}</h2>
      <ul
        className={`flex flex-col divide-y divide-fill-muted rounded-card border border-border bg-surface ${muted ? "text-text-muted" : ""}`}
      >
        {children}
      </ul>
    </section>
  );
}

function ListRow({
  item,
  t,
  language,
  halalMode,
  onCantFind,
}: {
  item: ListItem;
  t: Strings;
  language: Language;
  halalMode: boolean;
  onCantFind?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { primary, secondary } = itemNames(item, language);
  const uses = expanded ? usesText(item, t, Infinity) : usesText(item, t);
  const sub = [secondary, uses].filter(Boolean).join(" · ");

  return (
    <li>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((e) => !e)}
        className="flex min-h-tap w-full items-start justify-between gap-3 px-3.5 py-3 text-left"
      >
        <span className="flex min-w-0 flex-col gap-1">
          <span className={`text-body font-medium ${item.state === "bought" ? "line-through" : ""}`}>
            {primary}
          </span>
          {sub && (
            <span className={`text-xs text-text-muted ${expanded ? "" : "line-clamp-1"}`}>{sub}</span>
          )}
          {item.swappedFrom && <SwapTag from={item.swappedFrom} t={t} />}
          {halalMode && item.halal === "non_halal" && <HalalBadge status="non_halal" />}
          {halalMode && item.halal === "check" && (
            <span className="text-xs text-text-muted">{t.list.checkHalal}</span>
          )}
          {item.noLongerNeeded && (
            <span className="text-xs text-text-muted">{t.list.noLongerNeeded}</span>
          )}
          {item.replacedBy && (
            <span className="text-xs font-medium">→ {item.replacedBy}</span>
          )}
        </span>
        <span className="flex shrink-0 flex-col items-end text-body tabular-nums">
          {amountLines(item, t, language).map((line) => (
            <span key={line}>{line}</span>
          ))}
        </span>
      </button>
      {expanded && onCantFind && (
        <div className="flex justify-end px-1.5 pb-1">
          <button
            type="button"
            onClick={onCantFind}
            className="min-h-tap px-2 text-sm text-text-muted underline underline-offset-4"
          >
            {t.cantFind.action}
          </button>
        </div>
      )}
    </li>
  );
}
