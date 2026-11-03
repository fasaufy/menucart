"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useId, useMemo, useState } from "react";
import { SignupPromptSheet } from "@/components/auth/SignupPrompt";
import { SessionBanner } from "@/components/auth/SessionBanner";
import { SwapTag } from "@/components/dish/SwapTag";
import { ChevronRightIcon, CloseIcon, InfoIcon, ShareIcon } from "@/components/icons";
import { TabBar } from "@/components/TabBar";
import { Button, buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Footer } from "@/components/ui/Footer";
import { Card, Group, GroupHeader } from "@/components/ui/Group";
import { HalalBadge } from "@/components/ui/HalalBadge";
import { ItemRow } from "@/components/ui/ItemRow";
import { NewTag } from "@/components/ui/NewTag";
import { Notice } from "@/components/ui/Notice";
import { Segmented } from "@/components/ui/Segmented";
import { saveSettings } from "@/lib/db";
import type { Meta } from "@/lib/db";
import { effectiveIngredients } from "@/lib/dishes/swaps";
import { useActiveList, useBudgetChosen, useMeta } from "@/lib/hooks";
import { carryOver, dismissListChange, generateList, refreshList, setItemState, type PlannedMeal } from "@/lib/list/actions";
import { keeps } from "@/lib/list/freshness";
import { groupByStall } from "@/lib/list/stalls";
import { formatRupiah } from "@/lib/money";
import { BAPANAS_AS_OF } from "@/lib/prices/bapanas-jateng";
import { cheaperOptions, priceJump } from "@/lib/prices/cheaper";
import { linePrice, weekMoney, type WeekMoney } from "@/lib/prices/price";
import { cityLabel, isProvinceAverage } from "@/lib/region/places";
import { useOnline } from "@/lib/useOnline";
import { useToday } from "@/lib/useToday";
import { dayName, formatWeekRange, shortDayName, weekStartOf } from "@/lib/week";
import { getStrings, type Strings } from "@/lib/strings";
import type { City, Day, Language, ListItem } from "@/lib/types";
import { BudgetMeter } from "./BudgetMeter";
import { CantFindSheet } from "./CantFindSheet";
import { aisleDetail, byName, itemNames, lineMoney, monthLabel, rowRight } from "./format";
import { ItemSheet, type ItemSheetMode } from "./ItemSheet";
import { SwapsSheet } from "./SwapsSheet";
import { TitipSheet } from "./TitipSheet";
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
  const [titip, setTitip] = useState(false);
  const [swapsOpen, setSwapsOpen] = useState(false);
  const openItem = useCallback((key: string, mode: ItemSheetMode) => setSheet({ key, mode }), []);
  const money = useMemo(
    () => list && weekMoney(list.items, list.settings.weeklyBudget, list.settings.city),
    [list],
  );
  const change = useMeta("listChange");

  // The plan changed since the list was made: update it in place, keeping ticks (L6).
  // A new non-halal dish waits for the halal review instead.
  const diffKey = list ? `${list.weekId}:${list.diff.added}:${list.diff.changed}:${list.diff.removed}` : "";
  const planChanged = !!list && list.diff.added + list.diff.changed + list.diff.removed > 0;
  const [reviewFor, setReviewFor] = useState<string | null>(null);
  useEffect(() => {
    if (!list || !planChanged) return;
    let cancelled = false;
    refreshList(list.weekId).then((result) => {
      if (!cancelled && result === "review") setReviewFor(diffKey);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- diffKey stands in for the list's diff
  }, [diffKey]);

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

  const { items, settings } = list;
  const city = settings.city;
  /** Subtotal of a group's lines ("Rp26.000"); lines without a price add nothing. */
  const subtotal = (lines: ListItem[]) => formatRupiah(lines.reduce((n, i) => n + (linePrice(i, city)?.cost ?? 0), 0));
  const toBuy = items.filter((i) => i.state === "to_buy");
  const atHome = items.filter((i) => i.state === "at_home");
  const bought = items.filter((i) => i.state === "bought");
  const skipped = items.filter((i) => i.state === "skipped");
  const nothingToBuy = toBuy.length === 0 && bought.length === 0 && atHome.length > 0;
  const shownChange = change?.weekId === list.weekId ? change : null;
  const newKeys = new Set(shownChange?.addedKeys);
  const cook = cookNotes(list.meals, list.weekId, t, language);
  // "Over budget · 2 cheaper swaps": lines with a cheaper alternative this week.
  const swaps = money && money.left < 0 ? toBuy.filter((i) => cheaperOptions(i, city).length > 0).length : 0;
  const rowProps = { weekId: list.weekId, city, t, language, halalMode: settings.halalMode, onOpen: openItem };

  return (
    <>
      <SessionBanner t={t} />
      <Header
        t={t}
        summary={
          !money
            ? undefined
            : nothingToBuy
              ? t.list.summaryEmpty(formatRupiah(0), formatRupiah(money.budget))
              : money.missing.length
                ? t.list.summaryMissing(formatRupiah(money.spend, { estimated: true }), formatRupiah(money.budget), money.missing.length)
                : t.list.summary(formatRupiah(money.spend), formatRupiah(money.budget), money.toBuyCount, money.atHomeCount)
        }
        onShare={toBuy.length ? () => setTitip(true) : undefined}
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
      <SwapsSheet
        open={swapsOpen}
        items={toBuy}
        weekId={list.weekId}
        city={city}
        t={t}
        language={language}
        onOpenItem={(key) => {
          setSwapsOpen(false);
          openItem(key, "details");
        }}
        onClose={() => setSwapsOpen(false)}
      />
      <TitipSheet
        open={titip}
        items={items}
        budget={settings.weeklyBudget}
        city={city}
        t={t}
        language={language}
        onClose={() => setTitip(false)}
      />
      <CantFindSheet
        item={items.find((i) => i.key === cantFind) ?? null}
        weekId={list.weekId}
        city={city}
        t={t}
        language={language}
        onClose={() => setCantFind(null)}
      />

      <div className="flex flex-col gap-4 px-5 pt-3 pb-6">
        {planChanged && reviewFor === diffKey && (
          <Notice title={t.list.changed.reviewTitle} detail={t.list.changed.reviewDetail}>
            <Link href="/review" className={buttonClasses("secondary")}>
              {t.list.changed.review}
            </Link>
          </Notice>
        )}

        {shownChange && <ChangeBanner change={shownChange} weekId={list.weekId} t={t} language={language} />}

        {today && list.weekId < weekStartOf(today, settings.weekStartsOn) && (
          <RolloverBanner
            range={formatWeekRange(list.weekId, language)}
            unbought={items.filter((i) => i.state === "to_buy" && !i.noLongerNeeded && !i.carriedOver).length}
            onCarry={() => carryOver(list.weekId, weekStartOf(today, settings.weekStartsOn))}
            onFresh={() => generateList(weekStartOf(today, settings.weekStartsOn))}
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

        {money && (
          <BudgetCard money={money} swaps={swaps} city={city} t={t} language={language} onSwaps={() => setSwapsOpen(true)} />
        )}

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
            newDishes={new Set(shownChange?.added.map((a) => a.name))}
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

        {nothingToBuy && money && (
          <Group>
            <GroupHeader>
              <h2 className="text-body font-medium">{t.list.nothingTitle}</h2>
            </GroupHeader>
            <Card className="items-center gap-1 py-5 text-center">
              <p className="text-body font-semibold">{t.list.nothingCard}</p>
              <p className="text-meta text-text-muted">{t.list.nothingHint(atHome.length, formatRupiah(money.budget))}</p>
            </Card>
          </Group>
        )}

        {view === "aisle" && (
          <>
            {groupByStall(toBuy).map(({ stall, items }) => (
              <ItemGroup
                key={stall}
                title={`${t.stalls[stall]} · ${items.length}`}
                isNew={items.every((i) => newKeys.has(i.key)) ? t.list.newTag : undefined}
                total={subtotal(items)}
                info={{ label: t.list.countInfoLabel(t.stalls[stall]), text: t.list.countInfo(items.length, t.stalls[stall]) }}
              >
                {byName(items, language).map((item) => (
                  <ListRow key={item.key} item={item} isNew={newKeys.has(item.key)} cook={cook.get(item.key)} {...rowProps} />
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
        {toBuy.length > 0 && <Button onClick={() => setTitip(true)}>{t.titip.action}</Button>}
        {nothingToBuy && (
          <Link href="/plan" className={buttonClasses()}>
            {t.list.backToPlan}
          </Link>
        )}
        <TabBar />
      </Footer>
    </>
  );
}

/** Where prices come from, the budget meter, and what ≈ means (P5, P7). */
function BudgetCard({
  money,
  swaps,
  city,
  t,
  language,
  onSwaps,
}: {
  money: WeekMoney;
  /** Lines with a cheaper alternative, said when over budget (L6). */
  swaps: number;
  city: City;
  t: Strings;
  language: Language;
  /** Opens the list of cheaper swaps. */
  onSwaps: () => void;
}) {
  const over = money.left < 0;
  return (
    <Group className={over ? "bg-tint-red" : "bg-notice"}>
      <div className="flex items-start justify-between gap-3 px-3.5 pt-3 pb-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-xs text-text-muted">{t.prices.for}</span>
          <span className="text-sm leading-[1.3] font-semibold">{cityLabel(city, t)}</span>
        </div>
        <span className="shrink-0 rounded-pill bg-surface px-2.5 py-1 text-xs font-semibold shadow-card">
          {t.prices.asOf(monthLabel(BAPANAS_AS_OF, language))}
        </span>
      </div>
      <Card>
        <BudgetMeter money={money} t={t} />
      </Card>
      {over && swaps > 0 ? (
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={onSwaps}
          className="flex min-h-tap items-center justify-between gap-2 px-3.5 py-2 text-left text-xs leading-[1.4] font-semibold text-halal-flag-text"
        >
          <span className="underline underline-offset-2">{t.budget.overNote(swaps)}</span>
          <ChevronRightIcon size={16} className="shrink-0" />
        </button>
      ) : over ? (
        <p className="px-3.5 py-3 text-xs leading-[1.4] font-medium text-halal-flag-text">{t.budget.overNote(0)}</p>
      ) : (
        <p className="flex items-start gap-1.5 px-3.5 py-3 text-xs leading-[1.4] text-text-muted">
          <InfoIcon size={12} className="mt-0.5 shrink-0" />
          <span>
            {!isProvinceAverage(city) && `${t.prices.noCityData(city.name)} `}
            {t.prices.legend}
          </span>
        </p>
      )}
    </Group>
  );
}

/** "Cook Tue · keeps 1–2 days" for short-lived lines, from the first day a dish needs them. */
function cookNotes(meals: PlannedMeal[], weekId: string, t: Strings, language: Language) {
  const first = new Map<string, Day>();
  for (const { day, dish } of meals) {
    for (const { key } of effectiveIngredients(dish)) {
      if (keeps(key) && !(first.get(key)! <= day)) first.set(key, day);
    }
  }
  return new Map(
    [...first].map(([key, day]) => {
      const [min, max] = keeps(key)!;
      return [key, t.fresh.cook(shortDayName(weekId, day, language), t.fresh.range(min, max))];
    }),
  );
}

/** "Plan changed · Rendang added" / "Thursday dinner · 2 items added. Your ticks are kept." */
function ChangeBanner({ change, weekId, t, language }: { change: Meta<"listChange">; weekId: string; t: Strings; language: Language }) {
  const what = [
    change.added.length > 0 && t.list.changed.added(change.added.map((a) => a.name)),
    change.removed.length > 0 && t.list.changed.removed(change.removed),
  ]
    .filter(Boolean)
    .join(", ");
  const slot = change.added.length === 1 && t.list.changed.slot(dayName(weekId, change.added[0].day, language), t.meals[change.added[0].meal]);
  const items = t.list.changed.items(change.addedKeys.length, change.removedCount);
  const detail = [[slot, items].filter(Boolean).join(" · "), t.list.changed.kept].filter(Boolean).join(items || slot ? ". " : "");
  return (
    <div role="status" className="flex items-start gap-2 rounded-card border border-border bg-surface/70 py-1 pr-1 pl-3.5 shadow-card">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 py-2">
        <p className="text-sm font-semibold">{t.list.changed.title(what || t.list.changed.updated)}</p>
        <p className="text-xs text-text-muted">{detail}</p>
      </div>
      <button
        type="button"
        aria-label={t.list.changed.dismiss}
        onClick={() => dismissListChange()}
        className="grid size-tap shrink-0 place-items-center text-text-muted"
      >
        <CloseIcon size={16} />
      </button>
    </div>
  );
}

function Header({ t, summary, onShare }: { t: Strings; summary?: string; onShare?: () => void }) {
  return (
    <header className="flex items-start justify-between gap-3 px-5 pt-6 pb-3">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl leading-tight font-semibold">{t.list.title}</h1>
        {/* Lines break between the "·" parts, never inside "3 at home". */}
        <p className="min-h-[1lh] text-meta text-text-muted">
          {summary?.split(" · ").map((part, i) => (
            <span key={i} className="whitespace-nowrap">
              {i > 0 && " · "}
              {part}
            </span>
          ))}
        </p>
      </div>
      {onShare && (
        <button
          type="button"
          onClick={onShare}
          aria-label={t.titip.action}
          className="grid size-tap shrink-0 place-items-center rounded-pill border border-border bg-surface shadow-button"
        >
          <ShareIcon size={18} />
        </button>
      )}
    </header>
  );
}

function ItemGroup({
  title,
  isNew,
  total,
  muted,
  info,
  children,
}: {
  title: string;
  /** "New" chip when every line came with the last plan change. */
  isNew?: string;
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
          {isNew && <span className="ml-2"><NewTag label={isNew} /></span>}
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
    isNew,
    cook,
  }: {
    item: ListItem;
    weekId: string;
    city: City;
    t: Strings;
    language: Language;
    halalMode: boolean;
    onOpen: (key: string, mode: ItemSheetMode) => void;
    /** Came with the last plan change. */
    isNew?: boolean;
    /** "Cook Tue · keeps 1–2 days" for short-lived lines. */
    cook?: string;
  }) {
    const money = lineMoney(item, city, t, language);
    const addPrice = !money.price && item.state === "to_buy";
    // Only a Bapanas estimate can jump; the user's own price stands.
    const jump = item.state === "to_buy" && item.userPrice === undefined ? priceJump(item.key) : undefined;
    const detail = item.carriedOver
      ? t.list.carried
      : item.state === "at_home"
        ? t.list.atHome
        : item.noLongerNeeded
          ? t.list.noLongerNeeded
          : addPrice
            ? t.item.noPrice
            : jump
              ? [money.amount, t.item.jumpDetail(Math.round(jump.change * 100), monthLabel(jump.previousMonth, language))]
                  .filter(Boolean)
                  .join(" · ")
              : cook && item.state === "to_buy"
                ? [cook, money.amount].filter(Boolean).join(" · ")
                : aisleDetail(item, money, t, language);
    const badges = isNew || item.swappedFrom || (halalMode && item.halal !== "halal") || item.replacedBy;

    return (
      <li>
        <ItemRow
          name={itemNames(item, language).primary}
          detail={detail}
          detailTone={jump ? "warning" : "default"}
          checked={item.state === "at_home" || item.state === "bought"}
          done={item.state === "bought"}
          onToggle={(checked) => setItemState(weekId, item.key, checked ? "at_home" : "to_buy")}
          onOpen={() => onOpen(item.key, "details")}
          extra={
            badges && (
              <>
                {isNew && <NewTag label={t.list.newTag} />}
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
    a.isNew === b.isNew &&
    a.cook === b.cook &&
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
