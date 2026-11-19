"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
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
          <SkinOrnament slot="corner" className="start-2 top-2" />
          <CutoutArtwork
            id="hardware-key"
            decorative
            className="pointer-events-none absolute -top-2 hidden h-24 w-24 opacity-20 sm:block ltr:-right-4 rtl:-left-4"
          />
          <CardHeader>
            <Badge variant="outline" className="w-fit">
              {dictionary.apps.usersBadge}
            </Badge>
            <h1 className="font-semibold leading-none tracking-tight text-lg uppercase">
              {dictionary.apps.usersTitle}
            </h1>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(
              [
                { id: "auth.user", label: dictionary.apps.usersOperatorsBtn },
                { id: "res.partner", label: dictionary.apps.usersPartnersBtn },
                { id: "res.company", label: dictionary.apps.usersCompaniesBtn },
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
