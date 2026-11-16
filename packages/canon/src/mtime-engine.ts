export type MTimeProfileId = "MABIMS_ID_2026" | "DIYANET_1978";
export type MTimeAltitudeBasis = "TOPOCENTRIC" | "GEOCENTRIC" | "UNKNOWN";
export type MTimeElongationBasis =
  "GEOCENTRIC_CENTER_TO_CENTER" | "GEOCENTRIC_APPARENT" | "TOPOCENTRIC_APPARENT" | "UNKNOWN";

export interface MTimeGeometrySemantics {
  readonly altitudeBasis: MTimeAltitudeBasis;
  readonly elongationBasis: MTimeElongationBasis;
}

export interface MTimeEvaluationInput {
  readonly moonAltitudeDeg: number;
  readonly elongationDeg: number;
  readonly semantics: MTimeGeometrySemantics;
}

export interface MTimeClauseResult {
  readonly id: string;
  readonly actual: number;
  readonly threshold: number;
  readonly passed: boolean | null;
  readonly reason: string;
}

export interface MTimeCriterionEvaluation {
  readonly profileId: MTimeProfileId;
  readonly profileTitle: string;
  readonly verdict: "MET" | "NOT_MET" | "SEMANTICALLY_INCOMPATIBLE";
  readonly computedAction:
    "BEGIN_NEW_MONTH_NEXT_LOCAL_DAY" | "COMPLETE_CURRENT_MONTH_TO_30_DAYS" | "UNKNOWN";
  readonly provenance: string;
  readonly observationIsSeparate: true;
  readonly authorityIsSeparate: true;
  readonly clauses: readonly MTimeClauseResult[];
}

export interface MTimeObserverSite {
  readonly id: string;
  readonly label: string;
  readonly latDeg: number;
  readonly lonDeg: number;
}

export interface MTimeSolarLunarEstimate {
  readonly utcIso: string;
  readonly site: MTimeObserverSite;
  readonly julianDayUtc: number;
  readonly moonAgeDays: number;
  readonly illuminatedPercent: number;
  readonly elongationGeocentricDeg: number;
  readonly estimatedSunsetAltitudeDeg: number;
  readonly methodNote: string;
}

export interface MTimeHistoricalBenchmark {
  readonly id: string;
  readonly jurisdiction: "ID" | "SG" | "MY";
  readonly event: string;
  readonly criterionStatus: "MET" | "NOT_MET" | "UNKNOWN";
  readonly observationStatus: string;
  readonly authorityAction: string;
  readonly officialMonthStart: string;
  readonly sourceAuthority: string;
  readonly sourceNote: string;
}

export const MTIME_PROFILES: Record<
  MTimeProfileId,
  {
    readonly id: MTimeProfileId;
    readonly title: string;
    readonly minAltitudeDeg: number;
    readonly minElongationDeg: number;
    readonly requireCenterToCenterElongation: boolean;
    readonly provenance: string;
  }
> = {
  MABIMS_ID_2026: {
    id: "MABIMS_ID_2026",
    title: "MABIMS Indonesia (PMA No. 1 / 2026)",
    minAltitudeDeg: 3.0,
    minElongationDeg: 6.4,
    requireCenterToCenterElongation: true,
    provenance: "Kementerian Agama RI, PMA No. 1 Tahun 2026",
  },
  DIYANET_1978: {
    id: "DIYANET_1978",
    title: "Diyanet 1978 Visibility Standard",
    minAltitudeDeg: 5.0,
    minElongationDeg: 8.0,
    requireCenterToCenterElongation: false,
    provenance: "Istanbul 1978 Global Lunar Visibility Criterion",
  },
};

export const MTIME_OBSERVER_SITES: readonly MTimeObserverSite[] = [
  { id: "ID-JAKARTA", label: "Jakarta · Nusantara Meridian", latDeg: -6.2088, lonDeg: 106.8456 },
  { id: "ID-ACEH", label: "Lhoknga · Aceh Western Point", latDeg: 5.4622, lonDeg: 95.2439 },
  { id: "SA-MAKKAH", label: "Makkah · Al-Mukarramah", latDeg: 21.4225, lonDeg: 39.8262 },
  { id: "UZ-SAMARKAND", label: "Samarkand · Ulugh Observatory", latDeg: 39.6542, lonDeg: 66.9597 },
] as const;

