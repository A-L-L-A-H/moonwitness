"use client";

import { useEffect, useState } from "react";
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
import { MTimeInteractiveEngine } from "@/components/mtime-observatory";
import { useTranslation } from "@/hocs/TranslationWrapper";

interface CelestialNowPayload {
  lunar?: {
    phaseName?: string;
    illumination?: number;
    elongationDeg?: number;
  };
}

interface PrayerTimesPayload {
  date?: string;
  fajr?: string;
  sunrise?: string;
  dhuhr?: string;
  asr?: string;
  maghrib?: string;
  isha?: string;
  qibla_bearing?: number;
}

interface HilalPayload {
  altitude_deg?: number;
  elongation_deg?: number;
  mabims_criterion?: { status?: string; passed?: boolean; description?: string };
  overall_verdict?: string;
}

interface ObservatorySummaryPayload {
  feeds?: number;
  operations?: number;
}

export function ObservatoryAppView() {
  const { dictionary } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeModel, setActiveModel] = useState<string>("observatory.feed");
  const [lat, setLat] = useState("-6.2088");
  const [lon, setLon] = useState("106.8456");
  const [prayers, setPrayers] = useState<PrayerTimesPayload | null>(null);
  const [hilal, setHilal] = useState<HilalPayload | null>(null);
  const [obsSummary, setObsSummary] = useState<ObservatorySummaryPayload | null>(null);

  async function loadCelestialTelemetry(latitude: string, longitude: string) {
    const q = `lat=${encodeURIComponent(latitude)}&lng=${encodeURIComponent(longitude)}`;
    const [nowRes, pRes, oRes] = await Promise.all([
      requestApiJson<CelestialNowPayload>(`/api/v1/celestial/now?${q}`).catch(() => null),
      requestApiJson<PrayerTimesPayload>(`/api/v1/celestial/prayer-times?${q}`).catch(() => null),
      requestApiJson<ObservatorySummaryPayload>("/api/v1/observatory/summary").catch(() => null),
    ]);
    const elong = Number.isFinite(nowRes?.lunar?.elongationDeg)
      ? Number(nowRes!.lunar!.elongationDeg).toFixed(2)
      : "6.80";
    const hRes = await requestApiJson<HilalPayload>(
      `/api/v1/celestial/hilal?altitude=3.50&elongation=${encodeURIComponent(elong)}&width=0.35`,
    ).catch(() => null);
    if (pRes) setPrayers(pRes);
    if (hRes) setHilal(hRes);
    if (oRes) setObsSummary(oRes);
  }

  useEffect(() => {
    void loadCelestialTelemetry(lat, lon);
  }, [lat, lon]);

  const models = [
    { id: "observatory.feed", label: "Observatory Feeds" },
    { id: "celestial.snapshot", label: "Celestial Snapshots" },
    { id: "sg.operation", label: "Scripture Operations" },
  ] as const;

  const prayerEntries = prayers
    ? (
        [
          ["Fajr", prayers.fajr],
          ["Sunrise", prayers.sunrise],
          ["Dhuhr", prayers.dhuhr],
          ["Asr", prayers.asr],
          ["Maghrib", prayers.maghrib],
          ["Isha", prayers.isha],
        ] as Array<[string, string | undefined]>
      ).filter((entry): entry is [string, string] => Boolean(entry[1]))
    : [];

  return (
    <ConsoleShellAdapter
      breadcrumb={dictionary.navigation.observatory}
      plane="creator"
      activeOverride="observatory"
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
            id="astrolabe-disc"
            decorative
            className="pointer-events-none absolute -right-4 -top-2 hidden h-24 w-24 opacity-20 sm:block"
          />
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">CELESTIAL & M-TIME EPHEMERIS</Badge>
              <Badge variant="default">
                HILAL:{" "}
                {hilal?.overall_verdict ??
                  (hilal?.mabims_criterion?.passed ? "MABIMS PASS" : "BELOW THRESHOLD")}
              </Badge>
              <Badge variant="secondary">
                FEEDS: {obsSummary?.feeds ?? 0} · OPS: {obsSummary?.operations ?? 0}
              </Badge>
            </div>
            <h1 className="font-semibold leading-none tracking-tight text-lg uppercase">
              {dictionary.apps.observatoryTitle}
            </h1>
            <CardDescription>{dictionary.apps.observatorySubtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="Latitude"
                aria-label="Observer Latitude"
                className="max-w-[140px]"
              />
              <Input
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                placeholder="Longitude"
                aria-label="Observer Longitude"
                className="max-w-[140px]"
              />
              <Button type="button" size="sm" onClick={() => void loadCelestialTelemetry(lat, lon)}>
                Recompute Ephemeris
              </Button>
              {prayers?.qibla_bearing !== undefined ? (
                <Badge variant="outline">QIBLA AZIMUTH: {prayers.qibla_bearing}°</Badge>
              ) : null}
            </div>

            {prayerEntries.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-6 font-mono text-xs">
                {prayerEntries.map(([name, time]) => (
                  <div
                    key={name}
                    className="border border-[var(--border)] bg-[var(--background)] p-2.5"
                  >
                    <div className="text-[10px] uppercase text-[var(--muted-foreground)]">
                      {name}
                    </div>
                    <div className="mt-1 font-bold">{time}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <MTimeInteractiveEngine compact />
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
          domainIcon="mtime"
          cutoutId="lunar-disc"
        />
      </div>
    </ConsoleShellAdapter>
  );
}
export default ObservatoryAppView;
