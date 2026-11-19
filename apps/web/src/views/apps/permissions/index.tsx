"use client";

import { useState } from "react";
import {
  Badge,
  Button,
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

export function PermissionsView() {
  const { dictionary } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeModel, setActiveModel] = useState<"ir.rule" | "res.groups" | "audit.log">("ir.rule");

  return (
    <ConsoleShellAdapter
      breadcrumb={dictionary.navigation.permissions}
      plane="creator"
      activeOverride="permissions"
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
            id="hardware-key"
            decorative
            className="pointer-events-none absolute -right-4 -top-2 hidden h-24 w-24 opacity-20 sm:block"
          />
          <CardHeader>
            <Badge variant="outline" className="w-fit">
              MODEL ACL & RECORD RULES
            </Badge>
            <h1 className="font-semibold leading-none tracking-tight text-lg uppercase">
              {dictionary.apps.permissionsTitle}
            </h1>
            <CardDescription>
              Row-level record rules (<code>ir.rule</code>), RBAC group clearances (
              <code>res.groups</code>), and immutable security logs (<code>audit.log</code>).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(
              [
                { id: "ir.rule", label: "Row-Level Record Rules (ir.rule)" },
                { id: "res.groups", label: "RBAC Security Groups (res.groups)" },
                { id: "audit.log", label: "Security Audit Log (audit.log)" },
              ] as const
            ).map((m) => (
              <Button
                key={m.id}
                type="button"
                size="sm"
                variant={activeModel === m.id ? "default" : "outline"}
                onClick={() => setActiveModel(m.id)}
              >
                {m.label}
              </Button>
            ))}
          </CardContent>
        </Card>

        <AutoModelConsole
          model={activeModel}
          searchQuery={search}
          domainIcon="ir"
          cutoutId="hardware-key"
        />
      </div>
    </ConsoleShellAdapter>
  );
}
export default PermissionsView;
