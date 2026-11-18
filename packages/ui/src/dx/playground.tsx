"use client";

import React, { useMemo, useState } from "react";
import {
  resolveCanonicalTokens,
  canonicalTokensToCssVariables,
  MASTER_DNA_LIGHT_PALETTES,
  type CanonicalDensity,
  type CanonicalThemeMode,
} from "../dna/canonical";
import { MASTER_DNA_PALETTES } from "../skin/imperium-tokens";
import { SkinProvider, listPresets, skinPresets, type SkinName } from "../skin/index";
import { MASTER_DNA_IDS, MASTER_DNA_WORLDS, SkinRoot, type MasterDnaId } from "../skin/dna-worlds";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { auditPaletteContrast } from "./contrast";

export interface SkinPlaygroundProps {
  defaultSkin?: SkinName;
  defaultDna?: MasterDnaId;
  defaultMode?: CanonicalThemeMode;
  className?: string;
}

type ComponentFocus =
  "all" | "button" | "card" | "input" | "badge" | "dialog" | "select" | "tabs" | "table";

type InteractiveState = "idle" | "disabled" | "loading" | "invalid";
type ViewportPreset = "desktop" | "tablet" | "mobile";
type ShowcaseVariant =
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "riot"
  | "editorial"
  | "technical"
  | "archive"
  | "transmission";

const VIEWPORT_WIDTH: Readonly<Record<ViewportPreset, string>> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

