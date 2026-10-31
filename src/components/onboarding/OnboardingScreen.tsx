"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BudgetFields, KitchenFields } from "@/components/settings/SettingsFields";
import { Button } from "@/components/ui/Button";
import { Footer } from "@/components/ui/Footer";
import { useAccount } from "@/lib/account";
import { DEFAULT_SETTINGS } from "@/lib/db";
import { useMeta } from "@/lib/hooks";
import { completeOnboarding } from "@/lib/onboarding";
import { getStrings } from "@/lib/strings";
import type { Language, Settings } from "@/lib/types";
import { toISODate } from "@/lib/week";

const STEPS = 2;
/** Step 2 has its own history entry, so the phone's back button returns to step 1. */
const BUDGET_HASH = "#budget";

export function OnboardingScreen() {
  const router = useRouter();
  const account = useAccount();
  const [draft, setDraft] = useState<Settings>(DEFAULT_SETTINGS);
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const onboarded = useMeta("onboarded");

  // Signed in on a new device: the account's settings arrive by sync, so skip setup.
  useEffect(() => {
    if (account.loaded && account.signedIn && onboarded && !saving) router.replace("/plan");
  }, [account, onboarded, saving, router]);

  useEffect(() => {
    const sync = () => setStep(location.hash === BUDGET_HASH ? 2 : 1);
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  // Preview the chosen language right away.
  const t = getStrings(draft.language);

  function next() {
    history.pushState(null, "", BUDGET_HASH);
    setStep(2);
    window.scrollTo(0, 0);
  }

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
      <header className="flex flex-col gap-6 px-5 pt-12 pb-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-meta font-medium text-text-muted">{t.onboarding.step(step, STEPS)}</p>
          <LanguageSwitch value={draft.language} label={t.onboarding.language} onChange={(language) => setDraft({ ...draft, language })} />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-2xl leading-tight font-semibold">
            {step === 1 ? t.onboarding.title : t.onboarding.budgetTitle}
          </h1>
          <p className="text-sm text-text-muted">{step === 1 ? t.onboarding.hint : t.onboarding.budgetHint}</p>
        </div>
      </header>
      <div className="px-5 pt-3 pb-6">
        {step === 1 ? (
          <KitchenFields value={draft} onChange={setDraft} t={t} />
        ) : (
          <BudgetFields value={draft} onChange={setDraft} t={t} />
        )}
      </div>
      <Footer>
        {step === 1 ? (
          <Button onClick={next}>{t.onboarding.next}</Button>
        ) : (
          <Button onClick={start} disabled={saving}>
            {t.onboarding.start}
          </Button>
        )}
      </Footer>
    </>
  );
}

const LANGUAGES: { id: Language; short: string; name: string }[] = [
  { id: "en", short: "EN", name: "English" },
  { id: "id", short: "ID", name: "Bahasa Indonesia" },
];

/** Compact EN / ID switch in the onboarding header (P1, P2). */
function LanguageSwitch({ value, label, onChange }: { value: Language; label: string; onChange: (language: Language) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-card bg-fill-muted p-1">
      {LANGUAGES.map((l) => {
        const active = l.id === value;
        return (
          <button
            key={l.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={l.name}
            lang={l.id}
            onClick={() => onChange(l.id)}
            // 32px pill on a 40px track; the 44px tap target comes from the padding around it.
            className={`relative h-8 w-16 rounded-xl text-xs font-semibold after:absolute after:-inset-y-1.5 after:inset-x-0 after:content-[''] ${
              active ? "bg-surface text-text-strong shadow-button" : "text-text-quiet"
            }`}
          >
            {l.short}
          </button>
        );
      })}
    </div>
  );
}
