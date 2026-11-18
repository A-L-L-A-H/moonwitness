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
  CutoutArtwork,
  DnaBrandLogo,
  SkinOrnament,
} from "@moonwitness/ui";
import { ArsyRelay, SimpulNode } from "@moonwitness/ui/icons";
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

  const installedCount = addons.filter((addon) => addon.enabled).length;
  const disabledCount = Math.max(0, addons.length - installedCount);

  async function handleToggle(name: string, nextEnabled: boolean) {
    setActionError(null);
    setPendingName(name);
    try {
      await toggle(name, nextEnabled);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("mw:navigation-changed"));
      }
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
        <Card className="relative overflow-hidden">
          <SkinOrnament slot="corner" className="left-2 top-2" />
          <CutoutArtwork
            id="mixing-console"
            decorative
            className="pointer-events-none absolute -right-4 -top-3 hidden h-28 w-28 opacity-15 sm:block"
          />
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--muted)] text-[var(--primary)]">
                <SimpulNode className="h-6 w-6" />
              </span>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <DnaBrandLogo id="addon-studio" variant="lockup" size={22} decorative />
                  <DnaBrandLogo id="09-simpul-nusantara" variant="mark" size={20} decorative />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
                    RUNTIME MODULE REGISTRY
                  </span>
                </div>
                <CardTitle className="text-lg uppercase tracking-wider">Addon Studio</CardTitle>
                <CardDescription className="text-xs">
                  Toggle workspace addons live without restarting API processes. Schema tables sync
                  via <code>syncModels()</code>.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">TOTAL: {addons.length}</Badge>
              <Badge variant="default">ACTIVE: {installedCount}</Badge>
              <Badge variant="secondary">OFF: {disabledCount}</Badge>
              <Button asChild size="sm" variant="outline">
                <Link href="/models/timeline.event">AutoModel Workbench ↗</Link>
              </Button>
            </div>
          </CardHeader>
        </Card>

        {actionError ? (
          <div className="border border-[var(--destructive)] bg-[var(--card)] px-4 py-2 text-xs text-[var(--destructive)]">
            {actionError}
          </div>
        ) : null}

        {loading ? (
          <Card>
            <CardContent className="py-10 text-center font-mono text-xs text-[var(--muted-foreground)]">
              Loading ir_addons registry…
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="relative overflow-hidden">
            <SkinOrnament slot="corner" className="right-2 top-2" />
            <CardHeader className="flex flex-col items-center py-8 text-center">
              <CutoutArtwork id="cable-coil" decorative className="mb-2 h-20 w-20 opacity-80" />
              <CardTitle>Admin Access Required</CardTitle>
              <CardDescription className="max-w-md">{error}</CardDescription>
            </CardHeader>
          </Card>
        ) : visibleAddons.length === 0 ? (
          <Card className="relative overflow-hidden">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <CutoutArtwork id="lunar-disc" decorative className="h-20 w-20 opacity-75" />
              <p className="font-mono text-xs text-[var(--muted-foreground)]">
                No addons match “{search.trim()}”.
              </p>
              <Button type="button" size="sm" variant="outline" onClick={() => setSearch("")}>
                Reset Filter
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleAddons.map((addon) => (
              <Card key={addon.id} className="relative flex flex-col justify-between">
                <SkinOrnament slot="corner" className="right-2 top-2 opacity-60" />
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--muted)] text-[var(--primary)]">
                        {addon.name === "__base" ? (
                          <ArsyRelay className="h-4 w-4" />
                        ) : (
                          <SimpulNode className="h-4 w-4" />
                        )}
                      </span>
                      <div>
                        <CardTitle className="text-sm font-bold">{addon.name}</CardTitle>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <Badge variant="outline">v{addon.addon_version}</Badge>
                          <Badge variant="outline">{addon.category}</Badge>
                          <Badge
                            variant={
                              addon.state === "error"
                                ? "destructive"
                                : addon.enabled
                                  ? "default"
                                  : "secondary"
                            }
                          >
                            {addon.state === "error"
                              ? "ERROR"
                              : addon.enabled
                                ? "INSTALLED"
                                : "DISABLED"}
                          </Badge>
                        </div>
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
                  {addon.last_error ? (
                    <p className="border border-[var(--destructive)]/50 bg-[var(--destructive)]/10 px-2.5 py-1 font-mono text-[11px] text-[var(--destructive)]">
                      {addon.last_error}
                    </p>
                  ) : null}
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ConsoleShellAdapter>
  );
}