export const MTIME_HISTORICAL_BENCHMARKS: readonly MTimeHistoricalBenchmark[] = [
  {
    id: "ID-RAMADAN-1447",
    jurisdiction: "ID",
    event: "RAMADAN_1447",
    criterionStatus: "NOT_MET",
    observationStatus: "NOT_SIGHTED",
    authorityAction: "COMPLETE_CURRENT_MONTH_TO_30_DAYS",
    officialMonthStart: "2026-02-19",
    sourceAuthority: "Kementerian Agama Republik Indonesia",
    sourceNote: "Published national hilal altitude remains below the horizon (96 sites).",
  },
  {
    id: "ID-SHAWWAL-1447",
    jurisdiction: "ID",
    event: "SHAWWAL_1447",
    criterionStatus: "NOT_MET",
    observationStatus: "NOT_SIGHTED",
    authorityAction: "COMPLETE_CURRENT_MONTH_TO_30_DAYS",
    officialMonthStart: "2026-03-21",
    sourceAuthority: "Kementerian Agama Republik Indonesia",
    sourceNote:
      "Published ranges remain below MABIMS criterion and no sighting was accepted (117 sites).",
  },
  {
    id: "ID-DHULHIJJAH-1447",
    jurisdiction: "ID",
    event: "DHULHIJJAH_1447",
    criterionStatus: "MET",
    observationStatus: "SIGHTED",
    authorityAction: "BEGIN_NEW_MONTH_NEXT_DAY",
    officialMonthStart: "2026-05-18",
    sourceAuthority: "Kementerian Agama Republik Indonesia",
    sourceNote: "Published national altitude and elongation ranges exceed MABIMS thresholds.",
  },
  {
    id: "ID-RAMADAN-1446",
    jurisdiction: "ID",
    event: "RAMADAN_1446",
    criterionStatus: "MET",
    observationStatus: "SIGHTED",
    authorityAction: "BEGIN_NEW_MONTH_NEXT_DAY",
    officialMonthStart: "2025-03-01",
    sourceAuthority: "Kementerian Agama Republik Indonesia",
    sourceNote: "Parts of Indonesia reached >= 3° / 6.4° with two sworn Aceh sightings.",
  },
] as const;

/**
 * Evaluates a calendar criterion profile strictly preserving semantic compatibility between physical basis
 * (topocentric altitude + geocentric center-to-center elongation) and policy rule evaluation.
 */
export function evaluateMTimeCriterion(
  profileId: MTimeProfileId,
  input: MTimeEvaluationInput,
): MTimeCriterionEvaluation {
  const profile = MTIME_PROFILES[profileId];

  const altSemanticOk = input.semantics.altitudeBasis === "TOPOCENTRIC";
  const elongSemanticOk = profile.requireCenterToCenterElongation
    ? input.semantics.elongationBasis === "GEOCENTRIC_CENTER_TO_CENTER"
    : input.semantics.elongationBasis !== "UNKNOWN";

  const altClause: MTimeClauseResult = !altSemanticOk
    ? {
        id: "ALTITUDE_TOPOCENTRIC",
        actual: input.moonAltitudeDeg,
        threshold: profile.minAltitudeDeg,
        passed: null,
        reason: "Incompatible altitude basis (requires TOPOCENTRIC geometry).",
      }
    : {
        id: "ALTITUDE_TOPOCENTRIC",
        actual: input.moonAltitudeDeg,
        threshold: profile.minAltitudeDeg,
        passed: input.moonAltitudeDeg >= profile.minAltitudeDeg,
        reason:
          input.moonAltitudeDeg >= profile.minAltitudeDeg
            ? `${input.moonAltitudeDeg.toFixed(2)}° passes >= ${profile.minAltitudeDeg.toFixed(1)}°`
            : `${input.moonAltitudeDeg.toFixed(2)}° below ${profile.minAltitudeDeg.toFixed(1)}° threshold`,
      };

  const elongClause: MTimeClauseResult = !elongSemanticOk
    ? {
        id: "ELONGATION_GEOCENTRIC",
        actual: input.elongationDeg,
        threshold: profile.minElongationDeg,
        passed: null,
        reason: "Incompatible elongation semantics for selected calendar profile.",
      }
    : {
        id: "ELONGATION_GEOCENTRIC",
        actual: input.elongationDeg,
        threshold: profile.minElongationDeg,
        passed: input.elongationDeg >= profile.minElongationDeg,
        reason:
          input.elongationDeg >= profile.minElongationDeg
            ? `${input.elongationDeg.toFixed(2)}° passes >= ${profile.minElongationDeg.toFixed(1)}°`
            : `${input.elongationDeg.toFixed(2)}° below ${profile.minElongationDeg.toFixed(1)}° threshold`,
      };

  const clauses = [altClause, elongClause] as const;
  if (altClause.passed === null || elongClause.passed === null) {
    return {
      profileId,
      profileTitle: profile.title,
      verdict: "SEMANTICALLY_INCOMPATIBLE",
      computedAction: "UNKNOWN",
      provenance: profile.provenance,
      observationIsSeparate: true,
      authorityIsSeparate: true,
      clauses,
    };
  }

  const allMet = altClause.passed && elongClause.passed;
  return {
    profileId,
    profileTitle: profile.title,
    verdict: allMet ? "MET" : "NOT_MET",
    computedAction: allMet ? "BEGIN_NEW_MONTH_NEXT_LOCAL_DAY" : "COMPLETE_CURRENT_MONTH_TO_30_DAYS",
    provenance: profile.provenance,
    observationIsSeparate: true,
    authorityIsSeparate: true,
    clauses,
  };
}

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const SYNODIC_MONTH_DAYS = 29.530588861;
// Reference J2000 new-moon epoch (Jan 6, 2000 18:14 UT -> JD 2451550.25972)
const REF_NEW_MOON_JD = 2451550.25972;

