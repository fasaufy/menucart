"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ChevronRightIcon, PlanIcon, ShopIcon } from "@/components/icons";
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
    <main className="flex flex-1 flex-col px-5 pt-16 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      {/* Placeholder until the creative director's illustration: week menu → grocery bag. */}
      <div
        aria-hidden="true"
        className="flex aspect-[4/3] items-center justify-center gap-4 rounded-card border border-dashed border-border-strong text-text-muted"
      >
        <PlanIcon size={48} strokeWidth={1.5} />
        <ChevronRightIcon size={28} />
        <ShopIcon size={48} strokeWidth={1.5} />
      </div>
      <div className="flex flex-col gap-3 pt-8">
        <h1 className="text-3xl leading-tight font-semibold">{t.welcome.title}</h1>
        <p className="text-body text-text-muted">{t.welcome.body}</p>
      </div>
      <div className="mt-auto flex flex-col gap-2 pt-8">
        <Link href="/sign-in" className={buttonClasses()}>
          {t.welcome.email}
        </Link>
        <Link href="/onboarding" className={buttonClasses("secondary")}>
          {t.welcome.guest}
        </Link>
        <p className="pt-2 text-center text-xs text-text-muted">{t.welcome.note}</p>
      </div>
    </main>
  );
}
