"use client";

import Link from "next/link";
import { Tip } from "@/components/onboarding/Tip";
import { BackButton } from "@/components/ui/BackButton";
import { buttonClasses } from "@/components/ui/Button";
import { Footer } from "@/components/ui/Footer";
import { Card, Group, GroupHeader, rowDivider } from "@/components/ui/Group";
import { ItemRow } from "@/components/ui/ItemRow";
import { useActiveList } from "@/lib/hooks";
import { setItemState } from "@/lib/list/actions";
import { STAPLE_KEYS } from "@/lib/list/merge";
import { formatRupiah } from "@/lib/money";
import { weekMoney } from "@/lib/prices/price";
import { getStrings, type Strings } from "@/lib/strings";
import type { City, Language, ListItem } from "@/lib/types";
import { BudgetMeter } from "./BudgetMeter";
import { groupBySection, itemNames, lineMoney, rowRight } from "./format";

export function PantryScreen() {
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
  const money = list && weekMoney(list.items, list.settings.weeklyBudget, list.settings.city);
  // "Garlic and ginger at home saved Rp7.000": what the user ticked, not the pre-ticked staples.
  const ticked = money?.atHome.filter((a) => !STAPLE_KEYS.has(a.key)) ?? [];
  const tickedNames = ticked.map((a, i) => {
    const name = itemNames(items.find((it) => it.key === a.key)!, language).primary;
    return i ? name.charAt(0).toLowerCase() + name.slice(1) : name;
  });
  const saved = ticked.reduce((n, a) => n + a.cost, 0);
  const total = money ? formatRupiah(money.spend, { estimated: money.missing.length > 0 }) : "";

  return (
    <>
      <header className="flex flex-col gap-5 px-5 pt-10 pb-2">
        <BackButton label={t.pantry.back} fallback="/list" />
        <div className="flex flex-col gap-2">
          <h1 className="max-w-[16ch] font-display text-2xl leading-tight font-semibold">{t.pantry.title}</h1>
          <p className="text-sm text-text-muted">{t.pantry.hint}</p>
        </div>
      </header>

      {list && (
        <div className="flex flex-col gap-3 px-5 pt-3 pb-6">
          <Tip id="pantry" t={t} />
          {staples.length > 0 && (
            <PantryGroup
              title={t.pantry.staples}
              items={staples}
              weekId={list.weekId}
              city={list.settings.city}
              t={t}
              language={language}
            />
          )}
          {others.length > 0 && (
            <PantryGroup
              title={t.pantry.fromDishes(list.dishCount)}
              items={others}
              weekId={list.weekId}
              city={list.settings.city}
              t={t}
              language={language}
            />
          )}
        </div>
      )}

      <Footer className="gap-1">
        {money && (
          <Card className="mb-2 gap-2 shadow-float">
            <BudgetMeter money={money} label={t.budget.toBuy} bar={false} t={t} />
            {saved > 0 && <p className="text-xs text-text-muted">{t.pantry.saved(tickedNames, formatRupiah(saved))}</p>}
          </Card>
        )}
        <Link href="/list" className={buttonClasses()}>
          {t.pantry.showList(total)}
        </Link>
        <Link href="/list" className="-mb-2 flex min-h-tap items-center justify-center text-sm text-text-muted">
          {t.pantry.skip}
        </Link>
      </Footer>
    </>
  );
}

function PantryGroup({
  title,
  items,
  weekId,
  city,
  t,
  language,
}: {
  title: string;
  items: ListItem[];
  weekId: string;
  city: City;
  t: Strings;
  language: Language;
}) {
  return (
    <Group>
      <GroupHeader>
        <h2 className="text-body font-medium">{title}</h2>
      </GroupHeader>
      <Card className="py-1">
      <ul className="flex flex-col">
        {items.map((item, i) => (
          <li key={item.key} className={i ? rowDivider : ""}>
            <PantryRow item={item} weekId={weekId} city={city} t={t} language={language} />
          </li>
        ))}
      </ul>
      </Card>
    </Group>
  );
}

/** Ticked = at home: not bought, not counted. */
function PantryRow({ item, weekId, city, t, language }: { item: ListItem; weekId: string; city: City; t: Strings; language: Language }) {
  const money = lineMoney(item, city, t, language);
  const atHome = item.state === "at_home";
  return (
    <ItemRow
      name={itemNames(item, language).primary}
      detail={atHome ? t.list.atHome : money.amount}
      checked={atHome}
      onToggle={(checked) => setItemState(weekId, item.key, checked ? "at_home" : "to_buy")}
      {...rowRight(item, money, t, language)}
    />
  );
}
