"use client";

import { useReverification, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { sheetTitleClasses } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { clearLocalData } from "@/lib/db";
import type { Strings } from "@/lib/strings";

type ConfirmProps = {
  title: string;
  hint: string;
  confirm: string;
  t: Strings;
  onConfirm: () => Promise<void>;
};

function ConfirmDelete({ title, hint, confirm, t, onConfirm }: ConfirmProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-tap items-center self-center text-sm font-semibold text-day-strip underline underline-offset-4"
      >
        {confirm}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} labelledBy="delete-title">
        <div className="flex flex-col gap-2">
          <h2 id="delete-title" className={sheetTitleClasses}>
            {title}
          </h2>
          <p className="text-sm text-text-muted">{hint}</p>
        </div>
        {error && (
          <p role="alert" className="text-sm text-halal-flag-text">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Button
            variant="danger"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await onConfirm();
              } catch (e) {
                setError((e as Error)?.message || t.auth.genericError);
                setBusy(false);
              }
            }}
          >
            {confirm}
          </Button>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            {t.auth.notNow}
          </Button>
        </div>
      </Sheet>
    </>
  );
}

/**
 * PRD: "User deletes their account → confirm, wipe server data, keep nothing
 * on device after sign-out." Clerk may ask the user to confirm it's them first.
 * Needs a connection: the synced copy is deleted on the server first.
 * Needs "Allow users to delete their accounts" on in the Clerk dashboard.
 */
export function DeleteAccount({ t }: { t: Strings }) {
  const router = useRouter();
  const { user } = useUser();
  const deleteUser = useReverification(() => user!.delete());

  return (
    <ConfirmDelete
      title={t.settings.deleteAccountTitle}
      hint={t.settings.deleteAccountHint}
      confirm={t.settings.deleteAccount}
      t={t}
      onConfirm={async () => {
        // Server data first (needs the session), then the Clerk account, then this phone.
        const res = await fetch("/api/account/delete", { method: "POST" });
        if (!res.ok) throw new Error(`Couldn't delete your synced data (${res.status}). Check your connection and try again.`);
        await deleteUser();
        await clearLocalData();
        router.replace("/");
      }}
    />
  );
}

/** Guests: their data only lives on this device. */
export function ClearDevice({ t }: { t: Strings }) {
  const router = useRouter();
  return (
    <ConfirmDelete
      title={t.settings.clearDeviceTitle}
      hint={t.settings.clearDeviceHint}
      confirm={t.settings.clearDevice}
      t={t}
      onConfirm={async () => {
        await clearLocalData();
        router.replace("/");
      }}
    />
  );
}
