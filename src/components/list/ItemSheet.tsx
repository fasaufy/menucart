"use client";

import { useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card, Group, rowDivider } from "@/components/ui/Group";
import { HalalBadge } from "@/components/ui/HalalBadge";
import { inputClasses, sheetTitleClasses } from "@/components/ui/Input";
import { Sheet, SheetClose } from "@/components/ui/Sheet";
import { setItemNote, setUserPrice } from "@/lib/list/actions";
import { stallOf } from "@/lib/list/stalls";
import { formatAmount } from "@/lib/list/units";
import { formatRupiah, parseRupiah, rupiahNumber } from "@/lib/money";
import { checkPrice, linePrice, quoteItem, type WeekMoney } from "@/lib/prices/price";
import type { Strings } from "@/lib/strings";
import type { City, Language, ListItem } from "@/lib/types";
import { localeFor } from "@/lib/week";
import { dishAmounts, formatBuy, itemNames, lineMoney, sourceLabel, usesText } from "./format";

export type ItemSheetMode = "details" | "price";

type Props = {
  item: ListItem | null;
  mode: ItemSheetMode;
  weekId: string;
  city: City;
  money: WeekMoney;
  t: Strings;
  language: Language;
  onMode: (mode: ItemSheetMode) => void;
  onCantFind: (key: string) => void;
  onClose: () => void;
};

/** Tapping a list line: what to buy and why, where the price comes from, and "Paid a different price?" (P6, E2). */
export function ItemSheet(props: Props) {
  return (
    <Sheet open={!!props.item} onClose={props.onClose} labelledBy="item-sheet-title">
      {props.item &&
        (props.mode === "price" ? (
          <EditPrice key={`${props.item.key}-price`} {...props} item={props.item} />
        ) : (
          <Details key={`${props.item.key}-details`} {...props} item={props.item} />
        ))}
    </Sheet>
  );
}

function Title({ item, t, language, onClose, children }: { item: ListItem; t: Strings; language: Language; onClose: () => void; children?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col items-start gap-1">
        <h2 id="item-sheet-title" className={sheetTitleClasses}>
          {itemNames(item, language).primary}
        </h2>
        <p className="text-sm text-text-muted">{t.stalls[stallOf(item)]}</p>
        {children}
      </div>
      <SheetClose label={t.sheet.close} onClick={onClose} />
    </div>
  );
}

