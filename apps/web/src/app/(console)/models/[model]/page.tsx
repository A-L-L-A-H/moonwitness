"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  SkinOrnament,
  type CutoutArtworkId,
} from "@moonwitness/ui";
import { AutoModelConsole } from "@/components/meta/auto-model-console";
import { ConsoleShellAdapter } from "@/components/shell/console-shell-adapter";
import { useMetaModelsCatalog } from "@/lib/api/meta-views";

interface ModelMetaProfile {
  domainIcon: string;
  cutoutId: CutoutArtworkId;
}

function resolveModelVisuals(model: string): ModelMetaProfile {
  const key = model.toLowerCase();
  if (key.includes("timeline") || key.includes("mtime")) {
    return { domainIcon: "mtime", cutoutId: "lunar-disc" };
  }
  if (key.includes("witness") || key.includes("memory")) {
    return { domainIcon: "memory", cutoutId: "witness-silhouette" };
  }
  if (key.includes("scripture")) {
    return { domainIcon: "scripture", cutoutId: "crescent" };
  }
  if (key.includes("probe") || key.includes("snmp")) {
    return { domainIcon: "snmp", cutoutId: "satellite-dish" };
  }
  return { domainIcon: "arsy", cutoutId: "cassette-recorder" };
}

export default function DynamicModelPage() {
  const params = useParams<{ model: string }>();
  const modelName = decodeURIComponent(params?.model ?? "");
  const [search, setSearch] = useState("");
  const visuals = resolveModelVisuals(modelName);
  const catalog = useMetaModelsCatalog();

  return (
    <ConsoleShellAdapter
      breadcrumb={modelName || "Model Explorer"}
      plane="creator"
      search={{
        value: search,
        onChange: setSearch,
        placeholder: `Filter ${modelName || "model"} view…`,
      }}
    >
      <div className="space-y-4">
        <Card className="relative overflow-hidden">
          <SkinOrnament slot="corner" className="left-2 top-2" />
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">MODEL EXPLORER</Badge>
              {catalog.slice(0, 12).map((item) => {
                const active = item === modelName;
                return (
                  <Button key={item} asChild size="sm" variant={active ? "default" : "outline"}>
                    <Link href={`/models/${encodeURIComponent(item)}`}>{item}</Link>
                  </Button>
                );
              })}
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link href="/addons">Addon Studio ↗</Link>
            </Button>
          </CardContent>
        </Card>

        {modelName ? (
          <AutoModelConsole
            model={modelName}
            searchQuery={search}
            domainIcon={visuals.domainIcon}
            cutoutId={visuals.cutoutId}
          />
        ) : null}
      </div>
    </ConsoleShellAdapter>
  );
}
