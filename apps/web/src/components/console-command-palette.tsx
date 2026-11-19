"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  DnaBrandLogo,
  listDnaWorlds,
  listPresets,
  skinPresets,
  useSkin,
  type BrandLogoId,
} from "@moonwitness/ui";
import { useMetaModelsCatalog } from "@/lib/api/meta-views";
import { navHref, navItems, operationsNavItems } from "./shell/nav-items";

export interface ConsoleCommandPaletteProps {
  plane?: "creator" | "operations" | "all";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ConsoleCommandPalette({
  plane = "all",
  open: controlledOpen,
  onOpenChange,
}: ConsoleCommandPaletteProps) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const { skin, setSkin, dnaId, setDna, mode, setMode, density, setDensity } = useSkin();
  const presets = useMemo(() => listPresets(), []);
  const worlds = useMemo(() => listDnaWorlds(), []);
  const catalog = useMetaModelsCatalog();
  const routes = useMemo(() => {
    if (plane === "creator") return navItems;
    if (plane === "operations") return operationsNavItems;
    const seen = new Set<string>();
    return [...navItems, ...operationsNavItems].filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [plane]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(!isOpen);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, setOpen]);

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={setOpen}
      title="Sovereign Command Palette"
      skin={skin}
    >
      <CommandInput autoFocus placeholder="Type a command, module, skin, or DNA world…" />
      <CommandList>
        <CommandEmpty>No matching commands.</CommandEmpty>

        <CommandGroup heading="Modules & Workspaces">
          {routes.map((item) => {
            const href = navHref(item);
            return (
              <CommandItem
                key={`nav-${item.id}`}
                value={`${item.label} ${href}`}
                onSelect={() => {
                  setOpen(false);
                  router.push(href);
                }}
              >
                <span>{item.label}</span>
                <CommandShortcut>{href}</CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Live ORM Models">
          {catalog.map((model) => {
            const href = `/addons?model=${encodeURIComponent(model)}`;
            return (
              <CommandItem
                key={`model-${model}`}
                value={`model ${model}`}
                onSelect={() => {
                  setOpen(false);
                  router.push(href);
                }}
              >
                <span>{model}</span>
                <CommandShortcut>{href}</CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Surface Skin (8-Axis Engine)">
          {presets.map((key) => {
            const preset = skinPresets[key];
            return (
              <CommandItem
                key={`skin-${key}`}
                value={`skin ${preset.label} ${key} ${preset.description}`}
                onSelect={() => {
                  setSkin(key);
                  setOpen(false);
                }}
              >
                <span>{preset.label}</span>
                <CommandShortcut>{skin === key ? "ACTIVE" : key.toUpperCase()}</CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Master DNA Worlds">
          {worlds.map((world) => (
            <CommandItem
              key={`dna-${world.id}`}
              value={`dna ${world.name} ${world.id} ${world.metaphor}`}
              onSelect={() => {
                setDna(world.id);
                setOpen(false);
              }}
            >
              <span className="inline-flex items-center gap-2">
                <DnaBrandLogo id={world.id as BrandLogoId} variant="mark" size={16} decorative />
                <span>{world.name}</span>
              </span>
              <CommandShortcut>{dnaId === world.id ? "ACTIVE" : world.numeral}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Mode & Density">
          {(["dark", "light", "system"] as const).map((nextMode) => (
            <CommandItem
              key={`mode-${nextMode}`}
              value={`theme mode ${nextMode}`}
              onSelect={() => {
                setMode(nextMode);
                setOpen(false);
              }}
            >
              <span>Theme: {nextMode.toUpperCase()}</span>
              <CommandShortcut>{mode === nextMode ? "ACTIVE" : "SET"}</CommandShortcut>
            </CommandItem>
          ))}
          {(["compact", "comfortable", "spacious"] as const).map((nextDensity) => (
            <CommandItem
              key={`density-${nextDensity}`}
              value={`density ${nextDensity}`}
              onSelect={() => {
                setDensity(nextDensity);
                setOpen(false);
              }}
            >
              <span>Density: {nextDensity.toUpperCase()}</span>
              <CommandShortcut>{density === nextDensity ? "ACTIVE" : "SET"}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Studios, Models & Addons">
          {[
            { label: "Addons Catalog & Installs", href: "/addons", tag: "ADDONS" },
            { label: "Skin Laboratory (10-Skin Engine)", href: "/skin-lab", tag: "SKIN LAB" },
            { label: "Identity & Avatar Studio", href: "/id-lab", tag: "ID LAB" },
            {
              label: "Model Inspector: Timeline Event",
              href: "/addons?model=timeline.event",
              tag: "MODEL",
            },
            {
              label: "Model Inspector: Witness Claim",
              href: "/addons?model=witness.claim",
              tag: "MODEL",
            },
            {
              label: "Model Inspector: CRM Lead",
              href: "/addons?model=crm.lead",
              tag: "MODEL",
            },
            {
              label: "Model Inspector: Stock Move",
              href: "/addons?model=stock.move",
              tag: "MODEL",
            },
            {
              label: "Model Inspector: Account Move",
              href: "/addons?model=account.move",
              tag: "MODEL",
            },
            {
              label: "Model Inspector: CAB Request",
              href: "/addons?model=cab.request",
              tag: "MODEL",
            },
            {
              label: "Enterprise Analytics Dashboard",
              href: "/en/dashboards/analytics",
              tag: "DASHBOARD",
            },
            {
              label: "Enterprise CRM Workspace",
              href: "/en/dashboards/crm",
              tag: "DASHBOARD",
            },
            {
              label: "Enterprise Logistics & Geo",
              href: "/en/dashboards/logistics",
              tag: "DASHBOARD",
            },
            {
              label: "Double-Entry Accounting & Ledger",
              href: "/en/apps/invoice",
              tag: "APP",
            },
            {
              label: "Witness 9-Module & Mizan Lab",
              href: "/en/apps/academy",
              tag: "APP",
            },
            {
              label: "Celestial & M-Time Observatory",
              href: "/en/apps/observatory",
              tag: "APP",
            },
            { label: "ARSY Control Plane", href: "/control", tag: "OPS" },
            { label: "VPN & Mesh Tunnel", href: "/control?tab=vpn", tag: "OPS" },
            { label: "SNMP Telemetry Probes", href: "/control?tab=snmp", tag: "OPS" },
            { label: "Syslog Stream", href: "/control?tab=syslog", tag: "OPS" },
            { label: "RADIUS Access Control", href: "/control?tab=radius", tag: "OPS" },
            { label: "Storage Browser", href: "/control?tab=storage", tag: "OPS" },
          ].map((entry) => (
            <CommandItem
              key={`jump-${entry.href}`}
              value={`${entry.label} ${entry.href} ${entry.tag}`}
              onSelect={() => {
                router.push(entry.href);
                setOpen(false);
              }}
            >
              <span>{entry.label}</span>
              <CommandShortcut>{entry.tag}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
