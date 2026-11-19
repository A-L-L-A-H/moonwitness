"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CutoutArtwork,
  SkinOrnament,
} from "@moonwitness/ui";
import { AutoModelConsole } from "@/components/meta/auto-model-console";
import { ConsoleShellAdapter } from "@/components/shell/console-shell-adapter";
import { useTranslation } from "@/hocs/TranslationWrapper";

export function UserListView() {
  const { dictionary } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeModel, setActiveModel] = useState<"auth.user" | "res.partner" | "res.company">(
    "auth.user",
  );

  return (
    <ConsoleShellAdapter
      breadcrumb={dictionary.navigation.users}
      plane="creator"
      activeOverride="users"
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
              IDENTITY & MULTI-TENANCY
            </Badge>
            <CardTitle className="text-lg uppercase">{dictionary.apps.usersTitle}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(
              [
                { id: "auth.user", label: "Platform Operators (auth.user)" },
                { id: "res.partner", label: "Partners & Contacts (res.partner)" },
                { id: "res.company", label: "Company Tenants (res.company)" },
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
export default UserListView;
