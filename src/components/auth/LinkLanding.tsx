"use client";

import Link from "next/link";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { buttonClasses } from "@/components/ui/Button";
import type { Strings } from "@/lib/strings";

/**
 * Where the email link lands. The tab that asked for the link finishes the
 * sign-in by itself; this page reports the result, including the
 * "opened on another device" case (wireframe LinkExpired variant).
 */
export function LinkLanding({ t }: { t: Strings }) {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const status = (signIn.emailLink.verification ?? signUp.verifications.emailLinkVerification)?.status;

  if (!status) return <p role="status" className="text-body text-text-muted">{t.auth.linkChecking}</p>;

  if (status === "client_mismatch") {
    return (
      <>
        <h1 className="font-display text-2xl leading-tight font-semibold">{t.auth.otherDeviceTitle}</h1>
        <p className="text-sm text-text-muted">{t.auth.otherDeviceHint}</p>
        <Link href="/sign-in" className={buttonClasses()}>
          {t.auth.send}
        </Link>
      </>
    );
  }

  if (status === "expired" || status === "failed") {
    return (
      <>
        <h1 className="font-display text-2xl leading-tight font-semibold">{t.auth.expiredTitle}</h1>
        <Link href="/sign-in" className={buttonClasses()}>
          {t.auth.sendNew}
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-2xl leading-tight font-semibold">{t.auth.linkDone}</h1>
      <Link href="/plan" className={buttonClasses()}>
        {t.auth.goToPlan}
      </Link>
    </>
  );
}
