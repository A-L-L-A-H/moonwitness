"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moonwitness/ui";
import { ConsoleShellAdapter } from "@/components/shell/console-shell-adapter";
import { useMetaAddons } from "@/lib/api/meta-views";

export default function AddonsManagerPage() {
  const [search, setSearch] = useState("");
  const { addons, loading, error, toggle } = useMetaAddons();
  const [pendingName, setPendingName] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const visibleAddons = addons.filter((addon) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      addon.name.toLowerCase().includes(q) ||
      addon.category.toLowerCase().includes(q) ||
      addon.description.toLowerCase().includes(q)
    );
  });

  async function handleToggle(name: string, nextEnabled: boolean) {
    setActionError(null);
    setPendingName(name);
    try {
      await toggle(name, nextEnabled);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : `Failed to toggle addon '${name}'`);
    } finally {
      setPendingName(null);
    }
  }

  return (
    <ConsoleShellAdapter
      breadcrumb="Addon Studio"
      plane="operations"
      search={{
        value: search,
        onChange: setSearch,
        placeholder: "Filter installed addons…",
      }}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border border-[var(--border)] bg-[var(--card)] px-4 py-3">
          <div>
            <h1 className="text-base font-bold uppercase tracking-wider">Addon Studio</h1>
            <p className="text-xs text-[var(--muted-foreground)]">
              Toggle workspace addons live without restarting API processes. Schema tables sync via{" "}
              <code>syncModels()</code>.
            </p>
          </div>
          <Link
            href="/models/timeline.event"
            className="border border-[var(--border)] px-3 py-1.5 font-mono text-xs text-[var(--foreground)] hover:border-[var(--primary)]"
          >
            Open AutoModel Workbench ↗
          </Link>
        </div>

        {actionError ? (
          <div className="border border-[var(--destructive)] bg-[var(--card)] px-4 py-2 text-xs text-[var(--destructive)]">
            {actionError}
          </div>
        ) : null}

        {loading ? (
          <Card>
            <CardContent className="py-8 text-center font-mono text-xs text-[var(--muted-foreground)]">
              Loading ir_addons registry…
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardHeader>
              <CardTitle>Admin Access Required</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleAddons.map((addon) => (
              <Card key={addon.id} className="flex flex-col justify-between">
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm font-bold">{addon.name}</CardTitle>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge variant="outline">v{addon.addon_version}</Badge>
                        <Badge variant="outline">{addon.category}</Badge>
                        <Badge variant={addon.enabled ? "default" : "secondary"}>
                          {addon.enabled ? "INSTALLED" : "DISABLED"}
                        </Badge>
                      </div>
                    </div>
                    {addon.name !== "__base" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant={addon.enabled ? "outline" : "default"}
                        disabled={pendingName === addon.name}
                        onClick={() => void handleToggle(addon.name, !addon.enabled)}
                      >
                        {pendingName === addon.name
                          ? "Applying…"
                          : addon.enabled
                            ? "Disable"
                            : "Enable"}
                      </Button>
                    ) : null}
                  </div>
                  <CardDescription className="text-xs">
                    {addon.description || "Workspace module managed by AddonRuntimeController."}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ConsoleShellAdapter>
  );
}
