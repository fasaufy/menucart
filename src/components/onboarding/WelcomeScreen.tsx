"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import plate from "@/assets/plate.webp";
import { buttonClasses } from "@/components/ui/Button";
import { useAccount } from "@/lib/account";
import { useMeta, useSettings } from "@/lib/hooks";
import { getStrings } from "@/lib/strings";

/** "/" for new visitors. Returning guests and signed-in users go straight to the planner. */
export function WelcomeScreen() {
  const router = useRouter();
  const account = useAccount();
  const onboarded = useMeta("onboarded");
  const t = getStrings(useSettings()?.language);
  const returning = !!onboarded || (account.loaded && account.signedIn);

  useEffect(() => {
    if (returning) router.replace("/plan");
  }, [returning, router]);

  // Wait for the device flags so returning users don't see a flash of Welcome.
  // Don't wait for Clerk: offline it never loads, and a guest can start without it.
  if (onboarded === undefined || returning) return null;

  return (
    <main className="flex flex-1 flex-col bg-[radial-gradient(130%_95%_at_20%_100%,#f2eee7_0%,#f7fbfe_80%,#dee9ef_100%)]">
      <div className="flex flex-1 flex-col gap-6 px-5 pt-16 pb-6">
        <div aria-hidden="true" className="flex h-[350px] items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- static asset, precached for offline */}
          <img src={plate.src} alt="" width={323} height={306} className="-translate-x-[3px]" />
        </div>
        <div className="flex flex-col gap-3 text-center">
          <h1 className="font-display text-[1.75rem] leading-[1.2] font-semibold tracking-[-0.02em]">{t.welcome.title}</h1>
          <p className="text-body text-text-muted">{t.welcome.body}</p>
        </div>
      </div>
      <div className="flex flex-col gap-5 px-5 pt-3 pb-[calc(1.75rem+env(safe-area-inset-bottom))]">
        <div className="flex flex-col gap-2">
          <Link href="/sign-in" className={buttonClasses()}>
            {t.welcome.email}
          </Link>
          <Link href="/onboarding" className={buttonClasses("secondary")}>
            {t.welcome.guest}
          </Link>
        </div>
        <p className="text-center text-xs text-text-muted">{t.welcome.note}</p>
      </div>
    </main>
  );
}
