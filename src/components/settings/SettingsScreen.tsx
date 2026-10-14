"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AccountSection, ReportsSection } from "@/components/settings/AccountSection";
import { ChevronLeftIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { saveSettings } from "@/lib/db";
import { useSettings } from "@/lib/hooks";
import { getStrings } from "@/lib/strings";
import type { Settings } from "@/lib/types";
import { SettingsFields } from "./SettingsFields";

export function SettingsScreen() {
  const saved = useSettings();
  // The editor mounts once settings load, so it can start from them.
  return saved ? <SettingsEditor initial={saved} /> : null;
}

function SettingsEditor({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [justSaved, setJustSaved] = useState(false);
  const t = getStrings(draft.language);

  async function save() {
    await saveSettings(draft);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  }

  return (
    <>
      <header className="flex flex-col gap-2 px-5 pt-10 pb-4">
        <button
          type="button"
          onClick={() => (history.length > 1 ? router.back() : router.push("/plan"))}
          className="-ml-2 flex min-h-tap items-center gap-0.5 self-start pr-2 text-sm text-text-muted"
        >
          <ChevronLeftIcon size={16} />
          {t.settings.back}
        </button>
        <h1 className="text-2xl font-semibold">{t.settings.title}</h1>
      </header>

      <div className="flex flex-col gap-6 px-5 pb-6">
        <SettingsFields value={draft} onChange={setDraft} t={t} />
        <AccountSection t={t} />
        <ReportsSection t={t} />
        <nav aria-label={`${t.legal.terms} · ${t.legal.privacy}`} className="flex justify-center gap-4 text-sm text-text-muted">
          <Link href="/terms" className="min-h-tap content-center underline underline-offset-4">
            {t.legal.terms}
          </Link>
          <Link href="/privacy" className="min-h-tap content-center underline underline-offset-4">
            {t.legal.privacy}
          </Link>
        </nav>
      </div>

      <div className="sticky bottom-0 mt-auto border-t border-divider bg-bg px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <Button onClick={save}>{justSaved ? t.settings.saved : t.settings.save}</Button>
      </div>
    </>
  );
}
