"use client";

import { memo, useCallback, useState } from "react";
import { ChevronDownIcon, CloseIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Card, Group } from "@/components/ui/Group";
import { inputClasses, selectClasses } from "@/components/ui/Input";
import { HalalBadge } from "@/components/ui/HalalBadge";
import {
  clearSwapChoice,
  customIngredient,
  ingredientFromCatalog,
  resetDish,
  saveDishIngredients,
  searchIngredients,
  setSwapChoices,
  UNITS,
} from "@/lib/dishes/edit";
import { replacementLines, SWAP_RULES } from "@/lib/dishes/swaps";
import { formatQty } from "@/components/list/format";
import { ReportIngredient } from "./ReportIngredient";
import { SwapPicker } from "./SwapPicker";
import { INGREDIENTS } from "@/lib/dishes/ingredients";
import { normalize } from "@/lib/dishes/search";
import type { Strings } from "@/lib/strings";
import type { Dish, Ingredient, Language } from "@/lib/types";

type Line = Ingredient & { qtyText: string };

type Props = {
  dish: Dish;
  t: Strings;
  language: Language;
  halalMode: boolean;
  onDone: () => void;
};

/** Edit a dish's ingredient lines (US-03). Saving applies to every meal with this dish. */
export function DishEditor({ dish, t, language, halalMode, onDone }: Props) {
  const [lines, setLines] = useState<Line[]>(() =>
    dish.ingredients.map((i) => ({ ...i, qtyText: String(i.qty) })),
  );
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [swapOpen, setSwapOpen] = useState<string | null>(null);
  const [reporting, setReporting] = useState<string | null>(null);

  const keys = new Set(lines.map((l) => l.key));
  const matches = searchIngredients(query).filter((k) => !keys.has(k));
  const trimmed = query.trim();
  const exact = matches.some((k) =>
    [INGREDIENTS[k].name, INGREDIENTS[k].localName].some((n) => n && normalize(n) === normalize(trimmed)),
  );

  const parse = (text: string) => Number(text.replace(",", "."));
  const valid = lines.every((l) => parse(l.qtyText) > 0);

  // Stable callbacks so typing in one amount re-renders only that ingredient's card.
  const update = useCallback((key: string, patch: Partial<Line>) => {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }, []);
  const remove = useCallback((key: string) => setLines((ls) => ls.filter((l) => l.key !== key)), []);
  const toggleSwap = useCallback((key: string) => setSwapOpen((k) => (k === key ? null : key)), []);

  function add(ingredient: Ingredient) {
    if (keys.has(ingredient.key)) return;
    setLines((ls) => [...ls, { ...ingredient, qtyText: String(ingredient.qty) }]);
    setQuery("");
  }

  async function save() {
    setSaving(true);
    try {
      await saveDishIngredients(
        dish,
        lines.map(({ qtyText, ...l }) => ({ ...l, qty: parse(qtyText) })),
      );
      onDone();
    } finally {
      setSaving(false);
    }
  }

  const displayName = (i: Ingredient) => nameIn(language, i);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-meta text-text-muted">
        {t.editor.appliesToAll(dish.name)} {t.editor.servings(dish.servings)}
      </p>

      <Group>
        {lines.length === 0 && <p className="px-3.5 pt-3 text-body text-text-muted">{t.editor.empty}</p>}
        {lines.length > 0 && (
          <ul className="flex flex-col gap-1">
            {lines.map((line) => (
              <IngredientCard
                key={line.key}
                line={line}
                dish={dish}
                // Library recipes can be reported; the user's own dishes they just edit.
                reportable={dish.source === "library" && dish.ingredients.some((i) => i.key === line.key)}
                reporting={reporting === line.key}
                swapOpen={swapOpen === line.key}
                onUpdate={update}
                onRemove={remove}
                onReport={setReporting}
                onToggleSwap={toggleSwap}
                {...{ t, language, halalMode }}
              />
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-1.5 px-3.5 py-3">
          <label htmlFor="add-ingredient" className="text-meta text-text-muted">
            {t.editor.add}
          </label>
          <input
            id="add-ingredient"
            type="text"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.editor.addPlaceholder}
            className={inputClasses}
          />
          {trimmed && (
            <ul className="flex flex-col rounded-card bg-surface px-3.5 shadow-card">
              {matches.map((key, i) => (
                <li key={key} className={i ? "border-t border-dashed border-divider" : ""}>
                  <button
                    type="button"
                    onClick={() => add(ingredientFromCatalog(key))}
                    className="flex min-h-tap w-full items-center justify-between gap-3 py-2.5 text-left"
                  >
                    <span className="text-body">{displayName(ingredientFromCatalog(key))}</span>
                    {halalMode && INGREDIENTS[key].halal === "non_halal" && <HalalBadge status="non_halal" />}
                  </button>
                </li>
              ))}
              {!exact && (
                <li className={matches.length ? "border-t border-dashed border-divider" : ""}>
                  <button
                    type="button"
                    onClick={() => add(customIngredient(trimmed))}
                    className="flex min-h-tap w-full items-center py-2.5 text-left text-body font-medium"
                  >
                    {t.editor.addCustom(trimmed)}
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      </Group>

      {/* Pinned to the bottom of the sheet while the ingredients scroll. */}
      <div className="sticky bottom-[calc(-1.75rem-env(safe-area-inset-bottom))] -mx-5 -mb-[calc(1.75rem+env(safe-area-inset-bottom))] flex flex-col gap-5 bg-[linear-gradient(to_bottom,var(--surface),var(--bg-top))] px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[0_-8px_16px_rgb(243_242_238/0.9)]">
        <div className="flex flex-col gap-3">
          <Button onClick={save} disabled={!valid || saving}>
            {t.editor.save}
          </Button>
          <Button variant="secondary" onClick={onDone}>
            {t.editor.cancel}
          </Button>
        </div>
        {dish.customized && (
          <button
            type="button"
            onClick={async () => {
              await resetDish(dish.id);
              onDone();
            }}
            className="-my-3 flex min-h-tap items-center justify-center text-xs font-semibold text-accent-deep underline underline-offset-4"
          >
            {t.editor.reset}
          </button>
        )}
      </div>
    </div>
  );
}

function nameIn(language: Language, i: Ingredient) {
  return language === "id" ? (i.localName ?? i.name) : i.name;
}

type CardProps = {
  line: Line;
  dish: Dish;
  reportable: boolean;
  reporting: boolean;
  swapOpen: boolean;
  onUpdate: (key: string, patch: Partial<Line>) => void;
  onRemove: (key: string) => void;
  onReport: (key: string | null) => void;
  onToggleSwap: (key: string) => void;
  t: Strings;
  language: Language;
  halalMode: boolean;
};

/** One ingredient: name, Report and remove, amount and unit, and its halal swap. */
const IngredientCard = memo(function IngredientCard({
  line,
  dish,
  reportable,
  reporting,
  swapOpen,
  onUpdate,
  onRemove,
  onReport,
  onToggleSwap,
  t,
  language,
  halalMode,
}: CardProps) {
  const name = nameIn(language, line);
  const valid = Number(line.qtyText.replace(",", ".")) > 0;
  return (
    <li>
      <Card className="gap-3">
        <div className="flex items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
            <span className="text-body leading-[1.4] font-medium">{name}</span>
            {halalMode && line.halal === "non_halal" && <HalalBadge status="non_halal" />}
            {halalMode && line.halal === "check" && <HalalBadge status="check" label={t.list.checkHalal} />}
          </div>
          {/* 44px tap targets around the small Report link and × (design: 12px text, 18px icon). */}
          <div className="-my-3 -mr-3.5 flex shrink-0 items-center">
            {reportable && !reporting && (
              <button
                type="button"
                onClick={() => onReport(line.key)}
                className="min-h-tap px-1 text-xs leading-[1.35] font-semibold text-accent-deep underline underline-offset-2"
              >
                {t.report.action}
              </button>
            )}
            <button
              type="button"
              aria-label={t.editor.remove(name)}
              onClick={() => onRemove(line.key)}
              className="grid size-tap place-items-center"
            >
              <CloseIcon size={18} />
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor={`qty-${line.key}`}>
            {t.editor.amountFor(name)}
          </label>
          <input
            id={`qty-${line.key}`}
            inputMode="decimal"
            value={line.qtyText}
            onChange={(e) => onUpdate(line.key, { qtyText: e.target.value })}
            aria-invalid={!valid}
            className={`${inputClasses} min-w-0 flex-1 tabular-nums`}
          />
          <label className="sr-only" htmlFor={`unit-${line.key}`}>
            {t.editor.unitFor(name)}
          </label>
          <div className="relative w-[5.625rem] shrink-0">
            <select
              id={`unit-${line.key}`}
              value={line.unit}
              onChange={(e) => onUpdate(line.key, { unit: e.target.value })}
              className={selectClasses}
            >
              {[...new Set([...UNITS, line.unit])].map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <ChevronDownIcon size={18} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-text-muted" />
          </div>
        </div>
        {reporting && <ReportIngredient dish={dish} line={line} name={name} t={t} onClose={() => onReport(null)} />}
        {halalMode && line.halal === "non_halal" && SWAP_RULES.has(line.key) && (
          <SwapControls
            dish={dish}
            line={line}
            open={swapOpen}
            onToggle={() => onToggleSwap(line.key)}
            t={t}
            language={language}
          />
        )}
      </Card>
    </li>
  );
});

/** Swap / change / undo for one non-halal line. Choices save immediately. */
function SwapControls({
  dish,
  line,
  open,
  onToggle,
  t,
  language,
}: {
  dish: Dish;
  line: Ingredient;
  open: boolean;
  onToggle: () => void;
  t: Strings;
  language: Language;
}) {
  const rule = SWAP_RULES.get(line.key)!;
  const choice = dish.swaps?.[line.key];
  const option = rule.options.find((o) => o.id === choice);
  const label = (i: Ingredient) => (language === "id" ? (i.localName ?? i.name) : i.name);
  const summary = option
    ? option.lines.length
      ? replacementLines(line, option)
          .map((l) => `${label(l)} ${formatQty(l.qty, l.unit, 1, t, language)}`)
          .join(" + ")
      : t.swap.omit
    : choice === "keep"
      ? t.swap.kept
      : null;

  return (
    <div className={`flex flex-col gap-2 rounded-row bg-[linear-gradient(to_right,#f5f5f3,#ede6dc_50%,#f5f5f3)] px-3 pt-1 ${open ? "pb-3" : "pb-1"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm">
          {option ? (
            <>
              {t.swap.tag}: {summary}
            </>
          ) : (
            (summary ?? rule.role)
          )}
        </span>
        <span className="flex shrink-0 gap-1">
          {option && (
            <button
              type="button"
              onClick={() => clearSwapChoice(dish, line.key)}
              className="min-h-tap px-1.5 text-sm text-text-muted underline underline-offset-4"
            >
              {t.swap.undo}
            </button>
          )}
          <button
            type="button"
            aria-expanded={open}
            onClick={onToggle}
            className="min-h-tap px-1.5 text-sm underline underline-offset-4"
          >
            {t.swap.swap}
          </button>
        </span>
      </div>
      {open && (
        <>
          <SwapPicker
            original={line}
            rule={rule}
            value={choice ?? rule.options[0].id}
            onChange={(v) => setSwapChoices(dish, { [line.key]: v })}
            factor={1}
            name={`edit-${dish.id}-${line.key}`}
            t={t}
            language={language}
          />
          <p className="text-xs text-text-muted">{t.swap.disclaimer}</p>
        </>
      )}
    </div>
  );
}
