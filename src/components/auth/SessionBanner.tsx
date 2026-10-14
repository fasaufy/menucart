"use client";

import Link from "next/link";
import { useAccount } from "@/lib/account";
import { useMeta } from "@/lib/hooks";
import type { Strings } from "@/lib/strings";

/**
 * Wireframe SessionExpired: someone who was signed in on this device is now
 * signed out (Clerk's free plan ends sessions after 7 days). The list stays
 * fully usable; we only ask to sign in so it can sync. Never a modal.
 */
export function SessionBanner({ t }: { t: Strings }) {
  const account = useAccount();
  const lastUser = useMeta("lastUser");
  if (!account.loaded || account.signedIn || !lastUser) return null;
  return (
    <div role="status" className="flex items-center justify-between gap-3 bg-fill-muted px-5 py-2">
      <p className="text-sm">{t.auth.expiredBanner}</p>
      <Link href="/sign-in" className="min-h-tap shrink-0 content-center px-1 text-sm font-semibold underline underline-offset-4">
        {t.auth.signIn}
      </Link>
    </div>
  );
}
