"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { clearLocalData, db } from "@/lib/db";
import type { Strings } from "@/lib/strings";

/**
 * Sign out asks "Keep this week's list on this phone?" so a shopper isn't
 * left with nothing mid-trip (PRD). Only rendered when signed in, so the
 * Clerk provider is present.
 */
export function SignOutButton({ t }: { t: Strings }) {
  const { signOut } = useClerk();
  const router = useRouter();
  const [asking, setAsking] = useState(false);

  async function finish(keep: boolean) {
    if (!keep) await clearLocalData();
    // A deliberate sign-out: don't greet them with "session expired" afterwards.
    else await db.meta.delete("lastUser");
    await signOut();
    router.replace(keep ? "/plan" : "/");
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setAsking(true)}>
        {t.settings.signOut}
      </Button>
      <Sheet open={asking} onClose={() => setAsking(false)} labelledBy="sign-out-title">
        <h2 id="sign-out-title" className="text-xl font-semibold">
          {t.settings.signOutTitle}
        </h2>
        <p className="text-sm text-text-muted">{t.settings.signOutHint}</p>
        <div className="flex flex-col gap-2">
          <Button onClick={() => finish(true)}>{t.settings.keepAndSignOut}</Button>
          <Button variant="secondary" onClick={() => finish(false)}>
            {t.settings.clearAndSignOut}
          </Button>
          <Button variant="secondary" onClick={() => setAsking(false)}>
            {t.settings.cancel}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
