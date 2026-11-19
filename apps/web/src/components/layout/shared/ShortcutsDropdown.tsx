"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@moonwitness/ui";
import { SimpulNode } from "@moonwitness/ui/icons";
import { useTranslation } from "@/hocs/TranslationWrapper";
import { getLocaleFromPath, getLocalizedUrl } from "@/utils/i18n";

export interface ShortcutItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export function ShortcutsDropdown() {
  const pathname = usePathname();
  const { locale, dictionary } = useTranslation();
  const [open, setOpen] = useState(false);
  const hasLocalePrefix = getLocaleFromPath(pathname) !== null;

  function toHref(target: string, fallback: string): string {
    return hasLocalePrefix ? getLocalizedUrl(target, locale) : fallback;
  }

  const shortcuts: readonly ShortcutItem[] = [
    {
      id: "analytics",
      title: dictionary.navigation.analytics,
      subtitle: "Performance & CAB",
      href: toHref("/dashboards/analytics", "/mission-control"),
    },
    {
      id: "crm",
      title: dictionary.navigation.crm,
      subtitle: "Partners & Leads",
      href: toHref("/dashboards/crm", "/addons?model=crm.lead"),
    },
    {
      id: "logistics",
      title: dictionary.navigation.logistics,
      subtitle: "Stock & Geo",
      href: toHref("/dashboards/logistics", "/addons?model=stock.move"),
    },
    {
      id: "invoice",
      title: dictionary.navigation.invoice,
      subtitle: "Double-Entry Ledger",
      href: toHref("/apps/invoice", "/addons?model=account.move"),
    },
    {
      id: "academy",
      title: dictionary.navigation.academy,
      subtitle: "Witness 9-Mod & Mizan",
      href: toHref("/apps/academy", "/codex"),
    },
    {
      id: "addons",
      title: dictionary.navigation.addons,
      subtitle: "25 Modules / 50+ Models",
      href: toHref("/apps/addons", "/addons"),
    },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          aria-label="Workspace shortcuts"
          aria-expanded={open}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md p-2 text-[var(--foreground)] hover:bg-[var(--muted)]"
        >
          <SimpulNode className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        aria-label={dictionary.shell.shortcuts}
        className="w-80 p-3"
      >
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="font-brush text-sm text-[var(--primary)]">
            {dictionary.shell.shortcuts}
          </span>
          <span className="font-mono text-[10px] text-[var(--muted-foreground)]">25 ADDONS</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {shortcuts.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setOpen(false)}
              className="border border-[var(--border)] bg-[var(--card)] p-2.5 transition-colors hover:border-[var(--primary)]"
            >
              <div className="font-mono text-xs font-bold text-[var(--foreground)]">
                {item.title}
              </div>
              <div className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">
                {item.subtitle}
              </div>
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
export default ShortcutsDropdown;
