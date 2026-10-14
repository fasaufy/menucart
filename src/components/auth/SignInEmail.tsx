"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { isEmail, takeStashedEmail, useEmailAuth } from "@/lib/signin";
import type { Strings } from "@/lib/strings";

/** Wireframe SignInEmail: one field for both sign-up and sign-in. */
export function SignInEmail({ t }: { t: Strings }) {
  const router = useRouter();
  const auth = useEmailAuth(router.push);
  const [email, setEmail] = useState(() => (typeof window === "undefined" ? "" : takeStashedEmail()));
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const invalid = touched && !isEmail(email);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isEmail(email)) return;
    if (!navigator.onLine) return setError(t.auth.offline);
    setSending(true);
    setError(null);
    const result = await auth.send(email);
    setSending(false);
    if (result.ok) router.push("/sign-in/verify");
    else setError(result.message ?? t.auth.genericError);
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-1 flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t.auth.emailTitle}</h1>
      <p className="text-sm text-text-muted">{t.auth.emailHint}</p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-meta text-text-muted">
          {t.auth.email}
        </label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          aria-invalid={invalid}
          aria-describedby="email-help"
          className="h-button rounded-row border-[1.5px] border-text bg-surface px-3.5 text-base aria-invalid:border-halal-flag-text"
        />
        <p id="email-help" role={invalid || error ? "alert" : undefined} className={`text-meta ${invalid || error ? "text-halal-flag-text" : "text-text-muted"}`}>
          {invalid ? t.auth.invalidEmail : (error ?? t.auth.emailNote)}
        </p>
      </div>
      {/* Clerk's bot protection mounts here for sign-ups. */}
      <div id="clerk-captcha" />
      <div className="mt-auto flex flex-col gap-3">
        <Button type="submit" disabled={sending}>
          {sending ? t.auth.sending : t.auth.send}
        </Button>
        <p className="text-center text-xs text-text-muted">
          {t.auth.agreeBefore}
          <Link href="/terms" className="underline underline-offset-2">
            {t.legal.terms}
          </Link>
          {t.auth.agreeAnd}
          <Link href="/privacy" className="underline underline-offset-2">
            {t.legal.privacy}
          </Link>
          {t.auth.agreeAfter}
        </p>
      </div>
    </form>
  );
}
