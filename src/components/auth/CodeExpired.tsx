"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, buttonClasses } from "@/components/ui/Button";
import { readPending, useEmailAuth, type Pending } from "@/lib/signin";
import type { Strings } from "@/lib/strings";
import { AuthHeading, Envelope } from "./Envelope";

/** Wireframe LinkExpired: never a dead end; one tap sends a fresh code. */
export function CodeExpired({ t }: { t: Strings }) {
  const router = useRouter();
  const auth = useEmailAuth(router.push);
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage is only readable after mount
    setPending(readPending());
  }, []);

  return (
    <>
      <div className="flex flex-col gap-6 pt-12">
        <Envelope opened />
        <AuthHeading title={t.auth.expiredTitle}>
          {pending && <p className="text-sm text-text-muted">{t.auth.expiredHint(pending.email)}</p>}
        </AuthHeading>
      </div>
      <div className="mt-auto flex flex-col gap-2 pt-6">
        {pending && (
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const result = await auth.resend(pending);
              setBusy(false);
              if (result.ok) router.push("/sign-in/verify");
            }}
          >
            {t.auth.sendNew}
          </Button>
        )}
        <Link href="/sign-in" className={buttonClasses("secondary")}>
          {t.auth.differentEmail}
        </Link>
      </div>
    </>
  );
}
