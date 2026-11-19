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
  CutoutArtwork,
  Input,
  SkinOrnament,
} from "@moonwitness/ui";
import { AutoModelConsole } from "@/components/meta/auto-model-console";
import { ConsoleShellAdapter } from "@/components/shell/console-shell-adapter";
import { useTranslation } from "@/hocs/TranslationWrapper";

interface StockSummaryPayload {
  products?: number;
  locations?: number;
  quants?: number;
  moves?: number;
}

interface GeoSummaryPayload {
  provinces?: number;
  cities?: number;
  byTimezone?: Array<Record<string, unknown>>;
}

export function LogisticsDashboardView() {
  const { dictionary } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeModel, setActiveModel] = useState<string>("stock.move");
  const [stock, setStock] = useState<StockSummaryPayload | null>(null);
  const [geo, setGeo] = useState<GeoSummaryPayload | null>(null);
  const [productCode, setProductCode] = useState("MW-NODE-01");
  const [qty, setQty] = useState("5");
  const [sourceLoc, setSourceLoc] = useState("WH-STOCK");
  const [destLoc, setDestLoc] = useState("WH-OUTPUT");
  const [transferNotice, setTransferNotice] = useState<string | null>(null);

  async function loadSummaries() {
    const [sRes, gRes] = await Promise.all([
      requestApiJson<StockSummaryPayload>("/api/v1/stock/summary").catch(() => null),
      requestApiJson<GeoSummaryPayload>("/api/v1/geo/summary").catch(() => null),
    ]);
    if (sRes) setStock(sRes);
    if (gRes) setGeo(gRes);
  }

  useEffect(() => {
    void loadSummaries();
  }, []);

  async function handleQuickTransfer(e: FormEvent) {
    e.preventDefault();
    setTransferNotice(null);
    const reference = `XFER-${Date.now()}`;
    try {
      await requestApiJson("/api/v1/m/stock.move", {
        method: "POST",
        body: JSON.stringify({
          reference,
          product_sku: productCode.trim(),
          location_src_code: sourceLoc.trim(),
          location_dest_code: destLoc.trim(),
          quantity: Number(qty) || 1,
          move_state: "confirmed",
        }),
      });
      setTransferNotice(
        `Scheduled stock move ${reference}: ${qty} × ${productCode} (${sourceLoc} → ${destLoc}).`,
      );
      await loadSummaries();
    } catch (err) {
      setTransferNotice(err instanceof Error ? err.message : "Stock transfer failed.");
    }
  }

  const models = [
    { id: "stock.move", label: "Stock Movements" },
    { id: "stock.quant", label: "Inventory Quants" },
    { id: "stock.location", label: "Warehouse Locations" },
    { id: "product.product", label: "Products" },
    { id: "geo.province", label: "Provinces (ID)" },
    { id: "geo.city", label: "Cities & Regencies" },
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
              <Badge variant="default">LOCATIONS: {stock?.locations ?? 0}</Badge>
              <Badge variant="secondary">PROVINCES: {geo?.provinces ?? 0}</Badge>
            </div>
            <h1 className="font-semibold leading-none tracking-tight text-lg uppercase">
              {dictionary.dashboards.logisticsTitle}
            </h1>
            <CardDescription>{dictionary.dashboards.logisticsSubtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="border border-[var(--border)] bg-[var(--background)] p-3">
                <div className="font-mono text-[10px] text-[var(--muted-foreground)]">
                  STOCK MOVES
                </div>
                <div className="mt-1 font-brush text-2xl">{stock?.moves ?? 0}</div>
              </div>
              <div className="border border-[var(--border)] bg-[var(--background)] p-3">
                <div className="font-mono text-[10px] text-[var(--muted-foreground)]">PRODUCTS</div>
                <div className="mt-1 font-brush text-2xl">{stock?.products ?? 0}</div>
              </div>
              <div className="border border-[var(--border)] bg-[var(--background)] p-3">
                <div className="font-mono text-[10px] text-[var(--muted-foreground)]">
                  ACTIVE QUANTS
                </div>
                <div className="mt-1 font-brush text-2xl">{stock?.quants ?? 0}</div>
              </div>
              <div className="border border-[var(--border)] bg-[var(--background)] p-3">
                <div className="font-mono text-[10px] text-[var(--muted-foreground)]">
                  CITIES / REGENCIES
                </div>
                <div className="mt-1 font-brush text-2xl">{geo?.cities ?? 0}</div>
              </div>
            </div>

            <form
              onSubmit={(e) => void handleQuickTransfer(e)}
              className="grid grid-cols-1 gap-2 border border-[var(--border)] bg-[var(--background)] p-3 sm:grid-cols-5"
            >
              <Input
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                placeholder="Product SKU"
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
                Create Stock Move
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
