import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie,
} from "recharts";
import { TrendingUp, AlertTriangle, PieChart as PieIcon, BarChart2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { cn } from "../../lib/utils";

type MonthlyTotal = { year: number; month: number; label: string; total: number };
type CategoryTrendSlot = { label: string; categories: Record<string, number> };
type NetSavingsSlot = { label: string; income: number; expenses: number; net: number | null };
type Anomaly = { label: string; category: string; amount: number; zscore: number };
type TopCategory = { name: string; total: number; pct: number };

interface AnalyticsData {
  monthlyTotals: MonthlyTotal[];
  categoryTrend: CategoryTrendSlot[];
  netSavings: NetSavingsSlot[];
  anomalies: Anomaly[];
  topCategories: TopCategory[];
}

const PURPLE_SHADES = [
  "#7C3AED", "#8B5CF6", "#A78BFA", "#C4B5FD",
  "#DDD6FE", "#6D28D9", "#5B21B6", "#4C1D95",
];

const fmt = (n: number) =>
  n.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"trend" | "categories" | "savings" | "anomalies">("trend");

  useEffect(() => {
    if (!token) return;
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/v1/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  // Collect all category names for the stacked bar chart
  const allCategories = data
    ? Array.from(new Set(data.categoryTrend.flatMap((s) => Object.keys(s.categories))))
    : [];

  const stackedBarData = data?.categoryTrend.map((slot) => ({
    label: slot.label,
    ...slot.categories,
  }));

  const tabs = [
    { key: "trend", label: "Spend Trend", icon: TrendingUp },
    { key: "categories", label: "By Category", icon: BarChart2 },
    { key: "savings", label: "Net Savings", icon: PieIcon },
    { key: "anomalies", label: "Anomalies", icon: AlertTriangle },
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-gray-500">Failed to load analytics.</div>
    );
  }

  const hasData = data.monthlyTotals.some((m) => m.total > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 max-w-5xl mx-auto"
    >
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Analytics</h1>
      <p className="text-sm text-gray-500 mb-6">12-month spending breakdown, category trends, and anomaly detection.</p>

      {!hasData && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-amber-800 text-sm">
          No expense data yet. Add some expenses to see your analytics.
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total (12 mo)"
          value={fmt(data.monthlyTotals.reduce((s, m) => s + m.total, 0))}
        />
        <StatCard
          label="Avg / month"
          value={fmt(
            data.monthlyTotals.filter((m) => m.total > 0).length > 0
              ? data.monthlyTotals.reduce((s, m) => s + m.total, 0) /
                  data.monthlyTotals.filter((m) => m.total > 0).length
              : 0,
          )}
        />
        <StatCard
          label="Top category"
          value={data.topCategories[0]?.name || "—"}
          sub={data.topCategories[0] ? `${data.topCategories[0].pct}% of spend` : undefined}
        />
        <StatCard
          label="Anomalies"
          value={String(data.anomalies.length)}
          sub={data.anomalies.length > 0 ? "unusual spend spikes" : "all clear"}
          highlight={data.anomalies.length > 0}
        />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              activeTab === key
                ? "bg-white text-purple-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        {activeTab === "trend" && (
          <>
            <h2 className="text-base font-semibold text-gray-800 mb-4">Monthly spend — last 12 months</h2>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.monthlyTotals}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `£${v}`} tick={{ fontSize: 11 }} width={60} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#7C3AED"
                  strokeWidth={2}
                  fill="url(#spendGrad)"
                  name="Spend"
                />
              </AreaChart>
            </ResponsiveContainer>
          </>
        )}

        {activeTab === "categories" && (
          <>
            <div className="flex gap-8">
              <div className="flex-1">
                <h2 className="text-base font-semibold text-gray-800 mb-4">Spend by category — last 12 months</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stackedBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `£${v}`} tick={{ fontSize: 11 }} width={60} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {allCategories.slice(0, 8).map((cat, i) => (
                      <Bar key={cat} dataKey={cat} stackId="a" fill={PURPLE_SHADES[i % PURPLE_SHADES.length]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {data.topCategories.length > 0 && (
                <div className="w-48">
                  <h3 className="text-sm font-medium text-gray-600 mb-3">Overall split</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={data.topCategories.slice(0, 6)}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                      >
                        {data.topCategories.slice(0, 6).map((_, i) => (
                          <Cell key={i} fill={PURPLE_SHADES[i % PURPLE_SHADES.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="mt-2 space-y-1">
                    {data.topCategories.slice(0, 6).map((c, i) => (
                      <li key={c.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-sm"
                          style={{ background: PURPLE_SHADES[i % PURPLE_SHADES.length] }}
                        />
                        {c.name} ({c.pct}%)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "savings" && (
          <>
            <h2 className="text-base font-semibold text-gray-800 mb-1">Net savings rate</h2>
            <p className="text-xs text-gray-400 mb-4">
              {data.netSavings.some((s) => s.income > 0)
                ? "Based on your payslip take-home pay."
                : "Add your payslip to see income vs spend."}
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.netSavings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `£${v}`} tick={{ fontSize: 11 }} width={65} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="expenses" name="Expenses" fill="#A78BFA" />
                {data.netSavings.some((s) => s.income > 0) && (
                  <Bar dataKey="income" name="Income" fill="#7C3AED" />
                )}
                {data.netSavings.some((s) => s.net !== null) && (
                  <Bar dataKey="net" name="Net saved" fill="#10B981">
                    {data.netSavings.map((entry, i) => (
                      <Cell key={i} fill={entry.net !== null && entry.net < 0 ? "#EF4444" : "#10B981"} />
                    ))}
                  </Bar>
                )}
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        {activeTab === "anomalies" && (
          <>
            <h2 className="text-base font-semibold text-gray-800 mb-4">Spend anomalies</h2>
            <p className="text-xs text-gray-400 mb-4">
              Months where a category was more than 2 standard deviations above its average.
            </p>
            {data.anomalies.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                No anomalies detected in the last 12 months. Your spending is consistent!
              </div>
            ) : (
              <div className="space-y-3">
                {data.anomalies.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
                  >
                    <div>
                      <span className="font-medium text-gray-800">{a.category}</span>
                      <span className="text-gray-500 text-sm ml-2">in {a.label}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{fmt(a.amount)}</div>
                      <div className="text-xs text-amber-700">{a.zscore.toFixed(1)}x above average</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        highlight ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-white",
      )}
    >
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={cn("text-lg font-bold", highlight ? "text-amber-700" : "text-gray-900")}>
        {value}
      </div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}
