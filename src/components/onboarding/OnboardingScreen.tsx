"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SettingsFields } from "@/components/settings/SettingsFields";
import { Button } from "@/components/ui/Button";
import { useAccount } from "@/lib/account";
import { DEFAULT_SETTINGS } from "@/lib/db";
import { completeOnboarding } from "@/lib/onboarding";
import { getStrings } from "@/lib/strings";
import type { Settings } from "@/lib/types";
import { toISODate } from "@/lib/week";

export function OnboardingScreen() {
  const router = useRouter();
  const account = useAccount();
  const [draft, setDraft] = useState<Settings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  // Preview the chosen language right away.
  const t = getStrings(draft.language);

  async function start() {
    setSaving(true);
    try {
      // Guests get a sample week so the first list (with a halal swap) is one tap away.
      const guest = account.loaded && !account.signedIn;
      await completeOnboarding(draft, { today: toISODate(new Date()), sample: guest });
      router.replace("/plan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="flex flex-col gap-2 px-5 pt-12 pb-4">
        <h1 className="text-2xl leading-tight font-semibold">{t.onboarding.title}</h1>
        <p className="text-sm text-text-muted">{t.onboarding.hint}</p>
      </header>
      <div className="px-5 pb-6">
        <SettingsFields value={draft} onChange={setDraft} t={t} />
      </div>
      <div className="sticky bottom-0 mt-auto border-t border-divider bg-bg px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <Button onClick={start} disabled={saving || !account.loaded}>
          {t.onboarding.start}
        </Button>
      </div>
    </>
  );
}
