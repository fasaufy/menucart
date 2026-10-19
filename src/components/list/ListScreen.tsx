"use client";

import Link from "next/link";
import { useState } from "react";
import { SignupPromptSheet } from "@/components/auth/SignupPrompt";
import { SessionBanner } from "@/components/auth/SessionBanner";
import { SwapTag } from "@/components/dish/SwapTag";
import { ShareIcon } from "@/components/icons";
import { TabBar } from "@/components/TabBar";
import { Button, buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Footer } from "@/components/ui/Footer";
import { Card, Group, GroupHeader } from "@/components/ui/Group";
import { HalalBadge } from "@/components/ui/HalalBadge";
import { Notice } from "@/components/ui/Notice";
import { Segmented } from "@/components/ui/Segmented";
import { useActiveList } from "@/lib/hooks";
import { carryOver, generateList } from "@/lib/list/actions";
import { shareText } from "@/lib/list/share";
import { useOnline } from "@/lib/useOnline";
import { useToday } from "@/lib/useToday";
import { formatWeekRange, mondayOf } from "@/lib/week";
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
  const today = useToday();
  const online = useOnline();

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
  const toBuy = items.filter((i) => i.state === "to_buy");
  const atHome = items.filter((i) => i.state === "at_home");
  const bought = items.filter((i) => i.state === "bought");
  const skipped = items.filter((i) => i.state === "skipped");
  const planChanged = diff.added + diff.changed + diff.removed > 0;
  const rowProps = { t, language, halalMode: settings.halalMode };

  return (
    <>
      <SessionBanner t={t} />
      <Header
        t={t}
        summary={t.list.summary(toBuy.length, atHome.length, list.dishCount)}
        onShare={
          toBuy.length
            ? () => shareList(shareText(items, formatWeekRange(list.weekId, language), t, language))
            : undefined
        }
      />
      <SignupPromptSheet when={items.length > 0} variant="firstList" t={t} />

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

        <Segmented
          label={t.list.viewLabel}
          value={view}
          onChange={chooseView}
          options={[
            { value: "menu", label: t.list.byMenu },
            { value: "aisle", label: t.list.byAisle },
          ]}
        />

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
  muted,
  children,
}: {
  title: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Group>
      <GroupHeader>
        <h2 className="text-body font-medium">{title}</h2>
      </GroupHeader>
      <Card className={`py-0 ${muted ? "text-text-muted" : ""}`}>
        <ul className="flex flex-col [&>li+li]:border-t [&>li+li]:border-dashed [&>li+li]:border-divider">{children}</ul>
      </Card>
    </Group>
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
  const uses = item.carriedOver ? t.list.carried : expanded ? usesText(item, t, Infinity) : usesText(item, t);
  const sub = [secondary, uses].filter(Boolean).join(" · ");

  return (
    <li>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((e) => !e)}
        className="flex min-h-tap w-full items-start justify-between gap-3 py-3 text-left"
      >
        <span className="flex min-w-0 flex-col items-start gap-1">
          <span className={`text-body leading-[1.4] font-medium ${item.state === "bought" ? "line-through" : ""}`}>
            {primary}
          </span>
          {sub && (
            <span className={`text-xs text-text-muted ${expanded ? "" : "line-clamp-1"}`}>{sub}</span>
          )}
          {item.swappedFrom && <SwapTag from={item.swappedFrom} t={t} />}
          {halalMode && item.halal === "non_halal" && <HalalBadge status="non_halal" />}
          {halalMode && item.halal === "check" && <HalalBadge status="check" label={t.list.checkHalal} />}
          {item.noLongerNeeded && (
            <span className="text-xs text-text-muted">{t.list.noLongerNeeded}</span>
          )}
          {item.replacedBy && (
            <span className="text-xs font-medium">→ {item.replacedBy}</span>
          )}
        </span>
        <span className="flex shrink-0 flex-col items-end text-body leading-[1.4] tabular-nums">
          {amountLines(item, t, language).map((line) => (
            <span key={line}>{line}</span>
          ))}
        </span>
      </button>
      {expanded && onCantFind && (
        <div className="flex justify-end pb-2">
          <Button variant="secondary" size="sm" fullWidth={false} onClick={onCantFind} className="min-h-8 px-3 text-xs">
            {t.cantFind.action}
          </Button>
        </div>
      )}
    </li>
  );
}

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
