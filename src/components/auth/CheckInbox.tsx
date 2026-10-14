"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MailIcon } from "@/components/icons";
import { readPending, useEmailAuth, type Pending } from "@/lib/signin";
import type { Strings } from "@/lib/strings";

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
      <div className="grid size-14 place-items-center rounded-pill bg-fill-muted">
        <MailIcon size={26} />
      </div>
      <h1 className="text-2xl font-semibold">{t.auth.inboxTitle}</h1>
      <p className="text-sm text-text-muted">{t.auth.inboxHint(pending.email)}</p>
      <Link href="/sign-in" className="flex min-h-tap items-center self-start text-sm underline underline-offset-4">
        {t.auth.wrongEmail}
      </Link>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="code" className="text-meta text-text-muted">
          {t.auth.code}
        </label>
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
          className="h-14 rounded-row border-[1.5px] border-text bg-surface px-4 text-center text-2xl tracking-[0.5em] tabular-nums aria-invalid:border-halal-flag-text"
        />
        <p id="code-help" role={error ? "alert" : "status"} className={`text-meta ${error ? "text-halal-flag-text" : "text-text-muted"}`}>
          {error ?? (busy ? t.auth.verifying : elapsed >= SPAM_HINT_AFTER ? t.auth.spam : "")}
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <button
          type="button"
          disabled={wait > 0}
          onClick={resend}
          className="flex min-h-tap items-center justify-center rounded-card border border-border-strong bg-surface text-body font-medium disabled:text-text-muted"
        >
          {wait > 0 ? t.auth.resendIn(wait) : t.auth.resend}
        </button>
        {linkSent ? (
          <p role="status" className="text-center text-sm text-text-muted">
            {t.auth.linkSent}
          </p>
        ) : (
          <button type="button" onClick={link} className="flex min-h-tap items-center justify-center text-sm underline underline-offset-4">
            {t.auth.linkInstead}
          </button>
        )}
      </div>
    </>
  );
}