/** Label over value, split by dashed rules: the info card on the board. */
function InfoRow({ label, children, divided }: { label: string; children: ReactNode; divided?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 py-3 ${divided ? rowDivider : ""}`}>
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-body leading-[1.4] font-medium">{children}</span>
    </div>
  );
}

function Details({ item, weekId, city, t, language, onMode, onCantFind, onClose }: Props & { item: ListItem }) {
  const money = lineMoney(item, city, t, language);
  const price = linePrice(item, city);
  const locale = localeFor(language);
  const [note, setNote] = useState(item.note ?? "");
  const saveNote = () => note.trim() !== (item.note ?? "") && setItemNote(weekId, item.key, note);
  // "Capcay 200 g, Tahu tek 200 g", or just the dishes when amounts aren't recorded.
  const used = dishAmounts(item, t, language)?.join(", ") ?? usesText(item, t, Infinity);

  return (
    <>
      <Title item={item} t={t} language={language} onClose={onClose} />
      <Card className="py-0">
        <InfoRow label={t.budget.toBuy}>
          {[money.unit ?? (money.price && formatRupiah(money.price.cost)), money.amount].filter(Boolean).join(" · ") ||
            item.amounts.map((a) => formatAmount(a, t.units, locale)).join(" + ")}
        </InfoRow>
        {used && (
          <InfoRow label={t.item.usedIn} divided>
            {used}
          </InfoRow>
        )}
        <InfoRow label={t.item.price} divided>
          {price ? `${formatRupiah(price.cost, { estimated: price.estimated })} · ${sourceLabel(price.source, t, language)}` : t.item.noPrice}
        </InfoRow>
      </Card>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t.item.note}</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={saveNote}
          placeholder={t.item.notePlaceholder}
          maxLength={120}
          enterKeyHint="done"
          className={inputClasses}
        />
      </label>

      <div className="flex flex-col gap-2">
        <Button
          onClick={async () => {
            await saveNote();
            onMode("price");
          }}
        >
          {price ? t.item.paidDifferent : t.item.addPrice}
        </Button>
        {item.state === "to_buy" && (
          <Button
            variant="secondary"
            onClick={async () => {
              await saveNote();
              onCantFind(item.key);
            }}
          >
            {t.cantFind.action}
          </Button>
        )}
      </div>
    </>
  );
}

function EditPrice({ item, weekId, city, money, t, language, onClose }: Props & { item: ListItem }) {
  const quote = quoteItem(item, city);
  const estimate = quote?.cost;
  const current = linePrice(item, city);
  const [text, setText] = useState(item.userPrice ? rupiahNumber(item.userPrice) : "");
  const [confirmed, setConfirmed] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const amount = parseRupiah(text);
  const check = estimate && !confirmed ? checkPrice(amount, estimate) : undefined;
  // The week's spend with this line at the typed price (only lines that count).
  const counts = item.state === "to_buy" || item.state === "bought";
  const total = money.spend - (counts ? (current?.cost ?? 0) : 0) + (counts ? amount : 0);
  const what = quote
    ? quote.buy.loose
      ? lineMoney(item, city, t, language).amount
      : formatBuy(quote.buy, t)
    : item.amounts.map((a) => formatAmount(a, t.units, localeFor(language))).join(" + ");

  async function save(price: number | undefined) {
    await setUserPrice(weekId, item.key, price);
    onClose();
  }

  return (
    <>
      <Title item={item} t={t} language={language} onClose={onClose}>
        {check && <HalalBadge t={t} status="non_halal" label={check.tooHigh ? t.editPrice.higher : t.editPrice.lower} />}
      </Title>

      <Group>
        <label htmlFor="paid-price" className="flex flex-col gap-0.5 px-3.5 pt-3 pb-2">
          <span className="text-body font-medium">{t.editPrice.question}</span>
          {what && <span className="text-xs text-text-muted">{t.editPrice.forAmount(what)}</span>}
        </label>
        <div className={`${inputClasses} flex items-center gap-2 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent`}>
          <span aria-hidden="true" className="text-body text-text-muted">
            Rp
          </span>
          <input
            ref={input}
            id="paid-price"
            data-autofocus
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="done"
            aria-label={t.editPrice.field}
            value={text}
            onChange={(e) => {
              const n = Math.min(parseRupiah(e.target.value), 99_999_999);
              setText(n ? rupiahNumber(n) : "");
              setConfirmed(false);
            }}
            placeholder={estimate ? rupiahNumber(estimate) : "0"}
            className="min-w-0 flex-1 bg-transparent text-lg font-semibold tabular-nums outline-none placeholder:font-normal placeholder:text-text-muted/60"
          />
        </div>
      </Group>

      <Card className="py-0">
        {estimate !== undefined && quote && (
          <InfoRow label={t.editPrice.estimate}>
            {formatRupiah(estimate, { estimated: true })} · {sourceLabel(quote.source, t, language)}
          </InfoRow>
        )}
        {check ? (
          <InfoRow label={t.editPrice.check} divided={estimate !== undefined}>
            {check.tooHigh
              ? t.editPrice.checkHigh(formatRupiah(amount), Math.round(check.ratio))
              : t.editPrice.checkLow(formatRupiah(amount), formatRupiah(estimate!))}
            {check.suggestion && ` ${t.editPrice.didYouMean(formatRupiah(check.suggestion))}`}
          </InfoRow>
        ) : (
          amount > 0 &&
          counts && (
            <InfoRow label={t.editPrice.thisWeek} divided={estimate !== undefined}>
              {t.editPrice.replaces(formatRupiah(total))}
            </InfoRow>
          )
        )}
      </Card>

      <div className="flex flex-col gap-2">
        {check ? (
          <>
            <Button
              variant="secondary"
              onClick={() => {
                if (check.suggestion) setText(rupiahNumber(check.suggestion));
                input.current?.focus();
              }}
            >
              {t.editPrice.fix}
            </Button>
            <Button
              onClick={() => {
                setConfirmed(true);
                save(amount);
              }}
            >
              {t.editPrice.confirm(formatRupiah(amount))}
            </Button>
          </>
        ) : (
          <>
            {item.userPrice !== undefined && (
              <Button variant="secondary" onClick={() => save(undefined)}>
                {t.editPrice.reset}
              </Button>
            )}
            <Button disabled={amount <= 0} onClick={() => save(amount)}>
              {t.editPrice.save}
            </Button>
          </>
        )}
        <p className="text-center text-xs text-text-muted">{t.editPrice.footnote}</p>
      </div>
    </>
  );
}
