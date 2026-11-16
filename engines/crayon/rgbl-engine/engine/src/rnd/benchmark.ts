export const BENCHMARK_DIMENSIONS = ["rAccuracy","gSupport","bInterpretiveDiscipline","lResponsibility","provenance","unknownHonesty","alternativeCoverage","confidenceCalibration","actionUsefulness"] as const;
export type BenchmarkDimension = (typeof BENCHMARK_DIMENSIONS)[number];
export type BenchmarkScores = Record<BenchmarkDimension, number>;
export interface BenchmarkScore {raw:number;max:number;normalized:number;dimensions:BenchmarkScores;}
export function scoreBenchmark(dimensions: BenchmarkScores): BenchmarkScore {
  for (const key of BENCHMARK_DIMENSIONS) {
    const value = dimensions[key];
    if (!Number.isFinite(value) || value < 0 || value > 4) throw new RangeError(`${key} must be between 0 and 4.`);
  }
  const raw = BENCHMARK_DIMENSIONS.reduce((sum,key)=>sum+dimensions[key],0);
  const max = BENCHMARK_DIMENSIONS.length * 4;
  return {raw,max,normalized:raw/max,dimensions};
}
