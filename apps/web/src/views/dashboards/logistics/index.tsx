"use client";

import { useEffect, useState, type FormEvent } from "react";
import { requestApiJson } from "@moonwitness/contracts/sdk";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CutoutArtwork,
  Input,
  SkinOrnament,
} from "@moonwitness/ui";
import { AutoModelConsole } from "@/components/meta/auto-model-console";
import { ConsoleShellAdapter } from "@/components/shell/console-shell-adapter";
import { useTranslation } from "@/hocs/TranslationWrapper";

interface StockSummaryPayload {
  data?: {
    totalLocations?: number;
    totalMoves?: number;
    completedMoves?: number;
    totalQuants?: number;
  };
}

interface GeoSummaryPayload {
  data?: {
    totalPlaces?: number;
    totalZones?: number;
  };
}

export function LogisticsDashboardView() {
  const { dictionary } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeModel, setActiveModel] = useState<string>("stock.move");
  const [stock, setStock] = useState<StockSummaryPayload["data"] | null>(null);
  const [geo, setGeo] = useState<GeoSummaryPayload["data"] | null>(null);
  const [productCode, setProductCode] = useState("AST-01");
  const [qty, setQty] = useState("10");
  const [sourceLoc, setSourceLoc] = useState("WH-MAIN");
  const [destLoc, setDestLoc] = useState("WH-DEPLOY");
  const [transferNotice, setTransferNotice] = useState<string | null>(null);

  async function loadSummaries() {
    const [sRes, gRes] = await Promise.all([
      requestApiJson<StockSummaryPayload>("/api/v1/stock/summary").catch(() => null),
      requestApiJson<GeoSummaryPayload>("/api/v1/geo/summary").catch(() => null),
    ]);
    if (sRes?.data) setStock(sRes.data);
    if (gRes?.data) setGeo(gRes.data);
  }

  useEffect(() => {
    void loadSummaries();
  }, []);

  async function handleQuickTransfer(e: FormEvent) {
    e.preventDefault();
    setTransferNotice(null);
    try {
      await requestApiJson("/api/v1/stock/transfer", {
        method: "POST",
        body: JSON.stringify({
          product_code: productCode.trim(),
          quantity: Number(qty) || 1,
          source_location_code: sourceLoc.trim(),
          dest_location_code: destLoc.trim(),
          reference: `XFER-${Date.now()}`,
        }),
      });
      setTransferNotice(`Transferred ${qty} × ${productCode} (${sourceLoc} → ${destLoc}).`);
      await loadSummaries();
    } catch (err) {
      setTransferNotice(err instanceof Error ? err.message : "Stock transfer failed.");
    }
  }

  const models = [
    { id: "stock.move", label: "Stock Movements" },
    { id: "stock.quant", label: "Inventory Quants" },
    { id: "stock.location", label: "Warehouse Locations" },
    { id: "geo.place", label: "Geo Places" },
    { id: "geo.zone", label: "Spatial Zones" },
  ] as const;

  return (
    <ConsoleShellAdapter
      breadcrumb={dictionary.navigation.logistics}
      plane="creator"
      activeOverride="logistics"
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
            id="horizon-sextant"
            decorative
            className="pointer-events-none absolute -right-4 -top-2 hidden h-24 w-24 opacity-20 sm:block"
          />
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">STOCK & GEO-SPATIAL</Badge>
              <Badge variant="default">LOCATIONS: {stock?.totalLocations ?? 0}</Badge>
              <Badge variant="secondary">GEO ZONES: {geo?.totalZones ?? 0}</Badge>
            </div>
            <CardTitle className="text-lg uppercase">
              {dictionary.dashboards.logisticsTitle}
            </CardTitle>
            <CardDescription>{dictionary.dashboards.logisticsSubtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="border border-[var(--border)] bg-[var(--background)] p-3">
                <div className="font-mono text-[10px] text-[var(--muted-foreground)]">STOCK MOVES</div>
                <div className="mt-1 font-brush text-2xl">{stock?.totalMoves ?? 0}</div>
              </div>
              <div className="border border-[var(--border)] bg-[var(--background)] p-3">
                <div className="font-mono text-[10px] text-[var(--muted-foreground)]">COMPLETED MOVES</div>
                <div className="mt-1 font-brush text-2xl">{stock?.completedMoves ?? 0}</div>
              </div>
              <div className="border border-[var(--border)] bg-[var(--background)] p-3">
                <div className="font-mono text-[10px] text-[var(--muted-foreground)]">ACTIVE QUANTS</div>
                <div className="mt-1 font-brush text-2xl">{stock?.totalQuants ?? 0}</div>
              </div>
              <div className="border border-[var(--border)] bg-[var(--background)] p-3">
                <div className="font-mono text-[10px] text-[var(--muted-foreground)]">GEO PLACES</div>
                <div className="mt-1 font-brush text-2xl">{geo?.totalPlaces ?? 0}</div>
              </div>
            </div>

            <form
              onSubmit={(e) => void handleQuickTransfer(e)}
              className="grid grid-cols-1 gap-2 border border-[var(--border)] bg-[var(--background)] p-3 sm:grid-cols-5"
            >
              <Input
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                placeholder="Product Code"
                aria-label="Product Code"
              />
              <Input
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="Quantity"
                aria-label="Quantity"
              />
              <Input
                value={sourceLoc}
                onChange={(e) => setSourceLoc(e.target.value)}
                placeholder="Source Location"
                aria-label="Source Location"
              />
              <Input
                value={destLoc}
                onChange={(e) => setDestLoc(e.target.value)}
                placeholder="Destination Location"
                aria-label="Destination Location"
              />
              <Button type="submit" size="sm">
                Execute Stock Transfer
              </Button>
            </form>
            {transferNotice ? (
              <div className="font-mono text-xs text-[var(--primary)]">{transferNotice}</div>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          {models.map((m) => (
            <Button
              key={m.id}
              type="button"
              size="sm"
              variant={activeModel === m.id ? "default" : "outline"}
              onClick={() => setActiveModel(m.id)}
            >
              {m.label} ({m.id})
            </Button>
          ))}
        </div>

        <AutoModelConsole
          model={activeModel}
          searchQuery={search}
          domainIcon="storage"
          cutoutId="industrial-battery"
        />
      </div>
    </ConsoleShellAdapter>
  );
}
export default LogisticsDashboardView;
