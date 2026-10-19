"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import listOff from "@/assets/tabs/list-off.svg";
import list from "@/assets/tabs/list.svg";
import planOff from "@/assets/tabs/plan-off.svg";
import plan from "@/assets/tabs/plan.svg";
import shopOff from "@/assets/tabs/shop-off.svg";
import shop from "@/assets/tabs/shop.svg";
import { getStrings } from "@/lib/strings";

const tabs = [
  { href: "/plan", key: "plan", on: plan, off: planOff },
  { href: "/list", key: "list", on: list, off: listOff },
  { href: "/shop", key: "shop", on: shop, off: shopOff },
] as const;

/** Plan / List / Shop pill. Sits inside the screen's Footer, under its main action. */
export function TabBar() {
  const pathname = usePathname();
  const t = getStrings().tabs;

  return (
    <nav aria-label={t.label} className="flex h-15 rounded-pill bg-fill-muted p-1">
      {tabs.map(({ href, key, on, off }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-pill text-[0.9375rem] font-medium ${
              active ? "bg-surface text-text-strong shadow-button" : "text-text-quiet"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, precached for offline */}
            <img src={(active ? on : off).src} alt="" width={24} height={24} />
            {t[key]}
          </Link>
        );
      })}
    </nav>
  );
}
