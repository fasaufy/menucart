"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { SignupBanner } from "@/components/auth/SignupPrompt";
import { buttonClasses } from "@/components/ui/Button";
import { Card, Group, GroupHeader, rowDivider } from "@/components/ui/Group";
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
    <>
      {!account.signedIn && <SignupBanner plannedDishes={planned} t={t} />}
      <Group className="gap-0 px-3.5 pt-3 pb-1.5">
        <h2 className="text-body font-medium">{t.settings.account}</h2>
        {account.signedIn ? (
          <div className="flex flex-col gap-3 pt-1">
            <div className="flex flex-col gap-0.5">
              <p className="text-meta">{t.settings.signedInAs(account.email ?? "")}</p>
              <p className="text-meta text-text-muted">{t.settings.syncSoon}</p>
            </div>
            <SignOutButton t={t} />
            <DeleteAccount t={t} />
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-1">
            <div className="flex flex-col gap-0.5">
              <p className="text-meta">{t.settings.guest}</p>
              <p className="text-meta text-text-muted">{AUTH_ENABLED ? t.settings.guestHint : t.settings.authOff}</p>
            </div>
            {AUTH_ENABLED && (
              <Link href="/sign-in" className={buttonClasses("secondary")}>
                {t.settings.saveToEmail}
              </Link>
            )}
            <ClearDevice t={t} />
          </div>
        )}
      </Group>
    </>
  );
}

/** Reports saved on this phone, waiting for sync to send them. */
export function ReportsSection({ t }: { t: Strings }) {
  const reports = useLiveQuery(() => db.reports.orderBy("createdAt").reverse().toArray());
  if (!reports?.length) return null;
  return (
    <Group>
      <GroupHeader>
        <h2 className="text-body font-medium">{t.report.yours(reports.length)}</h2>
      </GroupHeader>
      <Card className="py-1">
      <ul className="flex flex-col">
        {reports.map((r, i) => (
          <li key={r.id} className={`flex flex-col gap-0.5 py-2.5 text-sm ${i ? rowDivider : ""}`}>
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
      </Card>
    </Group>
  );
}
