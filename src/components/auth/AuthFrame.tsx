"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeftIcon } from "@/components/icons";
import { buttonClasses } from "@/components/ui/Button";
import { AUTH_ENABLED } from "@/lib/account";
import { useSettings } from "@/lib/hooks";
import { getStrings, type Strings } from "@/lib/strings";

/** Shared chrome for the sign-in screens; shows a guest fallback when Clerk isn't configured. */
export function AuthFrame({ back, children }: { back: string; children: (t: Strings) => ReactNode }) {
  const t = getStrings(useSettings()?.language);
  return (
    <>
      <header className="px-5 pt-10 pb-2">
        <Link href={back} className="-ml-2 flex min-h-tap items-center gap-0.5 self-start pr-2 text-sm text-text-muted">
          <ChevronLeftIcon size={16} />
          {t.auth.back}
        </Link>
      </header>
      <div className="flex flex-1 flex-col gap-4 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
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
