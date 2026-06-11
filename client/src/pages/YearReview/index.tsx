import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarRange, TrendingUp, TrendingDown, Heart, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { fmt } from "../../lib/ukTaxCalc";
import { cn } from "../../lib/utils";
import axios from "axios";

type Snapshot = {
  month: number;
  year: number;
  grossSalary: number;
  takeHomePay: number;
  totalExpenses: number;
  savings: number;
  healthScore: number;
  xpEarned: number;
  quizzesCompleted: number;
  categories: { name: string; budget: number; actual: number }[];
};

function getTaxYear(date: Date): { start: Date; end: Date; label: string } {
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  const startYear = m >= 4 ? y : y - 1;
  return {
    start: new Date(startYear, 3, 6),
    end: new Date(startYear + 1, 3, 5),
    label: `${startYear}/${String(startYear + 1).slice(2)}`,
  };
}

function monthsInTaxYear(taxYear: { start: Date; end: Date }): { month: number; year: number }[] {
  const months = [];
  const cursor = new Date(taxYear.start);
  while (cursor <= taxYear.end) {
    months.push({ month: cursor.getMonth() + 1, year: cursor.getFullYear() });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={cn("bg-white border rounded-xl p-4", accent ? "border-purple-200" : "border-gray-200")}>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={cn("text-2xl font-bold", accent ? "text-purple-700" : "text-gray-900")}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function YearReviewPage() {
  const { currentUser } = useAuth();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [taxYearOffset, setTaxYearOffset] = useState(0); // 0 = current, -1 = previous

  const today = new Date();
  const targetDate = new Date(today.getFullYear() + taxYearOffset, today.getMonth(), today.getDate());
  const taxYear = getTaxYear(targetDate);
  const monthKeys = monthsInTaxYear(taxYear);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    currentUser.getIdToken().then((token) => {
      axios
        .get(`${import.meta.env.VITE_API_URL}/api/v1/snapshots`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const all: Snapshot[] = Array.isArray(res.data) ? res.data : (res.data.snapshots ?? []);
          setSnapshots(all);
        })
        .catch(() => setSnapshots([]))
        .finally(() => setLoading(false));
    });
  }, [currentUser]);

  const yearSnapshots = snapshots.filter((s) => monthKeys.some((mk) => mk.month === s.month && mk.year === s.year));

  const totalTakeHome = yearSnapshots.reduce((acc, s) => acc + s.takeHomePay, 0);
  const totalExpenses = yearSnapshots.reduce((acc, s) => acc + s.totalExpenses, 0);
  const totalSavings = yearSnapshots.reduce((acc, s) => acc + s.savings, 0);
  const totalXP = yearSnapshots.reduce((acc, s) => acc + s.xpEarned, 0);
  const totalQuizzes = yearSnapshots.reduce((acc, s) => acc + s.quizzesCompleted, 0);
  const avgHealth = yearSnapshots.length
    ? Math.round(yearSnapshots.reduce((acc, s) => acc + s.healthScore, 0) / yearSnapshots.length)
    : 0;

  const grossAnnual = yearSnapshots[0]?.grossSalary ?? 0;
  const estimatedTax = grossAnnual > 0 ? grossAnnual - (totalTakeHome / Math.max(yearSnapshots.length, 1)) * 12 : 0;
  const estimatedTaxTotal = Math.max(0, estimatedTax > 0 ? estimatedTax * (yearSnapshots.length / 12) : 0);

  const categoryTotals: Record<string, number> = {};
  for (const s of yearSnapshots) {
    for (const cat of s.categories) {
      categoryTotals[cat.name] = (categoryTotals[cat.name] ?? 0) + cat.actual;
    }
  }
  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const monthsOfData = yearSnapshots.length;
  const hasData = monthsOfData > 0;

  return (
    <div className="app-page">
      <div className="max-w-2xl mx-auto pb-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <CalendarRange className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Year Review</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Tax year {taxYear.label}</h1>
            <div className="flex items-center gap-1 ml-auto">
              <button
                type="button"
                onClick={() => setTaxYearOffset((o) => o - 1)}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                title="Previous year"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <button
                type="button"
                onClick={() => setTaxYearOffset((o) => Math.min(0, o + 1))}
                disabled={taxYearOffset >= 0}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40"
                title="Next year"
              >
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            6 April {taxYear.start.getFullYear()} to 5 April {taxYear.end.getFullYear()}
            {monthsOfData > 0 && ` — ${monthsOfData} month${monthsOfData !== 1 ? "s" : ""} of data`}
          </p>
        </motion.div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !hasData ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-gray-50 border border-gray-200 rounded-xl"
          >
            <CalendarRange className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-500 mb-1">No data for this tax year yet</p>
            <p className="text-xs text-gray-400">
              Monthly snapshots are saved automatically. Come back after a few months of tracking.
            </p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {/* Main stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total take-home" value={fmt(totalTakeHome, 0)} sub={`across ${monthsOfData} months`} />
              <StatCard label="Total spent" value={fmt(totalExpenses, 0)} sub="tracked expenses" />
              <StatCard label="Total saved" value={fmt(totalSavings, 0)} accent={totalSavings > 0} />
              <StatCard label="Avg health score" value={avgHealth ? `${avgHealth}/100` : "—"} sub="financial health" />
            </div>

            {/* Tax insight */}
            {estimatedTaxTotal > 500 && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-4 h-4 text-gray-500" />
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">What went to HMRC</p>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Based on your gross salary of {fmt(grossAnnual, 0)}/year, approximately{" "}
                  <strong className="text-gray-900">{fmt(estimatedTaxTotal, 0)}</strong> went to income tax and National
                  Insurance in the months tracked. That money funds public services — the NHS alone handles around 1
                  million patients every 36 hours.
                </p>
              </div>
            )}

            {/* Spending breakdown */}
            {topCategories.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Top spending categories</p>
                </div>
                <div className="space-y-3">
                  {topCategories.map(([name, amount], i) => {
                    const pct = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                    return (
                      <div key={name}>
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-xs font-medium text-gray-700">{name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-400">{pct.toFixed(0)}%</p>
                            <p className="text-xs font-semibold text-gray-900">{fmt(amount, 0)}</p>
                          </div>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: ["#7c3aed", "#2563eb", "#059669", "#d97706", "#dc2626"][i] ?? "#7c3aed",
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.7, delay: 0.1 * i }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Learning stats */}
            {(totalXP > 0 || totalQuizzes > 0) && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Learning progress</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">+{totalXP.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-0.5">XP earned</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{totalQuizzes}</p>
                    <p className="text-xs text-gray-400 mt-0.5">quizzes completed</p>
                  </div>
                </div>
              </div>
            )}

            {/* Month-by-month mini chart */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">Month by month</p>
              <div className="flex items-end gap-1.5 h-20">
                {monthKeys.map((mk) => {
                  const snap = yearSnapshots.find((s) => s.month === mk.month && s.year === mk.year);
                  const maxSpend = Math.max(...yearSnapshots.map((s) => s.totalExpenses), 1);
                  const height = snap ? Math.max(10, (snap.totalExpenses / maxSpend) * 100) : 0;
                  const monthLabel = new Date(mk.year, mk.month - 1).toLocaleString("en-GB", { month: "short" });
                  return (
                    <div key={`${mk.year}-${mk.month}`} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end justify-center" style={{ height: "64px" }}>
                        {snap ? (
                          <div
                            className="w-full rounded-t-sm bg-purple-400 transition-all"
                            style={{ height: `${height}%` }}
                            title={`${monthLabel}: ${fmt(snap.totalExpenses, 0)}`}
                          />
                        ) : (
                          <div className="w-full rounded-t-sm bg-gray-100" style={{ height: "10%" }} />
                        )}
                      </div>
                      <span className="text-[9px] text-gray-400">{monthLabel.slice(0, 1)}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-gray-400 mt-2">Monthly spending (bar height = relative spend)</p>
            </div>

            {/* Health score trend */}
            {yearSnapshots.length > 1 && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                <Heart className="w-4 h-4 text-pink-500 shrink-0" />
                <p className="text-xs text-gray-600 leading-relaxed">
                  Your average health score across these {monthsOfData} months was{" "}
                  <strong className="text-gray-900">{avgHealth}/100</strong>.{" "}
                  {avgHealth >= 70
                    ? "That's solid — keep building those habits."
                    : avgHealth >= 40
                      ? "There's room to improve — the Scenarios page can help you model changes."
                      : "Small consistent improvements compound over time."}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
