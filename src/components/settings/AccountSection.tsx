"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { SignupBanner } from "@/components/auth/SignupPrompt";
import { buttonClasses } from "@/components/ui/Button";
import { AUTH_ENABLED, useAccount } from "@/lib/account";
import { db } from "@/lib/db";
import type { Strings } from "@/lib/strings";
import { ClearDevice, DeleteAccount } from "./DeleteData";
import { SignOutButton } from "./SignOutButton";

export function AccountSection({ t }: { t: Strings }) {
  const account = useAccount();
  const planned = useLiveQuery(() => db.slots.count()) ?? 0;
  if (!account.loaded) return null;

  return (
    <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <h2 className="text-body font-semibold">{t.settings.account}</h2>
      {account.signedIn ? (
        <>
          <p className="text-sm">{t.settings.signedInAs(account.email ?? "")}</p>
          {/* Honest until server sync (step 7) exists. */}
          <p className="text-meta text-text-muted">{t.settings.syncSoon}</p>
          <SignOutButton t={t} />
          <DeleteAccount t={t} />
        </>
      ) : (
        <>
          <SignupBanner plannedDishes={planned} t={t} />
          <p className="text-sm">{t.settings.guest}</p>
          <p className="text-meta text-text-muted">{AUTH_ENABLED ? t.settings.guestHint : t.settings.authOff}</p>
          {AUTH_ENABLED && (
            <Link href="/sign-in" className={buttonClasses("secondary")}>
              {t.settings.saveToEmail}
            </Link>
          )}
          <ClearDevice t={t} />
        </>
      )}
    </section>
  );
}

/** Reports saved on this phone, waiting for sync to send them. */
export function ReportsSection({ t }: { t: Strings }) {
  const reports = useLiveQuery(() => db.reports.orderBy("createdAt").reverse().toArray());
  if (!reports?.length) return null;
  return (
    <section className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
      <h2 className="text-body font-semibold">{t.report.yours(reports.length)}</h2>
      <ul className="flex flex-col divide-y divide-fill-muted">
        {reports.map((r) => (
          <li key={r.id} className="flex flex-col gap-0.5 py-2 text-sm">
            <span>
              {r.dishName} · {r.ingredientName}
            </span>
            <span className="text-xs text-text-muted">
              {t.report.reasons[r.reason]}
              {r.note ? ` · ${r.note}` : ""} · {t.report.waiting}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