function normalizeDeg(deg: number): number {
  const m = deg % 360;
  return m < 0 ? m + 360 : m;
}

/**
 * Low-order explainable solar-lunar geometric estimator (explicitly labeled non-authoritative educational layer).
 * Mirrors M-Time separation rule: mathematical astronomy is distinct from Rukyat observation and official calendar decree.
 */
export function computeMTimeSolarLunarEstimate(
  dateIsoInput: string,
  site: MTimeObserverSite = MTIME_OBSERVER_SITES[0]!,
): MTimeSolarLunarEstimate {
  const parsedMs = Date.parse(dateIsoInput);
  const effectiveDate = Number.isFinite(parsedMs)
    ? new Date(parsedMs)
    : new Date("2026-03-19T11:00:00Z");
  const jdUtc = effectiveDate.getTime() / 86400000 + 2440587.5;
  const daysSinceJ2000 = jdUtc - 2451545.0;

  // Sun mean longitude & anomaly (Meeus Ch. 25 low-precision)
  const sunMeanAnomaly = normalizeDeg(357.5291 + 0.98560028 * daysSinceJ2000);
  const sunMeanLong = normalizeDeg(280.46646 + 0.98564736 * daysSinceJ2000);
  const sunEclipticLong = normalizeDeg(
    sunMeanLong +
      1.9146 * Math.sin(sunMeanAnomaly * DEG_TO_RAD) +
      0.02 * Math.sin(2 * sunMeanAnomaly * DEG_TO_RAD),
  );

  // Moon mean longitude, anomaly & elongation (Meeus Ch. 47 first harmonic terms)
  const moonMeanLong = normalizeDeg(218.3165 + 13.17639648 * daysSinceJ2000);
  const moonMeanElong = normalizeDeg(297.8502 + 12.19074912 * daysSinceJ2000);
  const moonMeanAnomaly = normalizeDeg(134.9634 + 13.06499295 * daysSinceJ2000);
  const moonArgLat = normalizeDeg(93.2721 + 13.22935024 * daysSinceJ2000);

  const moonEclipticLong = normalizeDeg(
    moonMeanLong +
      6.2886 * Math.sin(moonMeanAnomaly * DEG_TO_RAD) +
      1.274 * Math.sin((2 * moonMeanElong - moonMeanAnomaly) * DEG_TO_RAD) +
      0.6583 * Math.sin(2 * moonMeanElong * DEG_TO_RAD) +
      0.2136 * Math.sin(2 * moonMeanAnomaly * DEG_TO_RAD),
  );
  const moonEclipticLat = 5.1282 * Math.sin(moonArgLat * DEG_TO_RAD);

  const deltaLonRad = (moonEclipticLong - sunEclipticLong) * DEG_TO_RAD;
  const latRad = moonEclipticLat * DEG_TO_RAD;
  const elongationRad = Math.acos(
    Math.max(-1, Math.min(1, Math.cos(latRad) * Math.cos(deltaLonRad))),
  );
  const elongationGeocentricDeg = Number((elongationRad * RAD_TO_DEG).toFixed(2));
  const illuminatedPercent = Number((((1 - Math.cos(elongationRad)) / 2) * 100).toFixed(1));

  // Synodic phase age approximation
  const rawCycles = (jdUtc - REF_NEW_MOON_JD) / SYNODIC_MONTH_DAYS;
  const phaseFraction = rawCycles - Math.floor(rawCycles);
  const moonAgeDays = Number((phaseFraction * SYNODIC_MONTH_DAYS).toFixed(2));

  // Topocentric horizon approximation factoring observer latitude projection at dusk meridian
  const latCos = Math.max(0.25, Math.cos(site.latDeg * DEG_TO_RAD));
  const forwardDeltaDeg = normalizeDeg(moonEclipticLong - sunEclipticLong);
  const signedEclipticLead = forwardDeltaDeg > 180 ? forwardDeltaDeg - 360 : forwardDeltaDeg;
  const estimatedSunsetAltitudeDeg = Number(
    (signedEclipticLead * 0.86 * latCos + moonEclipticLat * 0.7 - 0.83).toFixed(2),
  );

  return {
    utcIso: effectiveDate.toISOString(),
    site,
    julianDayUtc: Number(jdUtc.toFixed(4)),
    moonAgeDays,
    illuminatedPercent,
    elongationGeocentricDeg,
    estimatedSunsetAltitudeDeg,
    methodNote:
      "EDUCATIONAL_LOW_ORDER_EPHEMERIS: Transparent first-harmonic solar-lunar estimation; separate from JPL SPK ephemerides, Rukyat observation, and official religious decree.",
  };
}
