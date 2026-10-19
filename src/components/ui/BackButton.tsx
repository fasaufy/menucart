"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons";

const classes =
  "flex h-10 shrink-0 items-center gap-1 self-start rounded-pill border border-border bg-surface pr-4 pl-2 text-[0.9375rem] font-semibold shadow-button";

/** "‹ Back" pill. With `href` it is a link; otherwise it goes back in history (or to `fallback`). */
export function BackButton({ label, href, fallback = "/plan" }: { label: string; href?: string; fallback?: string }) {
  const router = useRouter();
  const content = (
    <>
      <ChevronLeftIcon size={14} />
      {label}
    </>
  );
  // A 44px tap target around the 40px pill.
  if (href) {
    return (
      <Link href={href} className={`${classes} my-0.5`}>
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={() => (history.length > 1 ? router.back() : router.push(fallback))}
      className={`${classes} my-0.5`}
    >
      {content}
    </button>
  );
}
