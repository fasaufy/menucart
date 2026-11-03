"use client";

import { Button } from "@/components/ui/Button";
import { Card, Group, rowDivider } from "@/components/ui/Group";
import { sheetTitleClasses } from "@/components/ui/Input";
import { Sheet, SheetClose } from "@/components/ui/Sheet";
import { replaceItem } from "@/lib/list/actions";
import { formatRupiah } from "@/lib/money";
import { cheaperOptions, type CheaperOption } from "@/lib/prices/cheaper";
import type { Strings } from "@/lib/strings";
import type { City, Language, ListItem } from "@/lib/types";
import { itemNames } from "./format";

type Props = {
  open: boolean;
  /** Lines still to buy; those with a cheaper option are listed. */
  items: ListItem[];
  weekId: string;
  city: City;
  t: Strings;
  language: Language;
  onOpenItem: (key: string) => void;
  onClose: () => void;
};

/** "Over budget · 5 cheaper swaps": each line's best cheaper option, one tap to use it (L6). */
export function SwapsSheet({ open, items, weekId, city, t, language, onOpenItem, onClose }: Props) {
  const swaps = items.flatMap((item) => {
    const [best] = cheaperOptions(item, city);
    return best ? [{ item, best }] : [];
  });
  const total = swaps.reduce((n, s) => n + s.best.saving, 0);
  const nameOf = (o: CheaperOption) => o.lines.map((l) => (language === "id" ? (l.localName ?? l.name) : l.name)).join(" + ");

  return (
    <Sheet open={open} onClose={onClose} labelledBy="swaps-title">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="swaps-title" className={sheetTitleClasses}>
            {t.swaps.title}
          </h2>
          <p className="text-sm text-text-muted">{swaps.length ? t.swaps.hint(formatRupiah(total)) : t.swaps.none}</p>
        </div>
        <SheetClose label={t.sheet.close} onClick={onClose} />
      </div>
      {swaps.length > 0 && (
        <Group>
          <Card className="py-0">
            {swaps.map(({ item, best }, i) => (
              <div key={item.key} className={`flex items-center gap-3 py-3 ${i ? rowDivider : ""}`}>
                {/* Tapping the text opens the line's details, with every option. */}
                <button type="button" onClick={() => onOpenItem(item.key)} className="flex min-h-tap min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
                  <span className="text-body leading-[1.3] font-medium">{nameOf(best)}</span>
                  <span className="text-xs text-text-muted">{t.swaps.instead(itemNames(item, language).primary)}</span>
                  <span className="text-xs font-semibold text-positive tabular-nums">
                    {formatRupiah(best.cost, { estimated: true })} · {t.item.save(formatRupiah(best.saving))}
                  </span>
                </button>
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth={false}
                  className="min-h-tap px-4"
                  onClick={() => replaceItem(weekId, item.key, nameOf(best), best.cost)}
                >
                  {t.swaps.use}
                </Button>
              </div>
            ))}
          </Card>
        </Group>
      )}
    </Sheet>
  );
}
