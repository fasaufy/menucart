"use client";

import Link from "next/link";
import { memo, useCallback, useId, useMemo, useState } from "react";
import { SignupPromptSheet } from "@/components/auth/SignupPrompt";
import { SessionBanner } from "@/components/auth/SessionBanner";
import { SwapTag } from "@/components/dish/SwapTag";
import { GpsFixIcon, InfoIcon, ShareIcon } from "@/components/icons";
import { TabBar } from "@/components/TabBar";
import { Button, buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Footer } from "@/components/ui/Footer";
import { Card, Group, GroupHeader } from "@/components/ui/Group";
import { HalalBadge } from "@/components/ui/HalalBadge";
import { ItemRow } from "@/components/ui/ItemRow";
import { Notice } from "@/components/ui/Notice";
import { Segmented } from "@/components/ui/Segmented";
import { saveSettings } from "@/lib/db";
import { useActiveList, useBudgetChosen } from "@/lib/hooks";
import { carryOver, generateList, setItemState } from "@/lib/list/actions";
import { groupByStall } from "@/lib/list/stalls";
import { shareText } from "@/lib/list/share";
import { formatRupiah } from "@/lib/money";
import { BAPANAS_AS_OF } from "@/lib/prices/bapanas-jateng";
import { linePrice, weekMoney, type WeekMoney } from "@/lib/prices/price";
import { cityLabel, isProvinceAverage } from "@/lib/region/places";
import { useOnline } from "@/lib/useOnline";
import { useToday } from "@/lib/useToday";
import { formatWeekRange, mondayOf } from "@/lib/week";
import { getStrings, type Strings } from "@/lib/strings";
import type { City, Language, ListItem } from "@/lib/types";
import { BudgetMeter } from "./BudgetMeter";
import { CantFindSheet } from "./CantFindSheet";
import { aisleDetail, byName, itemNames, lineMoney, monthLabel, rowRight } from "./format";
import { ItemSheet, type ItemSheetMode } from "./ItemSheet";
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

  const today = useToday();
  const online = useOnline();
  const budgetChosen = useBudgetChosen();
  // Item details or Edit a price, and Can't find, for a tapped line.
  const [sheet, setSheet] = useState<{ key: string; mode: ItemSheetMode } | null>(null);
  const [cantFind, setCantFind] = useState<string | null>(null);
  const openItem = useCallback((key: string, mode: ItemSheetMode) => setSheet({ key, mode }), []);
  const money = useMemo(
    () => list && weekMoney(list.items, list.settings.weeklyBudget, list.settings.city),
    [list],
  );

  function chooseView(next: View) {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {}
  }

  if (list === undefined) {
    return (
      <>
        <Header t={t} />
        <Footer>
          <TabBar />
        </Footer>
      </>
    );
  }
  if (list === null) {
    return (
      <>
        <Header t={t} />
        <div className="flex flex-col gap-3 px-5 pt-3 pb-6">
          <EmptyState title={t.list.emptyTitle} hint={t.list.emptyHint} />
          <Link href="/plan" className={buttonClasses("secondary")}>
            {t.list.goPlan}
          </Link>
        </div>
        <Footer>
          <TabBar />
        </Footer>
      </>
    );
  }

  const { items, diff, settings } = list;
  const city = settings.city;
  /** Subtotal of a group's lines ("Rp26.000"); lines without a price add nothing. */
  const subtotal = (lines: ListItem[]) => formatRupiah(lines.reduce((n, i) => n + (linePrice(i, city)?.cost ?? 0), 0));
  const toBuy = items.filter((i) => i.state === "to_buy");
  const atHome = items.filter((i) => i.state === "at_home");
  const bought = items.filter((i) => i.state === "bought");
  const skipped = items.filter((i) => i.state === "skipped");
  const planChanged = diff.added + diff.changed + diff.removed > 0;
  const rowProps = { weekId: list.weekId, city, t, language, halalMode: settings.halalMode, onOpen: openItem };

  return (
    <>
      <SessionBanner t={t} />
      <Header
        t={t}
        summary={
          money
            ? t.list.summary(
                formatRupiah(money.spend, { estimated: money.missing.length > 0 }),
                formatRupiah(money.budget),
                money.toBuyCount,
                money.atHomeCount,
              )
            : undefined
        }
        onShare={
          toBuy.length
            ? () => shareList(shareText(items, formatWeekRange(list.weekId, language), t, language))
            : undefined
        }
      />
      <SignupPromptSheet when={items.length > 0} variant="firstList" t={t} />
      {money && (
        <ItemSheet
          item={items.find((i) => i.key === sheet?.key) ?? null}
          mode={sheet?.mode ?? "details"}
          weekId={list.weekId}
          city={city}
          money={money}
          t={t}
          language={language}
          onMode={(mode) => setSheet((s) => s && { ...s, mode })}
          onCantFind={(key) => {
            setSheet(null);
            setCantFind(key);
          }}
          onClose={() => setSheet(null)}
        />
      )}
      <CantFindSheet
        item={items.find((i) => i.key === cantFind) ?? null}
        weekId={list.weekId}
        t={t}
        language={language}
        onClose={() => setCantFind(null)}
      />

      <div className="flex flex-col gap-4 px-5 pt-3 pb-6">
        {planChanged && (
          <Notice title={t.list.planChangedPrefix} detail={t.list.planChanged(diff)}>
            <Button variant="secondary" onClick={() => generateList(list.weekId)}>
              {t.list.update}
            </Button>
          </Notice>
        )}

        {today && list.weekId < mondayOf(today) && (
          <RolloverBanner
            range={formatWeekRange(list.weekId, language)}
            unbought={items.filter((i) => i.state === "to_buy" && !i.noLongerNeeded && !i.carriedOver).length}
            onCarry={() => carryOver(list.weekId, mondayOf(today))}
            onFresh={() => generateList(mondayOf(today))}
            t={t}
          />
        )}

        {budgetChosen === false && (
          <Notice title={t.budget.unsetTitle} detail={t.budget.unsetDetail(formatRupiah(settings.weeklyBudget))}>
            <Link href="/settings" className={buttonClasses("secondary")}>
              {t.budget.unsetChange}
            </Link>
            {/* Saving writes the budget, which ends the notice. */}
            <Button variant="secondary" onClick={() => saveSettings(settings)}>
              {t.budget.unsetKeep(formatRupiah(settings.weeklyBudget))}
            </Button>
          </Notice>
        )}

        <Segmented
          label={t.list.viewLabel}
          value={view}
          onChange={chooseView}
          options={[
            { value: "menu", label: t.list.byMenu },
            { value: "aisle", label: t.list.byAisle },
          ]}
        />

        {money && <BudgetCard money={money} city={city} t={t} language={language} />}

        {view === "menu" && (
          <MenuCards
            weekId={list.weekId}
            meals={list.meals}
            items={items}
            householdSize={settings.householdSize}
            city={city}
            halalMode={settings.halalMode}
            t={t}
            language={language}
            onOpen={openItem}
          />
        )}

        {list.awaitingAi.length > 0 && (
          <p role="status" className="text-meta text-text-muted">
            {online ? t.list.awaitingOnline(list.awaitingAi.length) : t.list.awaitingOffline(list.awaitingAi.length)}
          </p>
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
            {groupByStall(toBuy).map(({ stall, items }) => (
              <ItemGroup
                key={stall}
                title={`${t.stalls[stall]} · ${items.length}`}
                total={subtotal(items)}
                info={{ label: t.list.countInfoLabel(t.stalls[stall]), text: t.list.countInfo(items.length, t.stalls[stall]) }}
              >
                {byName(items, language).map((item) => (
                  <ListRow key={item.key} item={item} {...rowProps} />
                ))}
              </ItemGroup>
            ))}

            {skipped.length > 0 && (
              <ItemGroup title={t.cantFind.skipped(skipped.length)} muted>
                {skipped.map((item) => (
                  <ListRow key={item.key} item={item} {...rowProps} />
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
          className="flex min-h-tap items-center justify-center text-sm text-text-muted underline underline-offset-4"
        >
          {t.list.editPantry}
        </Link>
      </div>

      <Footer>
        {toBuy.length > 0 && (
          <Link href="/shop" className={buttonClasses()}>
            {t.list.startShopping}
          </Link>
        )}
        <TabBar />
      </Footer>
    </>
  );
}

/** Where prices come from, the budget meter, and what ≈ means (P5, P7). */
function BudgetCard({ money, city, t, language }: { money: WeekMoney; city: City; t: Strings; language: Language }) {
  return (
    <Group className="bg-notice">
      <div className="flex items-start justify-between gap-3 px-3.5 pt-3 pb-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-xs text-text-muted">{t.prices.for}</span>
          <span className="flex items-center gap-1 text-sm leading-[1.3] font-semibold">
            <GpsFixIcon size={12} className="shrink-0" />
            {cityLabel(city, t)}
          </span>
        </div>
        <span className="shrink-0 rounded-pill bg-surface px-2.5 py-1 text-xs font-semibold shadow-card">
          {t.prices.asOf(monthLabel(BAPANAS_AS_OF, language))}
        </span>
      </div>
      <Card>
        <BudgetMeter money={money} t={t} />
      </Card>
      <p className="flex items-start gap-1.5 px-3.5 py-3 text-xs leading-[1.4] text-text-muted">
        <InfoIcon size={12} className="mt-0.5 shrink-0" />
        <span>
          {!isProvinceAverage(city) && `${t.prices.noCityData(city.name)} `}
          {t.prices.legend}
        </span>
      </p>
    </Group>
  );
}

function Header({ t, summary, onShare }: { t: Strings; summary?: string; onShare?: () => void }) {
  return (
    <header className="flex items-start justify-between gap-3 px-5 pt-6 pb-3">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl leading-tight font-semibold">{t.list.title}</h1>
        <p className="min-h-[1lh] text-meta text-text-muted">{summary}</p>
      </div>
      {onShare && (
        <button
          type="button"
          onClick={onShare}
          aria-label={t.share.action}
          className="grid size-tap shrink-0 place-items-center rounded-pill border border-border bg-surface shadow-button"
        >
          <ShareIcon size={18} />
        </button>
      )}
    </header>
  );
}

/** Share sheet on phones (WhatsApp is one tap, works offline); WhatsApp link elsewhere. */
async function shareList(text: string) {
  if (navigator.share) {
    try {
      await navigator.share({ text });
    } catch {
      // Closing the share sheet rejects; nothing to do.
    }
    return;
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
}

function ItemGroup({
  title,
  total,
  muted,
  info,
  children,
}: {
  title: string;
  /** What the group's lines cost, on the right of the header. */
  total?: string;
  muted?: boolean;
  /** Explains the count in the title; tapping ⓘ shows it under the header. */
  info?: { label: string; text: string };
  children: React.ReactNode;
}) {
  const [showInfo, setShowInfo] = useState(false);
  const infoId = useId();
  return (
    <Group>
      <GroupHeader>
        <div className="flex items-center">
          <h2 className="text-body font-medium">{title}</h2>
          {info && (
            <button
              type="button"
              aria-label={info.label}
              aria-expanded={showInfo}
              aria-controls={infoId}
              onClick={() => setShowInfo((s) => !s)}
              className={`-my-3 grid size-tap shrink-0 place-items-center rounded-pill ${showInfo ? "text-accent" : "text-text-muted"}`}
            >
              <InfoIcon size={16} />
            </button>
          )}
        </div>
        {total && <span className="text-meta font-medium text-text-muted tabular-nums">{total}</span>}
      </GroupHeader>
      {info && showInfo && (
        <p id={infoId} role="note" className="-mt-1 px-3.5 pb-3 text-meta text-text-muted">
          {info.text}
        </p>
      )}
      <Card className={`py-0 ${muted ? "text-text-muted" : ""}`}>
        <ul className="flex flex-col [&>li+li]:border-t [&>li+li]:border-dashed [&>li+li]:border-divider">{children}</ul>
      </Card>
    </Group>
  );
}

/** A By aisle line. The checkbox means "at home" here; shopping mode ticks "bought". */
const ListRow = memo(
  function ListRow({
    item,
    weekId,
    city,
    t,
    language,
    halalMode,
    onOpen,
  }: {
    item: ListItem;
    weekId: string;
    city: City;
    t: Strings;
    language: Language;
    halalMode: boolean;
    onOpen: (key: string, mode: ItemSheetMode) => void;
  }) {
    const money = lineMoney(item, city, t, language);
    const addPrice = !money.price && item.state === "to_buy";
    const detail = item.carriedOver
      ? t.list.carried
      : item.state === "at_home"
        ? t.list.atHome
        : item.noLongerNeeded
          ? t.list.noLongerNeeded
          : addPrice
            ? t.item.noPrice
            : aisleDetail(item, money, t, language);
    const badges = item.swappedFrom || (halalMode && item.halal !== "halal") || item.replacedBy;

    return (
      <li>
        <ItemRow
          name={itemNames(item, language).primary}
          detail={detail}
          checked={item.state === "at_home" || item.state === "bought"}
          done={item.state === "bought"}
          onToggle={(checked) => setItemState(weekId, item.key, checked ? "at_home" : "to_buy")}
          onOpen={() => onOpen(item.key, "details")}
          extra={
            badges && (
              <>
                {item.swappedFrom && <SwapTag from={item.swappedFrom} t={t} />}
                {halalMode && item.halal === "non_halal" && <HalalBadge t={t} status="non_halal" />}
                {halalMode && item.halal === "check" && <HalalBadge t={t} status="check" label={t.list.checkHalal} />}
                {item.replacedBy && <span className="text-xs font-medium">→ {item.replacedBy}</span>}
              </>
            )
          }
          {...(addPrice
            ? { right: "addPrice" as const, addPrice: { label: t.list.addPrice, onClick: () => onOpen(item.key, "price") } }
            : rowRight(item, money, t, language))}
        />
      </li>
    );
  },
  // Rows come back as new objects on every list update; only redraw the one that changed.
  (a, b) =>
    a.item.updatedAt === b.item.updatedAt &&
    a.item.key === b.item.key &&
    a.city === b.city &&
    a.halalMode === b.halalMode &&
    a.t === b.t &&
    a.language === b.language &&
    a.weekId === b.weekId,
);

/** Week rollover (PRD): last week's list is archived; unbought items can carry over. */
function RolloverBanner({
  range,
  unbought,
  onCarry,
  onFresh,
  t,
}: {
  range: string;
  unbought: number;
  onCarry: () => void;
  onFresh: () => void;
  t: Strings;
}) {
  return (
    <Notice title={t.list.rolloverTitle(range)} detail={t.list.rolloverHint(unbought)}>
      {unbought > 0 && <Button onClick={onCarry}>{t.list.carryOver}</Button>}
      <Button variant="secondary" onClick={onFresh}>
        {t.list.startFresh}
      </Button>
    </Notice>
  );
}
