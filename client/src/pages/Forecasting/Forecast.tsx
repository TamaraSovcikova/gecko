import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { TrendingUp, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getForecast } from "../../api/forecastApi";
import { ForecastPayload } from "../../types/forecast";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";

const COLORS = ["#8b6fd4", "#f0b429", "#5bb8c4", "#e05c5c", "#a3d977", "#f0855a"];

type ProjectionEntry = {
  finalForecast: number;
  lowerBound?: number;
  upperBound?: number;
  trend?: "up" | "down" | "stable";
  anomaly?: boolean;
  confidence?: number;
};

const TrendIcon = ({ trend }: { trend?: string }) => {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-red-500" />;
  if (trend === "down") return <TrendingUp className="h-4 w-4 text-emerald-500 rotate-180" />;
  return <span className="h-4 w-4 inline-block text-center text-gecko-muted">-</span>;
};

const Forecast = () => {
  const { token, loading } = useAuth();
  const [forecast, setForecast] = useState<ForecastPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  const isForecastDisabled = import.meta.env.VITE_DISABLE_FORECAST === "true";

  useEffect(() => {
    if (loading || !token) return;
    if (isForecastDisabled) {
      setForecast({ projections: {} } as ForecastPayload);
      return;
    }
    setFetching(true);
    getForecast(token)
      .then((data) => {
        setForecast(data);
        setError(null);
      })
      .catch(() => setError("Failed to load forecast"))
      .finally(() => setFetching(false));
  }, [token, loading, isForecastDisabled]);

  if (loading || fetching) {
    return (
      <div className="app-page">
        <div className="max-w-screen-lg mx-auto space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  const projections = forecast?.projections ?? {};
  const entries = Object.entries(projections) as [string, ProjectionEntry][];
  const isEmpty = entries.length === 0;

  const chartData = entries.map(([category, data]) => ({
    name: category,
    forecast: Number(data.finalForecast?.toFixed(2) ?? 0),
    lower: Number((data.lowerBound ?? data.finalForecast * 0.85)?.toFixed(2)),
    upper: Number((data.upperBound ?? data.finalForecast * 1.15)?.toFixed(2)),
    anomaly: data.anomaly,
    trend: data.trend,
  }));

  const totalForecast = entries.reduce((sum, [, d]) => sum + (d.finalForecast ?? 0), 0);
  const anomalyCount = entries.filter(([, d]) => d.anomaly).length;

  return (
    <div className="app-page">
      <div className="max-w-screen-lg mx-auto pb-8">
        <div className="mb-6 mt-2">
          <p className="app-section-eyebrow">Forecasting</p>
          <h1 className="app-page-title mt-2">Spending Forecast</h1>
          <p className="text-gecko-muted text-sm mt-1">
            Projected spend for next month based on your historical patterns.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-6">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-lg p-8 text-center"
          >
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-2">No forecast data yet</h3>
            <p className="text-sm text-gecko-muted">Start logging expenses to generate spending forecasts.</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <p className="text-xs font-semibold text-gecko-muted uppercase tracking-wider mb-1">Total projected</p>
                <p className="text-2xl font-bold text-gray-900">
                  {"\xA3"}
                  {totalForecast.toFixed(2)}
                </p>
                <p className="text-xs text-gecko-muted mt-1">Next month</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <p className="text-xs font-semibold text-gecko-muted uppercase tracking-wider mb-1">
                  Categories tracked
                </p>
                <p className="text-2xl font-bold text-gray-900">{entries.length}</p>
                <p className="text-xs text-gecko-muted mt-1">Spend categories</p>
              </div>
              {anomalyCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Anomalies</p>
                  <p className="text-2xl font-bold text-amber-700">{anomalyCount}</p>
                  <p className="text-xs text-amber-600 mt-1">Unusual patterns</p>
                </div>
              )}
            </div>

            {/* Bar chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-800">Projected Spend by Category</h4>
                <div className="flex items-center gap-1.5 text-xs text-gecko-muted">
                  <Info className="h-3.5 w-3.5" />
                  Shading shows confidence range
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `\xA3${v}`} />
                  <Tooltip
                    formatter={(v: any, name: string) => [`\xA3${Number(v).toFixed(2)}`, name]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "12px" }}
                  />
                  <ReferenceLine y={0} stroke="#E5E7EB" />
                  <Bar dataKey="forecast" radius={[4, 4, 0, 0]} name="Forecast">
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.anomaly ? "#f0b429" : COLORS[index % COLORS.length]}
                        opacity={entry.anomaly ? 1 : 0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Detail rows */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h4 className="text-sm font-semibold text-gray-800">Category Breakdown</h4>
              </div>
              <div className="divide-y divide-gray-100">
                {entries.map(([category, data], index) => {
                  const pct = totalForecast > 0 ? (data.finalForecast / totalForecast) * 100 : 0;
                  const confidence = data.confidence ?? 70;
                  return (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="px-5 py-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{ background: data.anomaly ? "#f0b429" : COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm font-semibold text-gray-800 truncate">{category}</span>
                          {data.anomaly && (
                            <Badge variant="warning" className="shrink-0">
                              anomaly
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <TrendIcon trend={data.trend} />
                          <span className="text-sm font-bold text-gray-900">
                            {"\xA3"}
                            {Number(data.finalForecast).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {/* confidence range */}
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-purple-600 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gecko-muted shrink-0">{pct.toFixed(1)}% of total</span>
                        <span
                          className={cn(
                            "text-xs font-semibold shrink-0",
                            confidence >= 70 ? "text-emerald-600" : "text-amber-600"
                          )}
                        >
                          {confidence}% conf.
                        </span>
                      </div>
                      {data.lowerBound !== undefined && data.upperBound !== undefined && (
                        <p className="mt-1 text-xs text-gecko-muted">
                          Range: {"\xA3"}
                          {Number(data.lowerBound).toFixed(2)} - {"\xA3"}
                          {Number(data.upperBound).toFixed(2)}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Info box */}
            <div className="bg-slate-50 border border-gray-200 rounded-lg p-4 flex gap-3">
              <CheckCircle2 className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-800">
                Forecasts use an ensemble model combining linear regression, seasonal patterns, and a 3-month rolling
                median. Confidence levels indicate how consistent your historical spending has been in each category.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Forecast;
