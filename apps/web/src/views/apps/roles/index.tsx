"use client";

import { useState } from "react";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CutoutArtwork,
  SkinOrnament,
} from "@moonwitness/ui";
import { AutoModelConsole } from "@/components/meta/auto-model-console";
import { ConsoleShellAdapter } from "@/components/shell/console-shell-adapter";
import { useTranslation } from "@/hocs/TranslationWrapper";

export function RolesView() {
  const { dictionary } = useTranslation();
  const [search, setSearch] = useState("");

  return (
    <ConsoleShellAdapter
      breadcrumb={dictionary.navigation.roles}
      plane="creator"
      activeOverride="roles"
      search={{
        value: search,
        onChange: setSearch,
        placeholder: dictionary.shell.searchPlaceholder,
      }}
    >
      <div className="space-y-4">
        <Card className="relative overflow-hidden">
          <SkinOrnament slot="corner" className="left-2 top-2" />
          <CutoutArtwork
            id="cipher-wheel"
            decorative
            className="pointer-events-none absolute -right-4 -top-2 hidden h-24 w-24 opacity-20 sm:block"
          />
          <CardHeader>
            <Badge variant="outline" className="w-fit">
              RBAC GROUP HIERARCHY
            </Badge>
            <h1 className="font-semibold leading-none tracking-tight text-lg uppercase">
              {dictionary.apps.rolesTitle}
            </h1>
            <CardDescription>
              Security groups map session roles (<code>viewer</code>, <code>editor</code>,{" "}
              <code>admin</code>) to implied ACL clearances.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3 font-mono text-xs">
            <div className="border border-[var(--border)] bg-[var(--background)] p-3">
              <div className="font-bold text-[var(--primary)]">GROUP_USER (viewer)</div>
              <div className="mt-1 text-[var(--muted-foreground)]">
                Read-only access to public & operational telemetry models.
              </div>
            </div>
            <div className="border border-[var(--border)] bg-[var(--background)] p-3">
              <div className="font-bold text-[var(--primary)]">GROUP_EDITOR (editor)</div>
              <div className="mt-1 text-[var(--muted-foreground)]">
                Create & update records across content, CRM, stock, and CAB models.
              </div>
            </div>
            <div className="border border-[var(--border)] bg-[var(--background)] p-3">
              <div className="font-bold text-[var(--primary)]">GROUP_SYSTEM (admin)</div>
              <div className="mt-1 text-[var(--muted-foreground)]">
                Full DDL/custom field extensibility, addon lifecycle, and RBAC administration.
              </div>
            </div>
          </CardContent>
        </Card>

        <AutoModelConsole
          model="res.groups"
          searchQuery={search}
          domainIcon="ir"
          cutoutId="cipher-wheel"
        />
      </div>
    </ConsoleShellAdapter>
  );
}
export default RolesView;
