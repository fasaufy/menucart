"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListIcon, PlanIcon, ShopIcon } from "@/components/icons";
import { getStrings } from "@/lib/strings";

const tabs = [
  { href: "/plan", key: "plan", Icon: PlanIcon },
  { href: "/list", key: "list", Icon: ListIcon },
  { href: "/shop", key: "shop", Icon: ShopIcon },
] as const;

export function TabBar() {
  const pathname = usePathname();
  const t = getStrings().tabs;

  return (
    <nav
      aria-label={t.label}
      className="sticky bottom-0 z-10 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      {tabs.map(({ href, key, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-tab-bar flex-1 flex-col items-center justify-center gap-1 text-xs ${
              active ? "font-semibold text-text" : "text-text-muted"
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
            {t[key]}
          </Link>
        );
      })}
    </nav>
  );
}
