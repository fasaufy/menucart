"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { AUTH_ENABLED, useAccount } from "@/lib/account";
import { db } from "@/lib/db";
import { useMeta } from "@/lib/hooks";
import { isEmail, stashEmail } from "@/lib/signin";
import type { Strings } from "@/lib/strings";
import { useMountTime } from "@/lib/useMountTime";

// Sign-up is offered at moments of value, never on launch and never as a
// blocker (PRD): at most one prompt per session, "Not now" hides prompts
// for 3 days, guests only.

const SESSION_KEY = "menucart:signup-prompted";
const SNOOZE_DAYS = 3;

function promptedThisSession() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

/** Guest, sign-in configured, and prompts not snoozed. */
function useCanNudge() {
  const account = useAccount();
  const snooze = useMeta("signupSnooze");
  const now = useMountTime();
  return (
    AUTH_ENABLED &&
    account.loaded &&
    !account.signedIn &&
    snooze !== undefined &&
    now > 0 &&
    (snooze === null || snooze.until < now)
  );
}

function snoozePrompts() {
  return db.meta.put({ id: "signupSnooze", until: Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000 });
}

type Variant = "firstList" | "secondWeek";

/**
 * Sheet for the first list (wireframe GuestSave) or when a guest starts
 * planning a second week. `when` is the moment-of-value condition.
 */
export function SignupPromptSheet({ when, variant, t }: { when: boolean; variant: Variant; t: Strings }) {
  const router = useRouter();
  const canNudge = useCanNudge();
  // Read once per mount: showing a sheet marks the session as prompted.
  const [alreadyPrompted] = useState(() => typeof window !== "undefined" && promptedThisSession());
  const [closed, setClosed] = useState(false);
  const [email, setEmail] = useState("");
  const open = when && canNudge && !closed && !alreadyPrompted;
  const copy = variant === "firstList" ? t.auth.prompts.firstList : t.auth.prompts.secondWeek;

  useEffect(() => {
    if (!open) return;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {}
  }, [open]);

  async function notNow() {
    setClosed(true);
    await snoozePrompts();
  }

  return (
    <Sheet open={open} onClose={notNow} labelledBy="signup-prompt-title">
      <h2 id="signup-prompt-title" className="text-xl font-semibold">
        {copy.title}
      </h2>
      <p className="text-sm text-text-muted">{copy.hint}</p>
      <ul className="flex flex-col gap-2">
        {[t.auth.saveBenefit1, t.auth.saveBenefit2, t.auth.saveBenefit3].map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm">
            <CheckIcon size={18} className="mt-px shrink-0" />
            {b}
          </li>
        ))}
      </ul>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!isEmail(email)) return;
          stashEmail(email);
          setClosed(true);
          router.push("/sign-in");
        }}
      >
        <label htmlFor="save-email" className="text-meta text-text-muted">
          {t.auth.email}
        </label>
        <input
          id="save-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-button rounded-row border-[1.5px] border-text bg-surface px-3.5 text-base"
        />
        <Button type="submit" disabled={!isEmail(email)}>
          {copy.cta}
        </Button>
        <Button variant="secondary" onClick={notNow}>
          {t.auth.notNow}
        </Button>
      </form>
    </Sheet>
  );
}

/** Soft banner (not a sheet) in Settings once a guest has planned 5+ dishes. */
export function SignupBanner({ plannedDishes, t }: { plannedDishes: number; t: Strings }) {
  const canNudge = useCanNudge();
  const [dismissed, setDismissed] = useState(false);
  if (!canNudge || dismissed || plannedDishes < 5) return null;
  return (
    <div role="region" aria-label={t.auth.prompts.banner(plannedDishes)} className="flex flex-col gap-2 rounded-card bg-fill-muted p-3.5">
      <p className="text-sm font-semibold">{t.auth.prompts.banner(plannedDishes)}</p>
      <p className="text-meta text-text-muted">{t.auth.prompts.bannerHint}</p>
      <div className="flex gap-2">
        <Link href="/sign-in" className="flex min-h-tap flex-1 items-center justify-center rounded-row bg-text text-sm font-semibold text-surface">
          {t.auth.prompts.secondWeek.cta}
        </Link>
        <button
          type="button"
          onClick={async () => {
            setDismissed(true);
            await snoozePrompts();
          }}
          className="min-h-tap flex-1 rounded-row border border-border-strong bg-surface text-sm font-semibold"
        >
          {t.auth.notNow}
        </button>
      </div>
    </div>
  );
}
