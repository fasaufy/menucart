"use client";

import type { ReactNode } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { Card, rowDivider } from "@/components/ui/Group";
import { useSettings } from "@/lib/hooks";
import { getStrings } from "@/lib/strings";

export type LegalSection = { heading: string; body: ReactNode };

/** Shared layout for Terms and Privacy. Text is a draft until legal review. */
export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: LegalSection[] }) {
  const t = getStrings(useSettings()?.language);
  return (
    <>
      <header className="flex flex-col gap-2 px-5 pt-10 pb-2">
        <BackButton label={t.settings.back} fallback="/" />
        <h1 className="font-display text-2xl leading-tight font-semibold">{title}</h1>
        <p className="text-meta text-text-muted">{updated}</p>
        <p role="note" className="rounded-row bg-[#fbebd9] px-3 py-2 text-sm text-halal-flag-text">
          {t.legal.draft}
        </p>
      </header>
      <article className="px-5 pt-3 pb-10">
        <Card className="py-0">
          {sections.map((s, i) => (
            <section key={s.heading} className={`flex flex-col gap-1.5 py-3.5 ${i ? rowDivider : ""}`}>
              <h2 className="text-base leading-[1.35] font-semibold">{s.heading}</h2>
              <div className="flex flex-col gap-2 text-body leading-[1.4] text-text-muted">{s.body}</div>
            </section>
          ))}
        </Card>
      </article>
    </>
  );
}
