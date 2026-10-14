"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SettingsFields } from "@/components/settings/SettingsFields";
import { Button } from "@/components/ui/Button";
import { useAccount } from "@/lib/account";
import { DEFAULT_SETTINGS } from "@/lib/db";
import { useMeta } from "@/lib/hooks";
import { completeOnboarding } from "@/lib/onboarding";
import { getStrings } from "@/lib/strings";
import type { Settings } from "@/lib/types";
import { toISODate } from "@/lib/week";

export function OnboardingScreen() {
  const router = useRouter();
  const account = useAccount();
  const [draft, setDraft] = useState<Settings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const onboarded = useMeta("onboarded");

  // Signed in on a new device: the account's settings arrive by sync, so skip setup.
  useEffect(() => {
    if (account.loaded && account.signedIn && onboarded && !saving) router.replace("/plan");
  }, [account, onboarded, saving, router]);
  // Preview the chosen language right away.
  const t = getStrings(draft.language);

  async function start() {
    setSaving(true);
    try {
      // Guests get a sample week so the first list (with a halal swap) is one tap away.
      // If Clerk hasn't loaded (offline), treat as a guest.
      const guest = !(account.loaded && account.signedIn);
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
        <Button onClick={start} disabled={saving}>
          {t.onboarding.start}
        </Button>
      </div>
    </>
  );
}
