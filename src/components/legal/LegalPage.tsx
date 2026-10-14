"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ChevronLeftIcon } from "@/components/icons";
import { useSettings } from "@/lib/hooks";
import { getStrings } from "@/lib/strings";

export type LegalSection = { heading: string; body: ReactNode };

/** Shared layout for Terms and Privacy. Text is a draft until legal review. */
export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: LegalSection[] }) {
  const router = useRouter();
  const t = getStrings(useSettings()?.language);
  return (
    <>
      <header className="flex flex-col gap-2 px-5 pt-10 pb-4">
        <button
          type="button"
          onClick={() => (history.length > 1 ? router.back() : router.push("/"))}
          className="-ml-2 flex min-h-tap items-center gap-0.5 self-start pr-2 text-sm text-text-muted"
        >
          <ChevronLeftIcon size={16} />
          {t.settings.back}
        </button>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-meta text-text-muted">{updated}</p>
        <p role="note" className="rounded-row bg-halal-flag-bg px-3 py-2 text-sm text-halal-flag-text">
          {t.legal.draft}
        </p>
      </header>
      <article className="flex flex-col gap-5 px-5 pb-10 text-body leading-relaxed">
        {sections.map((s) => (
          <section key={s.heading} className="flex flex-col gap-1.5">
            <h2 className="text-base font-semibold">{s.heading}</h2>
            <div className="flex flex-col gap-2 text-text-muted">{s.body}</div>
          </section>
        ))}
      </article>
    </>
  );
}
