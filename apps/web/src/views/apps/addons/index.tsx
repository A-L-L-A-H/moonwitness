"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
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
  type CutoutArtworkId,
} from "@moonwitness/ui";
import { ArsyRelay, SimpulNode } from "@moonwitness/ui/icons";
import { AutoModelConsole } from "@/components/meta/auto-model-console";
import { ConsoleShellAdapter } from "@/components/shell/console-shell-adapter";
import { useTranslation } from "@/hocs/TranslationWrapper";
import { useMetaAddons, useMetaModelsCatalog } from "@/lib/api/meta-views";
import { getLocaleFromPath, getLocalizedUrl } from "@/utils/i18n";

export interface ModelMetaProfile {
  domainIcon: string;
  cutoutId: CutoutArtworkId;
  category: string;
}

export function resolveModelVisuals(model: string): ModelMetaProfile {
  const key = model.toLowerCase();
  if (key.startsWith("timeline.") || key.includes("mtime")) {
    return { domainIcon: "mtime", cutoutId: "lunar-disc", category: "Chronicle & Temporal" };
  }
  if (key.startsWith("witness.") || key.startsWith("memory.") || key.startsWith("mizan.")) {
    return { domainIcon: "memory", cutoutId: "witness-silhouette", category: "Epistemic & Witness" };
  }
  if (key.startsWith("scripture.")) {
    return { domainIcon: "scripture", cutoutId: "crescent", category: "Scripture & Canon" };
  }
  if (key.startsWith("snmp.") || key.startsWith("observatory.") || key.startsWith("celestial.")) {
    return { domainIcon: "snmp", cutoutId: "satellite-dish", category: "Observatory & Probes" };
  }
  if (key.startsWith("syslog.") || key.startsWith("audit.")) {
    return { domainIcon: "syslog", cutoutId: "oscilloscope-crt", category: "Audit & Telemetry" };
  }
  if (key.startsWith("vpn.") || key.startsWith("radius.")) {
    return { domainIcon: "vpn", cutoutId: "cipher-wheel", category: "Network & Security" };
  }
  if (key.startsWith("storage.") || key.startsWith("stock.")) {
    return { domainIcon: "storage", cutoutId: "industrial-battery", category: "Storage & Inventory" };
  }
  if (key.startsWith("crm.") || key.startsWith("res.partner") || key.startsWith("res.company")) {
    return { domainIcon: "crm", cutoutId: "city-block", category: "Partners & CRM" };
  }
  if (key.startsWith("account.")) {
    return { domainIcon: "account", cutoutId: "codex-scroll", category: "Accounting & Ledger" };
  }
  if (key.startsWith("cab.") || key.startsWith("command.") || key.startsWith("performance.")) {
    return { domainIcon: "cab", cutoutId: "radar-sweep", category: "Command & Governance" };
  }
  if (key.startsWith("khidra.") || key.startsWith("mail.")) {
    return { domainIcon: "khidra", cutoutId: "patch-cable-jack", category: "Automation & Chatter" };
  }
  if (key.startsWith("geo.")) {
    return { domainIcon: "geo", cutoutId: "horizon-sextant", category: "Geo-Spatial" };
  }
  if (key.startsWith("ir.") || key.startsWith("auth.") || key.startsWith("res.groups")) {
    return { domainIcon: "ir", cutoutId: "hardware-key", category: "Kernel & RBAC" };
  }
  return { domainIcon: "arsy", cutoutId: "cassette-recorder", category: "Domain Addon" };
}

export function AddonsStudioView() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-mono text-xs text-[var(--muted-foreground)]">
          Loading Addon Studio…
        </div>
      }
    >
      <AddonsStudioContent />
    </Suspense>
  );
}

function AddonsStudioContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedModel = searchParams.get("model")?.trim() ?? "";
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const { addons, loading, error, toggle } = useMetaAddons();
  const catalog = useMetaModelsCatalog();
  const { dictionary } = useTranslation();
  const [pendingName, setPendingName] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const pathLocale = getLocaleFromPath(pathname);
  const baseAddonsPath = pathname.includes("/apps/addons")
    ? pathLocale
      ? getLocalizedUrl("/apps/addons", pathLocale)
      : "/apps/addons"
    : pathLocale
      ? getLocalizedUrl("/addons", pathLocale)
      : "/addons";

  const modelCategories = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const m of catalog) {
      const cat = resolveModelVisuals(m).category;
      const list = groups.get(cat) ?? [];
      list.push(m);
      groups.set(cat, list);
    }
    return Array.from(groups.entries());
  }, [catalog]);

  if (selectedModel) {
    const visuals = resolveModelVisuals(selectedModel);
    return (
      <ConsoleShellAdapter
        breadcrumb={`${dictionary.addons.title} / ${selectedModel}`}
        plane="creator"
        search={{
          value: search,
          onChange: setSearch,
          placeholder: `Filter ${selectedModel} view…`,
        }}
      >
        <div className="space-y-4">
          <Card className="relative overflow-hidden">
            <SkinOrnament slot="corner" className="left-2 top-2" />
            <CardContent className="space-y-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1
                    dir="ltr"
                    className="font-mono text-base font-bold uppercase tracking-tight text-[var(--foreground)]"
                  >
                    {selectedModel}
                  </h1>
                  <Badge variant="outline">{dictionary.addons.modelExplorer}</Badge>
                  <Badge variant="secondary">{visuals.category}</Badge>
                  <Badge variant="outline">{catalog.length} MODELS</Badge>
                </div>
                <Button asChild size="sm" variant="ghost">
                  <Link href={baseAddonsPath}>← {dictionary.addons.title}</Link>
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant={categoryFilter === "all" ? "default" : "outline"}
                  onClick={() => setCategoryFilter("all")}
                >
                  All ({catalog.length})
                </Button>
                {modelCategories.map(([cat, models]) => (
                  <Button
                    key={cat}
                    type="button"
                    size="sm"
                    variant={categoryFilter === cat ? "default" : "outline"}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat} ({models.length})
                  </Button>
                ))}
              </div>
              <div className="flex max-h-40 flex-wrap items-center gap-1.5 overflow-y-auto pt-1">
                {catalog
                  .filter(
                    (item) =>
                      categoryFilter === "all" ||
                      resolveModelVisuals(item).category === categoryFilter,
                  )
                  .map((item) => {
                    const active = item === selectedModel;
                    return (
                      <Button key={item} asChild size="sm" variant={active ? "default" : "outline"}>
                        <Link
                          href={`${baseAddonsPath}?model=${encodeURIComponent(item)}`}
                          dir="ltr"
                          className="font-mono"
                        >
                          {item}
                        </Link>
                      </Button>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          <AutoModelConsole
            model={selectedModel}
            searchQuery={search}
            domainIcon={visuals.domainIcon}
            cutoutId={visuals.cutoutId}
          />
        </div>
      </ConsoleShellAdapter>
    );
  }

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
      breadcrumb={dictionary.addons.title}
      plane="creator"
      search={{
        value: search,
        onChange: setSearch,
        placeholder: "Filter installed addons…",
      }}
    >
      <div className="space-y-4">
        <Card className="relative overflow-hidden">
          <SkinOrnament slot="corner" className="end-2 top-2" />
          <CutoutArtwork
            id="mixing-console"
            decorative
            className="pointer-events-none absolute -bottom-4 -end-2 hidden h-24 w-24 opacity-10 sm:block"
          />
          <CardHeader className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--muted)] text-[var(--primary)]">
                <SimpulNode className="h-6 w-6" />
              </span>
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <DnaBrandLogo id="addon-studio" variant="lockup" size={22} decorative />
                  <DnaBrandLogo id="09-simpul-nusantara" variant="mark" size={20} decorative />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
                    {dictionary.addons.runtimeRegistry}
                  </span>
                </div>
                <h1 className="font-semibold leading-none tracking-tight text-lg uppercase tracking-wider">
                  {dictionary.addons.title}
                </h1>
                <CardDescription className="text-xs">
                  {dictionary.addons.subtitle} Schema tables sync via{" "}
                  <code dir="ltr">syncModels()</code>.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {dictionary.addons.total}: {addons.length}
              </Badge>
              <Badge variant="default">
                {dictionary.addons.active}: {installedCount}
              </Badge>
              <Badge variant="secondary">
                {dictionary.addons.off}: {disabledCount}
              </Badge>
              <Button asChild size="sm" variant="outline">
                <Link href={`${baseAddonsPath}?model=timeline.event`}>AutoModel Workbench ↗</Link>
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
            <SkinOrnament slot="corner" className="end-2 top-2" />
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
                <SkinOrnament slot="corner" className="end-2 top-2 opacity-60" />
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--muted)] text-[var(--primary)]">
                        {addon.name === "__base" ? (
                          <ArsyRelay className="h-4 w-4" />
                        ) : (
                          <SimpulNode className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <CardTitle dir="ltr" className="text-sm font-bold break-all">
                          {addon.name}
                        </CardTitle>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <Badge dir="ltr" variant="outline">
                            v{addon.addon_version}
                          </Badge>
                          <Badge dir="ltr" variant="outline">
                            {addon.category}
                          </Badge>
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
                              ? dictionary.addons.error
                              : addon.enabled
                                ? dictionary.addons.installed
                                : dictionary.addons.disabled}
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
                          ? dictionary.addons.applying
                          : addon.enabled
                            ? dictionary.addons.disable
                            : dictionary.addons.enable}
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
export default AddonsStudioView;
