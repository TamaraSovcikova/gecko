// Approximate UK graduate financial benchmarks, ONS / MAS data 2024
// All percentage figures are % of monthly take-home pay

export const BENCHMARKS = {
  HOUSING_PCT: { p25: 22, median: 28, p75: 35 },
  FOOD_PCT: { p25: 8, median: 13, p75: 19 },
  TRANSPORT_PCT: { p25: 5, median: 9, p75: 14 },
  SAVINGS_RATE: { p25: 3, median: 7, p75: 15 },

  HOUSING_KEYS: ["housing", "rent", "mortgage"] as const,
  FOOD_KEYS: ["food", "groceries", "eating", "dining"] as const,
  TRANSPORT_KEYS: ["transport", "travel", "commute", "car"] as const,
  SAVINGS_KEYS: ["savings", "saving", "pension"] as const,
} as const;

export type BenchmarkBand = { p25: number; median: number; p75: number };

export function getBenchmarkBand(categoryName: string): { band: BenchmarkBand; label: string } | null {
  const lower = categoryName.toLowerCase();
  if (BENCHMARKS.HOUSING_KEYS.some((k) => lower.includes(k))) return { band: BENCHMARKS.HOUSING_PCT, label: "housing" };
  if (BENCHMARKS.FOOD_KEYS.some((k) => lower.includes(k))) return { band: BENCHMARKS.FOOD_PCT, label: "food" };
  if (BENCHMARKS.TRANSPORT_KEYS.some((k) => lower.includes(k)))
    return { band: BENCHMARKS.TRANSPORT_PCT, label: "transport" };
  return null;
}

export function benchmarkPosition(pct: number, band: BenchmarkBand): "low" | "median" | "high" | "very_high" {
  if (pct <= band.p25) return "low";
  if (pct <= band.median) return "median";
  if (pct <= band.p75) return "high";
  return "very_high";
}
