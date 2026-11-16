"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSavedAvatar } from "@/lib/avatar-store";
import { clearStoredMidSession } from "@/lib/mid-oidc";
import { useCurrentIdentity } from "@/lib/session";
import { Crown } from "@moonwitness/ui/icons";
import { activeByPath, type NavItem } from "./nav-items";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { Notifications } from "./notifications";
import { ProfileMenu } from "./profile-menu";
import { useActiveSection } from "./use-active-section";

export interface WorkspaceShellProps {
  breadcrumb: string;
  search: { value: string; onChange: (v: string) => void; placeholder: string };
  items: NavItem[];
  brandHref?: string;
  subtitle?: string;
  navLabel?: string;
  rootLabel?: string;
  rootHref?: string;
  accentColor?: "pink" | "blue";
  sidebarFooter?: ReactNode;
  footerLeft?: string;
  footerRight?: string;
  children: ReactNode;
}

/** Shared shell container backing Creator (`EmpireShell`) and Operations (`OperationsShell`) workspaces. */
export function WorkspaceShell({
  breadcrumb,
  search,
  items,
  brandHref = "/",
  subtitle = "Empire of the light",
  navLabel = "Empire",
  rootLabel = "The Empire",
  rootHref = "/",
  accentColor = "pink",
  sidebarFooter,
  footerLeft = "MOONWITNESS XV /// DIFFERENT PEOPLE. SAME SKY. MANY STORIES.",
  footerRight = "EMPIRE OF THE LIGHT",
  children,
}: WorkspaceShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const active = activeByPath(pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  const activeSection = useActiveSection(items, pathname);
  const session = useCurrentIdentity();
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
    fetch("/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    router.push("/");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r-2 border-[var(--line)] bg-[var(--panel)] lg:block">
        <Sidebar
          items={items}
          active={active}
          activeSection={activeSection}
          onNavigate={() => setSidebarOpen(false)}
          brandHref={brandHref}
          subtitle={subtitle}
          navLabel={navLabel}
          accentColor={accentColor}
          footerSlot={sidebarFooter}
        />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r-2 border-[var(--line)] bg-[var(--panel)]">
            <Sidebar
              items={items}
              active={active}
              activeSection={activeSection}
              onNavigate={() => setSidebarOpen(false)}
              brandHref={brandHref}
              subtitle={subtitle}
              navLabel={navLabel}
              accentColor={accentColor}
              footerSlot={sidebarFooter}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <Topbar
          breadcrumb={breadcrumb}
          search={search}
          onOpenSidebar={() => setSidebarOpen(true)}
          containerRef={popRef}
          rootLabel={rootLabel}
          rootHref={rootHref}
          notifications={
            <Notifications
              open={notifOpen}
              onToggle={() => {
                setNotifOpen((v) => !v);
                setProfileOpen(false);
              }}
            />
          }
          profileMenu={
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
          }
        />

        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-[var(--line)] px-4 py-3 text-[10px] tracking-wider text-zinc-600">
          <span>{footerLeft}</span>
          <span className="flex items-center gap-2">
            <Crown className="h-3 w-5 text-[var(--yellow)]" /> {footerRight}
          </span>
        </footer>
      </div>
    </div>
  );
}
