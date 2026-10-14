"use client";

import { useState } from "react";
import { CloseIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
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

  const keys = new Set(lines.map((l) => l.key));
  const matches = searchIngredients(query).filter((k) => !keys.has(k));
  const trimmed = query.trim();
  const exact = matches.some((k) =>
    [INGREDIENTS[k].name, INGREDIENTS[k].localName].some((n) => n && normalize(n) === normalize(trimmed)),
  );

  const parse = (text: string) => Number(text.replace(",", "."));
  const valid = lines.every((l) => parse(l.qtyText) > 0);

  function update(index: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

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

  const displayName = (i: Ingredient) =>
    language === "id" ? (i.localName ?? i.name) : i.name;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-meta text-text-muted">
        {t.editor.appliesToAll(dish.name)} {t.editor.servings(dish.servings)}
      </p>

      {lines.length === 0 && <p className="text-body text-text-muted">{t.editor.empty}</p>}

      <ul className="flex flex-col divide-y divide-fill-muted rounded-card border border-border bg-surface">
        {lines.map((line, index) => (
          <li key={line.key} className="flex flex-col gap-2 px-3.5 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-col gap-1 pt-1">
                <span className="text-body font-medium">{displayName(line)}</span>
                {halalMode && line.halal === "non_halal" && <HalalBadge status="non_halal" />}
                {halalMode && line.halal === "check" && (
                  <span className="text-xs text-text-muted">{t.list.checkHalal}</span>
                )}
              </div>
              <button
                type="button"
                aria-label={t.editor.remove(displayName(line))}
                onClick={() => setLines((ls) => ls.filter((_, i) => i !== index))}
                className="-mt-1 -mr-2 grid size-tap shrink-0 place-items-center text-text-muted"
              >
                <CloseIcon size={18} />
              </button>
            </div>
            <div className="flex gap-2">
              <label className="sr-only" htmlFor={`qty-${line.key}`}>
                {t.editor.amountFor(displayName(line))}
              </label>
              <input
                id={`qty-${line.key}`}
                inputMode="decimal"
                value={line.qtyText}
                onChange={(e) => update(index, { qtyText: e.target.value })}
                aria-invalid={!(parse(line.qtyText) > 0)}
                className="h-tap w-24 rounded-row border border-border-strong bg-surface px-3 text-body tabular-nums aria-invalid:border-halal-flag-text"
              />
              <label className="sr-only" htmlFor={`unit-${line.key}`}>
                {t.editor.unitFor(displayName(line))}
              </label>
              <select
                id={`unit-${line.key}`}
                value={line.unit}
                onChange={(e) => update(index, { unit: e.target.value })}
                className="h-tap min-w-0 flex-1 rounded-row border border-border-strong bg-surface px-3 text-body"
              >
                {[...new Set([...UNITS, line.unit])].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            {/* Library recipes can be reported; the user's own dishes they just edit. */}
            {dish.source === "library" && dish.ingredients.some((i) => i.key === line.key) && (
              <ReportIngredient dish={dish} line={line} name={displayName(line)} t={t} />
            )}
            {halalMode && line.halal === "non_halal" && SWAP_RULES.has(line.key) && (
              <SwapControls
                dish={dish}
                line={line}
                open={swapOpen === line.key}
                onToggle={() => setSwapOpen((k) => (k === line.key ? null : line.key))}
                t={t}
                language={language}
              />
            )}
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-1.5">
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
          className="h-button rounded-row border border-border-strong bg-surface px-3.5 text-base placeholder:text-text-muted"
        />
        {trimmed && (
          <ul className="flex flex-col divide-y divide-fill-muted rounded-card border border-border bg-surface">
            {matches.map((key) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => add(ingredientFromCatalog(key))}
                  className="flex min-h-tap w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left"
                >
                  <span className="text-body">{displayName(ingredientFromCatalog(key))}</span>
                  {halalMode && INGREDIENTS[key].halal === "non_halal" && <HalalBadge status="non_halal" />}
                </button>
              </li>
            ))}
            {!exact && (
              <li>
                <button
                  type="button"
                  onClick={() => add(customIngredient(trimmed))}
                  className="flex min-h-tap w-full items-center px-3.5 py-2.5 text-left text-body font-medium"
                >
                  {t.editor.addCustom(trimmed)}
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Button onClick={save} disabled={!valid || saving}>
          {t.editor.save}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          {t.editor.cancel}
        </Button>
        {dish.customized && (
          <button
            type="button"
            onClick={async () => {
              await resetDish(dish.id);
              onDone();
            }}
            className="flex min-h-tap items-center justify-center text-sm text-text-muted underline underline-offset-4"
          >
            {t.editor.reset}
          </button>
        )}
      </div>
    </div>
  );
}

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
    <div className="flex flex-col gap-2 rounded-row bg-fill-muted px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm">
          {option ? (
            <>
              <b>{t.swap.tag}:</b> {summary}
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
              className="min-h-tap px-2 text-sm text-text-muted underline underline-offset-4"
            >
              {t.swap.undo}
            </button>
          )}
          <button
            type="button"
            aria-expanded={open}
            onClick={onToggle}
            className="min-h-tap px-2 text-sm font-medium underline underline-offset-4"
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