export function SkinPlayground({
  defaultSkin = "default",
  defaultDna = "05-riot-anarchy",
  defaultMode = "dark",
  className,
}: SkinPlaygroundProps) {
  const [skin, setSkin] = useState<SkinName>(defaultSkin);
  const [dnaId, setDnaId] = useState<MasterDnaId>(defaultDna);
  const [mode, setMode] = useState<CanonicalThemeMode>(defaultMode);
  const [density, setDensity] = useState<CanonicalDensity>("comfortable");
  const [componentFocus, setComponentFocus] = useState<ComponentFocus>("all");
  const [variant, setVariant] = useState<ShowcaseVariant>("default");
  const [size, setSize] = useState<"sm" | "default" | "lg">("default");
  const [state, setState] = useState<InteractiveState>("idle");
  const [viewport, setViewport] = useState<ViewportPreset>("desktop");

  const resolved = useMemo(
    () => resolveCanonicalTokens({ dnaId, skin, mode, density }),
    [dnaId, skin, mode, density],
  );
  const cssVars = useMemo(() => canonicalTokensToCssVariables(resolved), [resolved]);
  const a11yAudit = useMemo(() => {
    const palette =
      mode === "light" ? MASTER_DNA_LIGHT_PALETTES[dnaId] : MASTER_DNA_PALETTES[dnaId];
    return auditPaletteContrast(`${dnaId}:${mode}`, MASTER_DNA_WORLDS[dnaId].name, palette);
  }, [dnaId, mode]);

  const skins = listPresets();
  const show = (section: Exclude<ComponentFocus, "all">) =>
    componentFocus === "all" || componentFocus === section;

  return (
    <div
      data-testid="mw-skin-playground"
      className={className}
      style={{ display: "flex", flexDirection: "column", gap: 20 }}
    >
      {/* Controls Bar using semantic CSS variables */}
      <div className="flex flex-col gap-3 rounded-[var(--radius,0.5rem)] border border-[var(--border)] bg-[var(--card)] p-4 text-[var(--card-foreground)]">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
            Skin
          </span>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Select Skin">
            {skins.map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={skin === name}
                onClick={() => setSkin(name)}
                className={`min-h-8 border px-2 py-1 font-mono text-xs transition-colors ${
                  skin === name
                    ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] font-bold"
                    : "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]"
                }`}
              >
                {skinPresets[name].label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-1 font-mono text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
            DNA Identity
            <select
              aria-label="DNA Identity"
              value={dnaId}
              onChange={(e) => setDnaId(e.target.value as MasterDnaId)}
              className="min-h-9 w-full min-w-0 border border-[var(--border)] bg-[var(--background)] px-2 text-xs text-[var(--foreground)]"
            >
              {MASTER_DNA_IDS.map((id) => (
                <option key={id} value={id}>
                  {MASTER_DNA_WORLDS[id].numeral} · {MASTER_DNA_WORLDS[id].name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex min-w-0 flex-col gap-1 font-mono text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
            <span>Theme / Density / Viewport</span>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              <select
                aria-label="Theme Mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as CanonicalThemeMode)}
                className="min-h-9 w-full min-w-0 border border-[var(--border)] bg-[var(--background)] px-2 text-xs text-[var(--foreground)]"
              >
                <option value="dark">dark</option>
                <option value="light">light</option>
              </select>
              <select
                aria-label="Density"
                value={density}
                onChange={(e) => setDensity(e.target.value as CanonicalDensity)}
                className="min-h-9 w-full min-w-0 border border-[var(--border)] bg-[var(--background)] px-2 text-xs text-[var(--foreground)]"
              >
                <option value="compact">compact</option>
                <option value="comfortable">comfortable</option>
                <option value="spacious">spacious</option>
              </select>
              <select
                aria-label="Viewport Preview"
                value={viewport}
                onChange={(e) => setViewport(e.target.value as ViewportPreset)}
                className="min-h-9 w-full min-w-0 border border-[var(--border)] bg-[var(--background)] px-2 text-xs text-[var(--foreground)]"
              >
                <option value="desktop">Desktop</option>
                <option value="tablet">Tablet (768px)</option>
                <option value="mobile">Mobile (390px)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-1 font-mono text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
          <span>Component / Variant / Size / State</span>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            <select
              aria-label="Component Filter"
              value={componentFocus}
              onChange={(e) => setComponentFocus(e.target.value as ComponentFocus)}
              className="min-h-9 w-full min-w-0 border border-[var(--border)] bg-[var(--background)] px-2 text-xs text-[var(--foreground)]"
            >
              <option value="all">all components</option>
              <option value="button">Button</option>
              <option value="card">Card</option>
              <option value="input">Input</option>
              <option value="badge">Badge</option>
              <option value="dialog">Dialog</option>
              <option value="select">Select</option>
              <option value="tabs">Tabs</option>
              <option value="table">Table</option>
            </select>
            <select
              aria-label="Button Variant"
              value={variant}
              onChange={(e) => setVariant(e.target.value as ShowcaseVariant)}
              className="min-h-9 w-full min-w-0 border border-[var(--border)] bg-[var(--background)] px-2 text-xs text-[var(--foreground)]"
            >
              <option value="default">default</option>
              <option value="secondary">secondary</option>
              <option value="outline">outline</option>
              <option value="ghost">ghost</option>
              <option value="destructive">destructive</option>
              <option value="riot">riot</option>
              <option value="editorial">editorial</option>
              <option value="technical">technical</option>
              <option value="archive">archive</option>
              <option value="transmission">transmission</option>
            </select>
            <select
              aria-label="Button Size"
              value={size}
              onChange={(e) => setSize(e.target.value as "sm" | "default" | "lg")}
              className="min-h-9 w-full min-w-0 border border-[var(--border)] bg-[var(--background)] px-2 text-xs text-[var(--foreground)]"
            >
              <option value="sm">sm</option>
              <option value="default">default</option>
              <option value="lg">lg</option>
            </select>
            <select
              aria-label="Interactive State"
              value={state}
              onChange={(e) => setState(e.target.value as InteractiveState)}
              className="min-h-9 w-full min-w-0 border border-[var(--border)] bg-[var(--background)] px-2 text-xs text-[var(--foreground)]"
            >
              <option value="idle">idle</option>
              <option value="disabled">disabled</option>
              <option value="loading">loading</option>
              <option value="invalid">invalid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Live Scoped Stage rendering REAL exported @moonwitness/ui components */}
      <div className="overflow-x-auto border border-[var(--border)] bg-[var(--muted)]/30 p-3">
        <div
          data-testid="playground-viewport"
          data-viewport={viewport}
          style={{ width: VIEWPORT_WIDTH[viewport], maxWidth: "100%", marginInline: "auto" }}
        >
          <SkinRoot
            dnaId={dnaId}
            skin={skin}
            mode={mode}
            density={density}
            className="border border-[var(--border)] p-5"
          >
            <SkinProvider
              defaultSkin={skin}
              defaultDna={dnaId}
              defaultTheme={mode === "light" ? "light" : "dark"}
              defaultDensity={density}
              scope="local"
              persist={false}
            >
              <div className="space-y-6">
                {/* Active Token & Accessibility Telemetry */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3 font-mono text-xs">
                  <span className="min-w-0 break-all">
                    Active: <strong>{dnaId}</strong> · skin=<strong>{skin}</strong> · mode=
                    <strong>{mode}</strong> · btn-radius=
                    <strong>{cssVars["--mw-btn-radius"]}</strong>
                  </span>
                  <Badge variant={a11yAudit.passed ? "default" : "destructive"}>
                    WCAG AA: {a11yAudit.passed ? "PASS" : "CHECK"} ({a11yAudit.pairs[0]?.ratio}:1)
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {show("button") ? (
                    <Card className="min-w-0 overflow-hidden">
                      <CardHeader>
                        <CardTitle className="text-base">Button Matrix</CardTitle>
                        <CardDescription>Real @moonwitness/ui Button</CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-2">
                        <Button
                          variant={variant}
                          size={size}
                          disabled={state === "disabled"}
                          loading={state === "loading"}
                        >
                          Primary ({variant})
                        </Button>
                        <Button variant="outline" size={size} disabled={state === "disabled"}>
                          Outline
                        </Button>
                        <Button variant="ghost" size={size} disabled={state === "disabled"}>
                          Ghost
                        </Button>
                      </CardContent>
                    </Card>
                  ) : null}

                  {show("badge") ? (
                    <Card className="min-w-0 overflow-hidden">
                      <CardHeader>
                        <CardTitle className="text-base">Badge & Alert</CardTitle>
                        <CardDescription>Status tokens & semantic roles</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="default">Default</Badge>
                          <Badge variant="secondary">Secondary</Badge>
                          <Badge variant="outline">Outline</Badge>
                          <Badge variant="destructive">Destructive</Badge>
                        </div>
                        <Alert variant="info">
                          <AlertTitle>Theme Synchronized</AlertTitle>
                          <AlertDescription className="break-all font-mono text-xs">
                            --primary={cssVars["--primary"]}
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                  ) : null}

                  {show("input") ? (
                    <Card className="min-w-0 overflow-hidden">
                      <CardHeader>
                        <CardTitle className="text-base">Input, Checkbox & Switch</CardTitle>
                        <CardDescription>Form semantics & state styles</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor="pg-input">Node Label</Label>
                          <Input
                            id="pg-input"
                            aria-invalid={state === "invalid" || undefined}
                            disabled={state === "disabled"}
                            placeholder="Type to inspect focus ring..."
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="pg-check"
                              defaultChecked
                              disabled={state === "disabled"}
                            />
                            <Label htmlFor="pg-check">Verified</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              aria-label="Toggle live signal"
                              disabled={state === "disabled"}
                            />
                            <span className="text-xs">Live</span>
                          </div>
                        </div>
                        <Progress aria-label="Readiness" value={72} />
                      </CardContent>
                    </Card>
                  ) : null}

                  {show("select") || show("dialog") ? (
                    <Card className="min-w-0 overflow-hidden">
                      <CardHeader>
                        <CardTitle className="text-base">Select & Dialog Overlay</CardTitle>
                        <CardDescription>Radix focus-managed controls</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {show("select") ? (
                          <Select defaultValue="core">
                            <SelectTrigger aria-label="Playground select">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="core">Core Layer</SelectItem>
                              <SelectItem value="skin">Skin Engine</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : null}
                        {show("dialog") ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="secondary" size="sm">
                                Open Real Dialog
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{skinPresets[skin].label} Dialog</DialogTitle>
                                <DialogDescription>
                                  Rendered inside {dnaId} ({mode}).
                                </DialogDescription>
                              </DialogHeader>
                            </DialogContent>
                          </Dialog>
                        ) : null}
                      </CardContent>
                    </Card>
                  ) : null}
                </div>

                {show("tabs") ? (
                  <Tabs defaultValue="tokens">
                    <TabsList>
                      <TabsTrigger value="tokens">Active Tokens</TabsTrigger>
                      <TabsTrigger value="a11y">Contrast Pairs</TabsTrigger>
                    </TabsList>
                    <TabsContent value="tokens" className="font-mono text-xs">
                      <div className="grid grid-cols-1 gap-2 border border-[var(--border)] p-3 sm:grid-cols-3">
                        <div className="min-w-0 break-all">bg: {cssVars["--background"]}</div>
                        <div className="min-w-0 break-all">fg: {cssVars["--foreground"]}</div>
                        <div className="min-w-0 break-all">ring: {cssVars["--ring"]}</div>
                      </div>
                    </TabsContent>
                    <TabsContent value="a11y" className="font-mono text-xs">
                      <div className="grid grid-cols-1 gap-2 border border-[var(--border)] p-3 sm:grid-cols-2">
                        {a11yAudit.pairs.map((p) => (
                          <div key={p.pairName} className="min-w-0 break-words">
                            {p.pairName}: <strong>{p.ratio}:1</strong> ({p.passed ? "PASS" : "FAIL"}
                            )
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : null}

                {show("card") && componentFocus === "card" ? (
                  <Card className="min-w-0 overflow-hidden">
                    <CardHeader>
                      <CardTitle>Full Surface Card</CardTitle>
                      <CardDescription className="break-all">
                        Border radius: {cssVars["--mw-card-radius"]}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="break-all">
                      Shadow: {cssVars["--mw-card-shadow"]}
                    </CardFooter>
                  </Card>
                ) : null}

                {show("table") ? (
                  <div className="w-full overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Token</TableHead>
                          <TableHead>Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>--mw-btn-radius</TableCell>
                          <TableCell className="break-all">{cssVars["--mw-btn-radius"]}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>--radius</TableCell>
                          <TableCell className="break-all">{cssVars["--radius"]}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                ) : null}
              </div>
            </SkinProvider>
          </SkinRoot>
        </div>
      </div>
    </div>
  );
}
