"use client";

import { useEffect, useState } from "react";
import { CheckIcon, CloseIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { useMeta } from "@/lib/hooks";
import { markPlusCardSeen, registerPlusInterest } from "@/lib/plus";
import type { Strings } from "@/lib/strings";

type Props = { where: "settings" | "list"; t: Strings; onClose?: () => void };

/**
 * MenuCart Plus fake door (H4): says plainly it isn't available yet, has no
 * payment or checkout, and only counts who asks for early access.
 */
export function PlusCard({ where, t, onClose }: Props) {
  const plus = useMeta("plus");
  const interested = !!plus?.interestedAt;
  return (
    <section aria-labelledby={`plus-${where}`} className="relative flex flex-col gap-3 rounded-group bg-notice p-4 shadow-float">
      {onClose && (
        <button
          type="button"
          aria-label={t.plus.close}
          onClick={onClose}
          className="absolute top-1 right-1 flex size-11 items-center justify-center text-text-muted"
        >
          <CloseIcon className="size-[18px]" />
        </button>
      )}
      <div className="flex flex-col gap-0.5 pr-8">
        <h2 id={`plus-${where}`} className="font-display text-base leading-tight font-semibold">
          {t.plus.title}
        </h2>
        <p className="text-sm font-semibold">{t.plus.price}</p>
        <p className="text-meta text-text-muted">{t.plus.notYet}</p>
      </div>
      <ul className="flex flex-col gap-1.5">
        {t.plus.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-meta">
            <CheckIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent" />
            {feature}
          </li>
        ))}
      </ul>
      {interested ? (
        <p role="status" className="rounded-card bg-surface px-3.5 py-3 text-meta font-medium">
          {t.plus.thanks}
        </p>
      ) : (
        <Button variant="secondary" onClick={() => void registerPlusInterest(where)}>
          {t.plus.join}
        </Button>
      )}
    </section>
  );
}

/** On the list, once: after the first list is sent. Marked seen as soon as it shows, so it never comes back. */
export function PlusListCard({ t }: { t: Strings }) {
  const plus = useMeta("plus");
  // Kept for this visit once shown; the "seen" flag hides it from then on.
  const [shown, setShown] = useState(false);
  const [closed, setClosed] = useState(false);
  const due = !!plus?.listSentAt && !plus.listCardSeen;
  if (due && !shown) setShown(true);
  useEffect(() => {
    if (shown) void markPlusCardSeen();
  }, [shown]);
  if (!shown || closed) return null;
  return <PlusCard where="list" t={t} onClose={() => setClosed(true)} />;
}
