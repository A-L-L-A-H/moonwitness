"use client";

import { useCallback, useEffect, useState } from "react";
import { requestApiJson } from "@moonwitness/contracts/sdk";
import { SkinOrnament } from "@moonwitness/ui";
import { DnaBadge, DnaButton, SacredCornerBrackets } from "@moonwitness/ui/imperium";
import { useSanctuaryLocale } from "@/lib/sanctuary-locale";

interface LivePrayerTimesPayload {
  data?: {
    timings?: Record<string, string>;
    qiblaAzimuthDeg?: number;
  };
}

interface LiveHilalPayload {
  data?: {
    elongationDeg?: number;
    moonAltitudeDeg?: number;
    illuminatedFraction?: number;
    mabimsPassed?: boolean;
    verdict?: string;
  };
}

interface LiveObservatorySummaryPayload {
  data?: {
    totalFeeds?: number;
    healthyFeeds?: number;
    totalSnapshots?: number;
  };
}

export function MTimeLiveTelemetryPanel({
  lat = -6.2088,
  lon = 106.8456,
}: {
  lat?: number;
  lon?: number;
}) {
  const { locale } = useSanctuaryLocale();
  const [prayers, setPrayers] = useState<LivePrayerTimesPayload["data"] | null>(null);
  const [hilal, setHilal] = useState<LiveHilalPayload["data"] | null>(null);
  const [qiblaDeg, setQiblaDeg] = useState<number | null>(null);
  const [obsSummary, setObsSummary] = useState<LiveObservatorySummaryPayload["data"] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLiveTelemetry = useCallback(async () => {
    setRefreshing(true);
    const coords = `lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}`;
    try {
      const [pRes, hRes, qRes, oRes] = await Promise.all([
        requestApiJson<LivePrayerTimesPayload>(`/api/v1/celestial/prayer-times?${coords}`).catch(
          () => null,
        ),
        requestApiJson<LiveHilalPayload>(`/api/v1/celestial/hilal?${coords}`).catch(() => null),
        requestApiJson<{ data?: { azimuthDeg?: number } }>(`/api/v1/celestial/qibla?${coords}`).catch(
          () => null,
        ),
        requestApiJson<LiveObservatorySummaryPayload>("/api/v1/observatory/summary").catch(
          () => null,
        ),
      ]);
      if (pRes?.data) setPrayers(pRes.data);
      if (hRes?.data) setHilal(hRes.data);
      if (qRes?.data?.azimuthDeg !== undefined) setQiblaDeg(qRes.data.azimuthDeg);
      if (oRes?.data) setObsSummary(oRes.data);
    } finally {
      setRefreshing(false);
    }
  }, [lat, lon]);

  useEffect(() => {
    void fetchLiveTelemetry();
  }, [fetchLiveTelemetry]);

  async function handleRefreshFeed() {
    setRefreshing(true);
    try {
      await requestApiJson("/api/v1/observatory/refresh/celestial-ephemeris", {
        method: "POST",
      }).catch(() => null);
      await fetchLiveTelemetry();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <section className="relative border border-[var(--dna-accent)]/30 bg-[var(--dna-canvas)] p-6 sm:p-8 space-y-4">
      <SacredCornerBrackets />
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--dna-accent)]/20 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-monument text-base sm:text-lg tracking-[0.16em] text-[var(--dna-text)] uppercase">
            {locale === "id"
              ? "TELEMETRI LANGIT & JADWAL SALAT API LANGSUNG"
              : "LIVE CELESTIAL API TELEMETRY · PRAYER SCHEDULE & QIBLA"}
          </h2>
          <SkinOrnament slot="tag" label="CELESTIAL + OBSERVATORY ADDONS" />
        </div>
        <div className="flex items-center gap-2">
          <DnaBadge className="font-mono text-[10px]">
            QIBLA: {qiblaDeg ?? prayers?.qiblaAzimuthDeg ?? "295.15"}°
          </DnaBadge>
          <DnaBadge className="font-mono text-[10px]">
            FEEDS: {obsSummary?.healthyFeeds ?? 0}/{obsSummary?.totalFeeds ?? 0}
          </DnaBadge>
          <DnaButton
            tone="secondary"
            onClick={() => void handleRefreshFeed()}
            className="px-3 py-1 font-mono text-[10px] text-[var(--dna-accent)]"
          >
            {refreshing ? "SYNCING…" : "SYNC EPHEMERIS FEED"}
          </DnaButton>
        </div>
      </div>

      {prayers?.timings ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-6 font-mono text-xs">
          {Object.entries(prayers.timings).map(([name, time]) => (
            <div
              key={name}
              className="border border-[var(--dna-accent)]/25 bg-[var(--dna-surface)] p-3"
            >
              <div className="text-[10px] uppercase text-[var(--dna-muted)]">{name}</div>
              <div className="mt-1 text-sm font-bold text-[var(--dna-text)]">{time}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="font-mono text-xs text-[var(--dna-muted)]">
          Live celestial API telemetry ready (`GET /api/v1/celestial/prayer-times`, `hilal`, `qibla`).
        </div>
      )}

      {hilal ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border border-[var(--dna-accent)]/25 bg-[var(--dna-surface)] px-4 py-2.5 font-mono text-xs">
          <span>
            API HILAL VERDICT:{" "}
            <strong className="text-[var(--dna-accent)]">
              {hilal.verdict ?? (hilal.mabimsPassed ? "MABIMS_PASS" : "IMKAN_BELOW_THRESHOLD")}
            </strong>
          </span>
          <span className="text-[var(--dna-muted)]">
            ALT: {hilal.moonAltitudeDeg ?? 0}° · ELONG: {hilal.elongationDeg ?? 0}°
          </span>
        </div>
      ) : null}
    </section>
  );
}
export default MTimeLiveTelemetryPanel;
