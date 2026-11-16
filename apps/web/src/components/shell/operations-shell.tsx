"use client";

import type { ReactNode } from "react";
import { operationsNavItems } from "./nav-items";
import { WorkspaceShell } from "./workspace-shell";

/** Operations-plane shell separating host/network administration from Creator Studio navigation. */
export function OperationsShell({
  breadcrumb,
  search,
  children,
}: {
  breadcrumb: string;
  search: { value: string; onChange: (v: string) => void; placeholder: string };
  children: ReactNode;
}) {
  return (
    <WorkspaceShell
      breadcrumb={breadcrumb}
      search={search}
      items={operationsNavItems}
      brandHref="/control"
      subtitle="ARSY // Operations Plane"
      navLabel="Operations"
      rootLabel="Operations"
      rootHref="/control"
      accentColor="blue"
      sidebarFooter={
        <div className="border-2 border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 font-mono text-[10px] leading-relaxed text-zinc-400">
          <div className="font-bold tracking-widest text-[var(--blue)]">OPERATIONS CONSOLE</div>
          <div className="mt-1 text-zinc-500">WEB → API → ARSY PLANE</div>
        </div>
      }
      footerLeft="MOONWITNESS OPERATIONS /// HOST, NETWORK & STORAGE PLANE"
      footerRight="ARSY CONTROL PLANE"
    >
      {children}
    </WorkspaceShell>
  );
}
