"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { AUTH_ENABLED, useAccount } from "@/lib/account";
import { db } from "@/lib/db";
import { useMeta } from "@/lib/hooks";
import { isEmail, stashEmail } from "@/lib/signin";
import { useMountTime } from "@/lib/useMountTime";
import type { Strings } from "@/lib/strings";

const SESSION_KEY = "menucart:signup-prompted";
const SNOOZE_DAYS = 3;

function promptedThisSession() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Wireframe GuestSave: offered to guests at the moment of value (a list
 * exists), never on launch. At most once per session; "Not now" hides it
 * for 3 days.
 */
export function GuestSaveSheet({ hasList, t }: { hasList: boolean; t: Strings }) {
  const router = useRouter();
  const account = useAccount();
  const snooze = useMeta("signupSnooze");
  // Read once per mount: showing the sheet marks the session as prompted.
  const [alreadyPrompted] = useState(() => typeof window !== "undefined" && promptedThisSession());
  const now = useMountTime();
  const [closed, setClosed] = useState(false);
  const [email, setEmail] = useState("");

  const open =
    AUTH_ENABLED &&
    hasList &&
    !closed &&
    !alreadyPrompted &&
    account.loaded &&
    !account.signedIn &&
    snooze !== undefined &&
    now > 0 &&
    (snooze === null || snooze.until < now);

  useEffect(() => {
    if (!open) return;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {}
  }, [open]);

  async function notNow() {
    setClosed(true);
    await db.meta.put({ id: "signupSnooze", until: Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000 });
  }

  return (
    <Sheet open={open} onClose={notNow} labelledBy="guest-save-title">
      <h2 id="guest-save-title" className="text-xl font-semibold">
        {t.auth.saveTitle}
      </h2>
      <p className="text-sm text-text-muted">{t.auth.saveHint}</p>
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
          {t.auth.saveCta}
        </Button>
        <Button variant="secondary" onClick={notNow}>
          {t.auth.notNow}
        </Button>
      </form>
    </Sheet>
  );
}
