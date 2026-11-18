"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ConsoleShell, Input, type HudNavItem } from "@moonwitness/ui";
import { Crown, SearchIcon } from "@moonwitness/ui/icons";
import { ConsoleCommandPalette } from "@/components/console-command-palette";
import { useSavedAvatar } from "@/lib/avatar-store";
import { buildCsrfLogoutInit } from "@/lib/api/auth";
import { useMetaNavigation } from "@/lib/api/meta-views";
import { clearStoredMidSession } from "@/lib/mid-oidc";
import { useCurrentIdentity } from "@/lib/session";
import { SkinSwitcher } from "@/components/skin-switcher";
import { SanctuaryGateLink } from "@/components/sanctuary-gate-link";
import { activeByPath, navHref, navItems, operationsNavItems } from "./nav-items";
import { Notifications } from "./notifications";
import { ProfileMenu } from "./profile-menu";
import { useActiveSection } from "./use-active-section";

const FOOTER_LEFT = "MOONWITNESS XV /// DIFFERENT PEOPLE. SAME SKY. MANY STORIES.";
const FOOTER_RIGHT = "EMPIRE OF THE LIGHT";

export function ConsoleShellAdapter({
  breadcrumb,
  search,
  onNavigate,
  plane = "creator",
  children,
}: {
  breadcrumb: string;
  search: { value: string; onChange: (v: string) => void; placeholder: string };
  onNavigate?: () => void;
  plane?: "creator" | "operations";
  children: ReactNode;
}) {
  const operations = plane === "operations";
  const staticItems = operations ? operationsNavItems : navItems;
  const session = useCurrentIdentity();
  const items = useMetaNavigation(plane, staticItems, Boolean(session));
  const rootHref = operations ? "/control" : "/";
  const router = useRouter();
  const pathname = usePathname();
  const active = activeByPath(pathname);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  const activeSection = useActiveSection(items, pathname);
  const identity = session?.identity ?? "Creator // Empire";
  const role = session?.role ?? "Empire crew";
  const { seed: avatarSeed } = useSavedAvatar(identity);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function exitShadow() {
    clearStoredMidSession();
    fetch("/api/v1/auth/logout", buildCsrfLogoutInit()).catch(() => {});
    router.push("/");
  }

  const hudItems: HudNavItem[] = items.map((item) => ({
    id: item.id,
    label: item.label,
    iconPath: item.icon,
    href: navHref(item),
    kind: item.target.kind,
  }));

  return (
    <ConsoleShell
      title={breadcrumb}
      brandHref={rootHref}
      subtitle={operations ? "ARSY // Operations Plane" : "Empire of the light"}
      navLabel={operations ? "Operations" : "Empire"}
      items={hudItems}
      active={active}
      activeSection={activeSection}
      onNavigate={() => {
        setNotifOpen(false);
        setProfileOpen(false);
        onNavigate?.();
      }}
      linkAs={Link}
      headerStart={
        <>
          <Crown className="h-4 w-6 text-[var(--blue)]" />
          <Link href={rootHref} className="inline-flex min-h-11 items-center hover:underline">
            <span>{operations ? "Operations" : "The Empire"}</span>
          </Link>
          <span aria-hidden>›</span>
        </>
      }
      headerSearch={
        <div className="relative min-w-0 w-full">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--paper)]" />
          <Input
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder}
            aria-label={search.placeholder}
            className="min-h-11 w-full pl-9"
          />
        </div>
      }
      headerActions={
        <div ref={popRef} className="relative flex items-center gap-1">
          <SkinSwitcher />
          <Notifications
            open={notifOpen}
            onToggle={() => {
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
          />
          <ProfileMenu
            open={profileOpen}
            onToggle={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            identity={identity}
            role={role}
            onExit={exitShadow}
            avatarSeed={avatarSeed}
          />
        </div>
      }
      railFooter={
        operations ? (
          <div className="font-mono text-[10px] leading-relaxed text-[var(--muted-foreground)]">
            <strong className="text-[var(--primary)]">OPERATIONS CONSOLE</strong>
            <div>WEB → API → ARSY PLANE</div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 font-mono text-[10px] tracking-wider">
            <SanctuaryGateLink className="flex min-h-9 items-center justify-between border border-[var(--border)] px-2.5 py-1 text-[var(--primary)] transition-colors hover:border-[var(--primary)] hover:text-[var(--foreground)]">
              <span>IMPERIUM GATE</span>
              <span aria-hidden="true">↗</span>
            </SanctuaryGateLink>
            <Link
              href="/moonwitness"
              className="flex min-h-9 items-center justify-between border border-[var(--border)] px-2.5 py-1 text-[var(--foreground)] transition-colors hover:border-[var(--primary)]"
            >
              <span>MOONWITNESS</span>
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        )
      }
      commandLeft={
        operations ? "MOONWITNESS OPERATIONS /// HOST, NETWORK & STORAGE PLANE" : FOOTER_LEFT
      }
      commandRight={
        <>
          <Crown className="h-3 w-5 text-[var(--primary)]" />{" "}
          {operations ? "ARSY CONTROL PLANE" : FOOTER_RIGHT}
        </>
      }
    >
      <ConsoleCommandPalette plane={plane} />
      {children}
    </ConsoleShell>
  );
}
