import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, RefreshCw, CheckCircle2, Clock, AlertTriangle, Info } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { SkeletonCard } from "../../components/ui/skeleton";
import { cn } from "../../lib/utils";

type RecurringItem = {
  category: string;
  avgAmount: number;
  avgDay: number;
  nextDate: string;
  daysUntil: number;
  paidThisMonth: boolean;
  monthsSeen: number;
  consecutiveMonths: number;
  confidence: number;
  status: "paid" | "due_soon" | "upcoming" | "scheduled";
};

const STATUS_CONFIG = {
  paid: {
    label: "Paid",
    variant: "success" as const,
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
  },
  due_soon: {
    label: "Due Soon",
    variant: "danger" as const,
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
  },
  upcoming: {
    label: "Upcoming",
    variant: "warning" as const,
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
  },
  scheduled: {
    label: "Scheduled",
    variant: "default" as const,
    icon: Calendar,
    color: "text-purple-700",
    bg: "bg-gray-50 border-purple-200",
  },
};

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CalendarView = ({ items }: { items: RecurringItem[] }) => {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const today = now.getDate();

  // Build a map of day -> items
  const dayMap: Record<number, RecurringItem[]> = {};
  for (const item of items) {
    const d = new Date(item.nextDate);
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      const day = d.getDate();
      if (!dayMap[day]) dayMap[day] = [];
      dayMap[day].push(item);
    } else if (!item.paidThisMonth) {
      if (!dayMap[item.avgDay]) dayMap[item.avgDay] = [];
      dayMap[item.avgDay].push(item);
    }
  }

  const blanks = firstDayOfMonth;
  const cells = Array.from({ length: blanks + daysInMonth }, (_, i) => (i < blanks ? null : i - blanks + 1));

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 border-b border-purple-100">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-2 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const isToday = day === today;
          const hasItems = day && dayMap[day];
          return (
            <div
              key={i}
              className={cn(
                "min-h-[60px] p-1 border-b border-r border-purple-50 last:border-r-0",
                day ? "bg-white" : "bg-gray-50/30",
                isToday ? "bg-gray-50" : ""
              )}
            >
              {day && (
                <>
                  <span
                    className={cn(
                      "inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold mb-0.5",
                      isToday ? "bg-purple-600 text-white" : "text-gray-500"
                    )}
                  >
                    {day}
                  </span>
                  {hasItems &&
                    dayMap[day]!.map((item, j) => (
                      <div
                        key={j}
                        className={cn(
                          "text-[10px] font-semibold px-1 py-0.5 rounded truncate mb-0.5",
                          item.status === "paid"
                            ? "bg-green-100 text-green-700"
                            : item.status === "due_soon"
                              ? "bg-red-100 text-red-700"
                              : item.status === "upcoming"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-purple-100 text-purple-700"
                        )}
                      >
                        {item.category} {"\xA3"}
                        {item.avgAmount}
                      </div>
                    ))}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Bills = () => {
  const { token } = useAuth();
  const [items, setItems] = useState<RecurringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<"list" | "calendar">("list");

  const now = new Date();

  const fetchRecurring = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/recurring`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(res.data.recurring || []);
    } catch {
      setError("Failed to load recurring transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecurring();
  }, [token]);

  const totalMonthlyRecurring = items.filter((i) => !i.paidThisMonth).reduce((s, i) => s + i.avgAmount, 0);
  const paidCount = items.filter((i) => i.paidThisMonth).length;
  const dueSoonCount = items.filter((i) => i.status === "due_soon").length;

  return (
    <div className="app-page">
      <main className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bills & Recurring</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {monthNames[now.getMonth()]} {now.getFullYear()} - automatically detected from your expenses
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setView("list")}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold transition-colors",
                  view === "list" ? "bg-purple-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                )}
              >
                List
              </button>
              <button
                onClick={() => setView("calendar")}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold transition-colors",
                  view === "calendar" ? "bg-purple-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                )}
              >
                Calendar
              </button>
            </div>
            <Button size="sm" variant="ghost" onClick={fetchRecurring} loading={loading}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Summary KPIs */}
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              {
                label: "Upcoming this month",
                value: "\xA3" + totalMonthlyRecurring.toFixed(0),
                sub: `${items.filter((i) => !i.paidThisMonth).length} bills`,
              },
              { label: "Already paid", value: String(paidCount), sub: "this month" },
              { label: "Due soon", value: String(dueSoonCount), sub: "within 3 days", alert: dueSoonCount > 0 },
            ].map(({ label, value, sub, alert }) => (
              <div
                key={label}
                className={cn(
                  "bg-white border rounded-xl p-4 shadow-sm",
                  alert ? "border-red-200" : "border-purple-200"
                )}
              >
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">{label}</p>
                <p className={cn("text-2xl font-bold", alert ? "text-red-600" : "text-gray-900")}>{value}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Info banner */}
        {!loading && items.length === 0 && !error && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl mb-5">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800 mb-0.5">No recurring transactions detected yet</p>
              <p className="text-xs text-blue-600">
                Log expenses for 2+ months and recurring patterns will appear here automatically. Bills are detected
                when the same category appears consistently on similar dates.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-5 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : view === "calendar" ? (
          <CalendarView items={items} />
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {items.map((item, i) => {
                const config = STATUS_CONFIG[item.status];
                const Icon = config.icon;
                return (
                  <motion.div
                    key={item.category + i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={cn(
                      "bg-white border rounded-xl p-4 shadow-sm flex items-center gap-4",
                      item.status === "due_soon" ? "border-red-200" : "border-purple-200"
                    )}
                  >
                    <div
                      className={cn("w-10 h-10 rounded-xl border flex items-center justify-center shrink-0", config.bg)}
                    >
                      <Icon className={cn("w-5 h-5", config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-gray-900 capitalize truncate">{item.category}</p>
                        <Badge variant={config.variant}>{config.label}</Badge>
                        {item.confidence >= 85 && <Badge variant="gold">High Confidence</Badge>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.paidThisMonth
                          ? "Paid this month"
                          : `Next: ${item.nextDate} (${item.daysUntil > 0 ? "in " + item.daysUntil + " days" : "today"})`}{" "}
                        &bull; Seen {item.monthsSeen} months
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-gray-900">
                        {"\xA3"}
                        {item.avgAmount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">~day {item.avgDay}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default Bills;
