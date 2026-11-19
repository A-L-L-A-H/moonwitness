"use client";

import { useCallback, useEffect, useState } from "react";
import { requestApiJson } from "@moonwitness/contracts/sdk";
import { SkinOrnament } from "@moonwitness/ui";
import { DnaBadge, DnaButton, SacredCornerBrackets } from "@moonwitness/ui/imperium";
import { useSanctuaryLocale } from "@/lib/sanctuary-locale";
import { useCurrentIdentity } from "@/lib/session";

interface LiveNowPayload {
  hijri?: { year?: number; month?: number; day?: number; monthName?: string };
  lunar?: { phaseName?: string; illumination?: number; elongationDeg?: number };
}

interface LivePrayerTimesPayload {
  date?: string;
  convention?: string;
  fajr?: string;
  sunrise?: string;
  dhuhr?: string;
  asr?: string;
  maghrib?: string;
  isha?: string;
  qibla_bearing?: number;
}

interface LiveHilalPayload {
  altitude_deg?: number;
  elongation_deg?: number;
  crescent_width_arcmin?: number;
  mabims_criterion?: { status?: string; passed?: boolean; description?: string };
  odeh_criterion?: { category?: string; v_value?: number; description?: string };
  overall_verdict?: string;
}

interface LiveQiblaPayload {
  qibla_bearing_deg?: number;
  cardinal_direction?: string;
  distance_to_kabah_km?: number;
}

interface LiveObservatorySummaryPayload {
  feeds?: number;
  operations?: number;
}

export function MTimeLiveTelemetryPanel({
  lat = -6.2088,
  lon = 106.8456,
}: {
  lat?: number;
  lon?: number;
}) {
  const { locale } = useSanctuaryLocale();
  const session = useCurrentIdentity();
  const canRefreshFeed = session?.role === "admin" || session?.role === "editor";
  const [prayers, setPrayers] = useState<LivePrayerTimesPayload | null>(null);
  const [hilal, setHilal] = useState<LiveHilalPayload | null>(null);
  const [qiblaDeg, setQiblaDeg] = useState<number | null>(null);
  const [obsSummary, setObsSummary] = useState<LiveObservatorySummaryPayload | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLiveTelemetry = useCallback(async () => {
    setRefreshing(true);
    const coords = `lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lon))}`;
    try {
      const [nowRes, pRes, qRes, oRes] = await Promise.all([
        requestApiJson<LiveNowPayload>(`/api/v1/celestial/now?${coords}`).catch(() => null),
        requestApiJson<LivePrayerTimesPayload>(`/api/v1/celestial/prayer-times?${coords}`).catch(
          () => null,
        ),
        requestApiJson<LiveQiblaPayload>(`/api/v1/celestial/qibla?${coords}`).catch(() => null),
        requestApiJson<LiveObservatorySummaryPayload>("/api/v1/observatory/summary").catch(
          () => null,
        ),
      ]);
      const elongation = Number.isFinite(nowRes?.lunar?.elongationDeg)
        ? Number(nowRes!.lunar!.elongationDeg).toFixed(2)
        : "6.80";
      const hRes = await requestApiJson<LiveHilalPayload>(
        `/api/v1/celestial/hilal?altitude=3.50&elongation=${encodeURIComponent(elongation)}&width=0.35`,
      ).catch(() => null);
      if (pRes) setPrayers(pRes);
      if (hRes) setHilal(hRes);
      if (qRes?.qibla_bearing_deg !== undefined) setQiblaDeg(qRes.qibla_bearing_deg);
      if (oRes) setObsSummary(oRes);
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
      if (canRefreshFeed) {
        await requestApiJson("/api/v1/observatory/refresh/noaa_kp_index", {
          method: "POST",
        }).catch(() => null);
      }
      await fetchLiveTelemetry();
    } finally {
      setRefreshing(false);
    }
  }

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
    <section className="relative border border-[var(--dna-accent)]/30 bg-[var(--dna-canvas)] p-6 sm:p-8 space-y-4">
      <SacredCornerBrackets />
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--dna-accent)]/20 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-monument text-base sm:text-lg tracking-[0.16em] text-[var(--dna-text)] uppercase">
            {locale === "id"
              ? "TELEMETRI LANGIT & JADWAL SALAT API LANGSUNG"
              : locale === "ar"
                ? "القياس الفلكي الحي · مواقيت الصلاة والقبلة"
                : "LIVE CELESTIAL API TELEMETRY · PRAYER SCHEDULE & QIBLA"}
          </h2>
          <SkinOrnament slot="tag" label="CELESTIAL + OBSERVATORY ADDONS" />
        </div>
        <div className="flex items-center gap-2">
          <DnaBadge className="font-mono text-[10px]">
            QIBLA: {qiblaDeg ?? prayers?.qibla_bearing ?? "295.15"}°
          </DnaBadge>
          <DnaBadge className="font-mono text-[10px]">
            FEEDS: {obsSummary?.feeds ?? 0} · OPS: {obsSummary?.operations ?? 0}
          </DnaBadge>
          <DnaButton
            tone="secondary"
            onClick={() => void handleRefreshFeed()}
            className="px-3 py-1 font-mono text-[10px] text-[var(--dna-accent)]"
          >
            {refreshing ? "SYNCING…" : canRefreshFeed ? "SYNC EPHEMERIS FEED" : "REFRESH TELEMETRY"}
          </DnaButton>
        </div>
      </div>

      {prayerEntries.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-6 font-mono text-xs">
          {prayerEntries.map(([name, time]) => (
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
          Live celestial API telemetry ready (GET /api/v1/celestial/prayer-times, hilal, qibla).
        </div>
      )}

      {hilal ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border border-[var(--dna-accent)]/25 bg-[var(--dna-surface)] px-4 py-2.5 font-mono text-xs">
          <span>
            API HILAL VERDICT:{" "}
            <strong className="text-[var(--dna-accent)]">
              {hilal.overall_verdict ??
                (hilal.mabims_criterion?.passed ? "MABIMS_PASS" : "IMKAN_BELOW_THRESHOLD")}
            </strong>
          </span>
          <span className="text-[var(--dna-muted)]">
            ALT: {hilal.altitude_deg ?? 0}° · ELONG: {hilal.elongation_deg ?? 0}°
          </span>
        </div>
      ) : null}
    </section>
  );
}
export default MTimeLiveTelemetryPanel;
