"use client";

import Link from "next/link";
import { Tip } from "@/components/onboarding/Tip";
import { BackButton } from "@/components/ui/BackButton";
import { buttonClasses } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Footer } from "@/components/ui/Footer";
import { Card, Group, GroupHeader, rowDivider } from "@/components/ui/Group";
import { useActiveList } from "@/lib/hooks";
import { setItemState } from "@/lib/list/actions";
import { STAPLE_KEYS } from "@/lib/list/merge";
import { getStrings, type Strings } from "@/lib/strings";
import type { Language, ListItem } from "@/lib/types";
import { amountLines, groupBySection, itemNames } from "./format";

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
  const toBuy = items.filter((i) => i.state === "to_buy").length;

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

      <Footer className="gap-1">
        <Link href="/list" className={buttonClasses()}>
          {t.pantry.showList(toBuy)}
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
    <Group>
      <GroupHeader>
        <h2 className="text-body font-medium">{title}</h2>
      </GroupHeader>
      <Card className="py-1">
      <ul className="flex flex-col">
        {items.map((item, i) => (
          <li key={item.key} className={i ? rowDivider : ""}>
            <label className="flex min-h-tap items-center gap-3 py-2.5">
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
      </Card>
    </Group>
  );
}
