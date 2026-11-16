"use client";

import type { ReactNode } from "react";
import { navItems } from "./nav-items";
import { WorkspaceShell } from "./workspace-shell";

export { OperationsShell } from "./operations-shell";

export function EmpireShell({
  breadcrumb,
  search,
  children,
}: {
  breadcrumb: string;
  search: { value: string; onChange: (v: string) => void; placeholder: string };
  children: ReactNode;
}) {
  return (
    <WorkspaceShell breadcrumb={breadcrumb} search={search} items={navItems}>
      {children}
    </WorkspaceShell>
  );
}
