"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { readPending, useEmailAuth, type Pending } from "@/lib/signin";
import type { Strings } from "@/lib/strings";
import { AuthHeading, Envelope } from "./Envelope";

const RESEND_AFTER = 60;
const SPAM_HINT_AFTER = 30;

/** Wireframe CheckInbox: 6-digit code (or an email link on request), resend after 60 s. */
export function CheckInbox({ t }: { t: Strings }) {
  const router = useRouter();
  const auth = useEmailAuth(router.push);
  const [pending, setPending] = useState<Pending | null | undefined>(undefined);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkSent, setLinkSent] = useState(false);
  // Clock starts on the client: reading it during prerender isn't allowed.
  const [now, setNow] = useState(0);

  useEffect(() => {
    const p = readPending();
    if (!p) router.replace("/sign-in");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage is only readable after mount
    setPending(p);
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [router]);

  if (!pending || !now) return null;
  const elapsed = Math.floor((now - pending.sentAt) / 1000);
  const wait = Math.max(0, RESEND_AFTER - elapsed);

  async function verify(value: string) {
    if (!pending) return;
    setBusy(true);
    setError(null);
    const result = await auth.verifyCode(pending, value);
    setBusy(false);
    if (result.ok) return;
    if (result.reason === "expired") return router.push("/sign-in/expired");
    setCode("");
    setError(result.reason === "wrong_code" ? t.auth.wrongCode : (result.message ?? t.auth.genericError));
  }

  async function resend() {
    if (!pending) return;
    setError(null);
    const result = await auth.resend(pending);
    if (result.ok) setPending(readPending());
    else setError(result.message ?? t.auth.genericError);
  }

  async function link() {
    if (!pending) return;
    setLinkSent(true);
    setError(null);
    const result = await auth.sendLinkAndWait(pending);
    if (result.ok) return;
    setLinkSent(false);
    if (result.reason === "expired") router.push("/sign-in/expired");
    else setError(result.message ?? t.auth.genericError);
  }

  return (
    <>
      <div className="flex flex-col gap-6 pt-12">
        <Envelope opened />
        <AuthHeading title={t.auth.inboxTitle}>
          <p className="text-sm text-text-muted">{t.auth.inboxHint(pending.email)}</p>
          <Link
            href="/sign-in"
            className="flex min-h-tap items-center self-center text-sm font-semibold text-accent-deep underline underline-offset-4"
          >
            {t.auth.wrongEmail}
          </Link>
        </AuthHeading>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="code" className="text-meta text-text-muted">
          {t.auth.code}
        </label>
        {/* One real input (so SMS/email autofill works) over six drawn boxes. */}
        <div className="relative flex h-13 gap-1 rounded-card bg-surface p-1 shadow-card">
          {Array.from({ length: 6 }, (_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`grid flex-1 place-items-center rounded-xl bg-[#f8f8f8] text-2xl font-medium tabular-nums shadow-[inset_0_1px_4px_rgb(0_0_0/0.04)] ${
                i === code.length && !busy ? "ring-1 ring-accent" : ""
              }`}
            >
              {code[i] ?? ""}
            </span>
          ))}
          <input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            autoFocus
            disabled={busy}
            value={code}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
              setCode(digits);
              if (digits.length === 6) verify(digits);
            }}
            aria-invalid={!!error}
            aria-describedby="code-help"
            className="absolute inset-0 size-full bg-transparent text-transparent caret-transparent outline-none"
          />
        </div>
        <p id="code-help" role={error ? "alert" : "status"} className={`text-meta ${error ? "text-halal-flag-text" : "text-text-muted"}`}>
          {error ?? (busy ? t.auth.verifying : elapsed >= SPAM_HINT_AFTER ? t.auth.spam : "")}
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-6">
        <Button variant={wait > 0 ? "quiet" : "secondary"} disabled={wait > 0} onClick={resend} className="disabled:opacity-100">
          {wait > 0 ? t.auth.resendIn(wait) : t.auth.resend}
        </Button>
        {linkSent ? (
          <p role="status" className="flex min-h-button items-center justify-center text-center text-sm text-text-muted">
            {t.auth.linkSent}
          </p>
        ) : (
          <Button variant="secondary" onClick={link}>
            {t.auth.linkInstead}
          </Button>
        )}
      </div>
    </>
  );
}
