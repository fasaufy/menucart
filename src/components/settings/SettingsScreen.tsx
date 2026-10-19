"use client";

import Link from "next/link";
import { useState } from "react";
import { AccountSection, ReportsSection } from "@/components/settings/AccountSection";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { Footer } from "@/components/ui/Footer";
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
      <header className="flex flex-col gap-5 px-5 pt-10 pb-2">
        <BackButton label={t.settings.back} />
        <h1 className="font-display text-2xl leading-tight font-semibold">{t.settings.title}</h1>
      </header>

      <div className="flex flex-col gap-3 px-5 pt-3 pb-6">
        <SettingsFields value={draft} onChange={setDraft} t={t} />
        <AccountSection t={t} />
        <ReportsSection t={t} />
        <nav aria-label={`${t.legal.terms} · ${t.legal.privacy}`} className="flex justify-center gap-4 pt-3 text-sm font-semibold text-accent-deep">
          <Link href="/terms" className="min-h-tap content-center underline underline-offset-4">
            {t.legal.terms}
          </Link>
          <Link href="/privacy" className="min-h-tap content-center underline underline-offset-4">
            {t.legal.privacy}
          </Link>
        </nav>
      </div>

      <Footer>
        <Button onClick={save}>{justSaved ? t.settings.saved : t.settings.save}</Button>
      </Footer>
    </>
  );
}
