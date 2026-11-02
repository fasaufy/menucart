"use client";

import { useState } from "react";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Group, rowDivider } from "@/components/ui/Group";
import { sheetTitleClasses } from "@/components/ui/Input";
import { MessageBubble } from "@/components/ui/MessageBubble";
import { Sheet, SheetClose } from "@/components/ui/Sheet";
import { Toggle } from "@/components/ui/Toggle";
import { titipText } from "@/lib/list/share";
import type { Strings } from "@/lib/strings";
import type { City, Language, ListItem } from "@/lib/types";
import { localeFor } from "@/lib/week";

type Props = {
  open: boolean;
  items: ListItem[];
  budget: number;
  city: City;
  t: Strings;
  language: Language;
  onClose: () => void;
};

// The two switches are a per-phone preference, kept between sends.
const PREFS_KEY = "menucart:titip";

function readPrefs(): { rupiahForLoose: boolean; credit: boolean } {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
    // "Dibuat pakai MenuCart" stays off unless turned on.
    return { rupiahForLoose: saved.rupiahForLoose ?? true, credit: saved.credit ?? false };
  } catch {
    return { rupiahForLoose: true, credit: false };
  }
}

/** "Send to whoever shops" (L7): the list as a WhatsApp message, with a preview. */
export function TitipSheet(props: Props) {
  return (
    <Sheet open={props.open} onClose={props.onClose} labelledBy="titip-title">
      <Body {...props} />
    </Sheet>
  );
}

function Body({ items, budget, city, t, language, onClose }: Props) {
  const [prefs, setPrefs] = useState(readPrefs);
  const [copied, setCopied] = useState(false);
  const now = new Date();
  const text = titipText(items, { budget, city, date: now, ...prefs });
  const time = new Intl.DateTimeFormat(localeFor(language), { hour: "2-digit", minute: "2-digit" }).format(now);

  function set(patch: Partial<typeof prefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {}
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Some phone browsers block the clipboard API; the old way still works there.
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.querySelector("dialog[open]")?.append(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      if (!ok) return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="titip-title" className={sheetTitleClasses}>
            {t.titip.action}
          </h2>
          <p className="text-sm text-text-muted">{t.titip.hint}</p>
        </div>
        <SheetClose label={t.sheet.close} onClick={onClose} />
      </div>

      <MessageBubble text={text} time={time} label={t.titip.preview} />

      <Group className="gap-0">
        <Switch
          id="titip-rupiah"
          title={t.titip.rupiah}
          hint={t.titip.rupiahHint}
          checked={prefs.rupiahForLoose}
          onChange={(rupiahForLoose) => set({ rupiahForLoose })}
        />
        <Switch
          id="titip-credit"
          title={t.titip.credit}
          hint={t.titip.creditHint}
          checked={prefs.credit}
          onChange={(credit) => set({ credit })}
          divided
        />
      </Group>

      <div className="flex flex-col gap-2">
        {/* wa.me opens WhatsApp to pick a chat, with the message filled in. */}
        <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener" className={buttonClasses()}>
          {t.titip.send}
        </a>
        <Button variant="secondary" onClick={copy} aria-live="polite">
          {copied ? t.titip.copied : t.titip.copy}
        </Button>
      </div>
    </>
  );
}

function Switch({
  id,
  title,
  hint,
  checked,
  divided,
  onChange,
}: {
  id: string;
  title: string;
  hint: string;
  checked: boolean;
  divided?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className={`flex items-center gap-3 px-3.5 py-3 ${divided ? rowDivider : ""}`}>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span id={`${id}-label`} className="text-body font-medium">
          {title}
        </span>
        <span id={`${id}-hint`} className="text-meta text-text-muted">
          {hint}
        </span>
      </div>
      <Toggle checked={checked} onChange={onChange} labelledBy={`${id}-label`} describedBy={`${id}-hint`} />
    </div>
  );
}
