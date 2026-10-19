"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { buttonClasses } from "@/components/ui/Button";
import { AUTH_ENABLED } from "@/lib/account";
import { useSettings } from "@/lib/hooks";
import { getStrings, type Strings } from "@/lib/strings";

/** Shared chrome for the sign-in screens; shows a guest fallback when Clerk isn't configured. */
export function AuthFrame({ back, children }: { back: string; children: (t: Strings) => ReactNode }) {
  const t = getStrings(useSettings()?.language);
  return (
    <>
      <header className="flex px-5 pt-10 pb-2">
        <BackButton href={back} label={t.auth.back} />
      </header>
      <div className="flex flex-1 flex-col gap-4 px-5 pb-[calc(1.75rem+env(safe-area-inset-bottom))]">
        {AUTH_ENABLED ? (
          children(t)
        ) : (
          <>
            <p className="text-body text-text-muted">{t.auth.notSetUp}</p>
            <Link href="/onboarding" className={buttonClasses("secondary")}>
              {t.auth.continueAsGuest}
            </Link>
          </>
        )}
      </div>
    </>
  );
}
