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
  CardTitle,
  CutoutArtwork,
  Input,
  SkinOrnament,
} from "@moonwitness/ui";
import { AutoModelConsole } from "@/components/meta/auto-model-console";
import { ConsoleShellAdapter } from "@/components/shell/console-shell-adapter";
import { MTimeInteractiveEngine } from "@/components/mtime-observatory";
import { useTranslation } from "@/hocs/TranslationWrapper";

interface PrayerTimesPayload {
  data?: {
    timings?: Record<string, string>;
    qiblaAzimuthDeg?: number;
  };
}

interface HilalPayload {
  data?: {
    elongationDeg?: number;
    moonAltitudeDeg?: number;
    illuminatedFraction?: number;
    mabimsPassed?: boolean;
    verdict?: string;
  };
}

interface ObservatorySummaryPayload {
  data?: {
    totalFeeds?: number;
    healthyFeeds?: number;
    totalSnapshots?: number;
  };
}

export function ObservatoryAppView() {
  const { dictionary } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeModel, setActiveModel] = useState<string>("celestial.hilal.sighting");
  const [lat, setLat] = useState("-6.2088");
  const [lon, setLon] = useState("106.8456");
  const [prayers, setPrayers] = useState<PrayerTimesPayload["data"] | null>(null);
  const [hilal, setHilal] = useState<HilalPayload["data"] | null>(null);
  const [obsSummary, setObsSummary] = useState<ObservatorySummaryPayload["data"] | null>(null);

  async function loadCelestialTelemetry(latitude: string, longitude: string) {
    const q = `lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`;
    const [pRes, hRes, oRes] = await Promise.all([
      requestApiJson<PrayerTimesPayload>(`/api/v1/celestial/prayer-times?${q}`).catch(() => null),
      requestApiJson<HilalPayload>(`/api/v1/celestial/hilal?${q}`).catch(() => null),
      requestApiJson<ObservatorySummaryPayload>("/api/v1/observatory/summary").catch(() => null),
    ]);
    if (pRes?.data) setPrayers(pRes.data);
    if (hRes?.data) setHilal(hRes.data);
    if (oRes?.data) setObsSummary(oRes.data);
  }

  useEffect(() => {
    void loadCelestialTelemetry(lat, lon);
  }, [lat, lon]);

  const models = [
    { id: "celestial.hilal.sighting", label: "Hilal Sightings" },
    { id: "celestial.observer.profile", label: "Observer Sites" },
    { id: "observatory.feed", label: "Observatory Feeds" },
    { id: "observatory.snapshot", label: "Feed Snapshots" },
    { id: "mtime.calendar", label: "M-Time Calendars" },
    { id: "mtime.anchor", label: "Temporal Anchors" },
  ] as const;

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
                HILAL: {hilal?.verdict ?? (hilal?.mabimsPassed ? "MABIMS PASS" : "BELOW THRESHOLD")}
              </Badge>
              <Badge variant="secondary">FEEDS: {obsSummary?.healthyFeeds ?? 0}</Badge>
            </div>
            <CardTitle className="text-lg uppercase">{dictionary.apps.observatoryTitle}</CardTitle>
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
              <Button
                type="button"
                size="sm"
                onClick={() => void loadCelestialTelemetry(lat, lon)}
              >
                Recompute Ephemeris
              </Button>
              {prayers?.qiblaAzimuthDeg !== undefined ? (
                <Badge variant="outline">QIBLA AZIMUTH: {prayers.qiblaAzimuthDeg}°</Badge>
              ) : null}
            </div>

            {prayers?.timings ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-6 font-mono text-xs">
                {Object.entries(prayers.timings).map(([name, time]) => (
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
