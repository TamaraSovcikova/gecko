import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, DollarSign, Heart, PiggyBank,
  AlertTriangle, ChevronDown, ChevronUp, BarChart2, Edit2, Eye, EyeOff,
} from "lucide-react";
import { useSocket } from "../../hooks/useSocket";
import Expenses from "../Expenses/Expenses";
import TopNav from "../../components/TopNav";
import TooltipGuide from "../../components/TooltipGuide";
import BreakdownPanel from "../../components/BreakdownPanel";
import { usePageOnboarding } from "../../hooks/usePageOnboarding";
import ForecastWarningPopup from "../../components/ForecastWarningPopup";
import { ForecastPayload } from "../../types/forecast";
import { dismissForecastWarning, getForecast } from "../../api/forecastApi";
import SnapshotNavigator from "../../components/SnapshotNavigator";
import MonthlySnapshot, { type MonthlySnapshotData } from "../../components/MonthlySnapshot";
import GroqChat from "./groqChat.tsx";
import { useStreakWarning } from "../../hooks/useStreakWarning";
import ExpenseBreakdown from "../../components/ExpenseBreakdown";
import Modal from "../../components/Modal";
import { attachDashboardDebug } from "../../dev/dashboardDebug";
import { COLORS } from "../../constants/theme";
import { SkeletonDashboard } from "../../components/ui/skeleton";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import { cn } from "../../lib/utils";
import "./dashboard.css";

const CATEGORY_COLOR_OVERRIDES: Record<string, string> = {
  rent: COLORS.chart[0],
  food: COLORS.chart[1],
  groceries: COLORS.chart[1],
  transport: COLORS.chart[2],
  travel: COLORS.chart[2],
  utilities: COLORS.chart[3],
  bills: COLORS.chart[3],
  savings: COLORS.purple400,
  entertainment: COLORS.gold,
};

const normalizeCategoryKey = (value: string) =>
  String(value || "").trim().toLowerCase();

const getCategoryColor = (categoryName: string) => {
  const key = normalizeCategoryKey(categoryName);
  if (!key) return COLORS.chart[0];
  if (CATEGORY_COLOR_OVERRIDES[key]) return CATEGORY_COLOR_OVERRIDES[key];
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return COLORS.chart[Math.abs(hash) % COLORS.chart.length];
};

const formatGBP = (v: number | undefined) =>
  typeof v === "number"
    ? "\xA3" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "\xA30.00";

type AdzunaTip = {
  type: string; title: string; description: string; priority: "high" | "medium" | "low";
};
type HealthFactor = {
  key: string; title: string; weight: number; score: number; contribution: number;
  impact: "helping" | "lowering" | "neutral"; valueLabel: string; explanation: string;
};
type HealthBreakdown = {
  healthScore: number; hasEnoughData: boolean; summary: string; factors: HealthFactor[];
};
type ExpenseItem = {
  _id: string; category: string; amount: number; day: number; month: number;
  year: number; date: string; note?: string; createdAt: string;
};
type DashboardData = {
  healthScore: number; takeHome: number; budgetLeft: number; totalBudget: number;
  actualSpending: { name: string; value: number }[];
  budgetAllocation: { name: string; value: number }[];
  averageSalary?: number; adzunaTips?: AdzunaTip[];
  healthBreakdown?: HealthBreakdown; expenses?: ExpenseItem[];
};

type KpiCardProps = {
  label: string; value: string; meta?: string;
  icon?: React.ComponentType<{ className?: string }>;
  highlight?: boolean; accentColor?: string;
  onClick?: () => void; dataOnboarding?: string;
};

const KpiCard = ({ label, value, meta, icon: Icon, highlight, accentColor, onClick, dataOnboarding }: KpiCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(92,63,163,0.16)" }}
    onClick={onClick}
    data-onboarding={dataOnboarding}
    className={cn(
      "relative bg-white border border-purple-300 rounded-lg p-5 overflow-hidden transition-shadow",
      onClick && "cursor-pointer",
      highlight && "border-purple-400",
    )}
  >
    {highlight && (
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-gold" />
    )}
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gecko-muted uppercase tracking-wider mb-1">{label}</p>
        <p className={cn("text-2xl font-bold truncate", accentColor || "text-purple-600")}>{value}</p>
        {meta && <p className="text-xs text-gecko-muted mt-1 truncate">{meta}</p>}
      </div>
      {Icon && (
        <div className="shrink-0 p-2 rounded-md bg-purple-100">
          <Icon className="h-5 w-5 text-purple-600" />
        </div>
      )}
    </div>
    {onClick && (
      <p className="mt-2 text-xs font-semibold text-purple-500">See breakdown &rarr;</p>
    )}
  </motion.div>
);

const Dashboard = () => {
  const { token, currentUser } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [displayedData, setDisplayedData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showExpenses, setShowExpenses] = useState(false);
  const [showExpenseBreakdown, setShowExpenseBreakdown] = useState(false);
  const [forecast, setForecast] = useState<ForecastPayload | null>(null);
  const [showAllTips, setShowAllTips] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [snapshots, setSnapshots] = useState<MonthlySnapshotData[]>([]);
  const [snapshotIndex, setSnapshotIndex] = useState(-1);
  const [isSnapshotMode, setIsSnapshotMode] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<MonthlySnapshotData | null>(null);
  const [showSnapshotPopup, setShowSnapshotPopup] = useState(false);
  const [popupSnapshot, setPopupSnapshot] = useState<MonthlySnapshotData | null>(null);
  const [activeSnapshotPopupKey, setActiveSnapshotPopupKey] = useState<string | null>(null);
  const [chartView, setChartView] = useState<"pie" | "bar">("pie");
  const hasFetchedRef = useRef(false);

  const { showStreakWarning } = useStreakWarning();
  const { isOpen: isOnboardingOpen, activeStepNumber, steps: onboardingSteps, closeGuide, completeGuide, goToStep } =
    usePageOnboarding("/dashboard");

  const monthlyTakeHome = dashboardData?.takeHome ?? 0;
  const incomeBudgetLeft =
    (dashboardData?.takeHome ?? 0) -
    (displayedData?.totalBudget ?? 0) +
    (displayedData?.budgetLeft ?? 0);
  const visibleTips = showAllTips
    ? (displayedData?.adzunaTips ?? [])
    : (displayedData?.adzunaTips ?? []).slice(0, 3);
  const hasMoreTips = (displayedData?.adzunaTips?.length ?? 0) > 3;

  const mergeDashboardData = useCallback((newData: DashboardData) => {
    setDashboardData(newData);
    if (!isSnapshotMode) setDisplayedData(newData);
  }, [isSnapshotMode]);

  const broadcastDashboardSync = useCallback((eventType: string) => {
    window.dispatchEvent(new CustomEvent("dashboard:sync", { detail: { type: eventType } }));
  }, []);

  const refreshSnapshotViewData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/snapshots`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (Array.isArray(res.data)) setSnapshots(res.data);
    } catch (_) {}
  }, [token]);

  useEffect(() => {
    if (snapshotIndex === -1) {
      setIsSnapshotMode(false);
      setSelectedSnapshot(null);
      if (dashboardData) setDisplayedData(dashboardData);
    } else {
      const snap = snapshots[snapshotIndex];
      if (snap) {
        setIsSnapshotMode(true);
        setSelectedSnapshot(snap);
        setDisplayedData({
          healthScore: snap.healthScore ?? 0,
          takeHome: snap.takeHome ?? 0,
          budgetLeft: snap.budgetLeft ?? 0,
          totalBudget: snap.totalBudget ?? 0,
          actualSpending: snap.actualSpending ?? [],
          budgetAllocation: snap.budgetAllocation ?? [],
          expenses: snap.expenses ?? [],
        });
      }
    }
  }, [snapshotIndex, snapshots, dashboardData]);

  useEffect(() => {
    if (!token || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    const fetchAll = async () => {
      try {
        const [dashRes, profileRes, snapshotRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/v1/dashboard`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/v1/user/profile`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/v1/snapshots`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        mergeDashboardData(dashRes.data);
        setProfile(profileRes.data);
        if (Array.isArray(snapshotRes.data)) setSnapshots(snapshotRes.data);
        setLoading(false);
        try {
          const forecastData = await getForecast(token);
          setForecast(forecastData);
        } catch (_) {}
      } catch (err) {
        setError("Failed to load dashboard. Please refresh.");
        setLoading(false);
      }
    };
    fetchAll();
  }, [token, mergeDashboardData]);

  useEffect(() => {
    if (token && currentUser) {
      return attachDashboardDebug({ token, userId: currentUser.uid, onDashboardData: mergeDashboardData });
    }
  }, [token, currentUser, mergeDashboardData]);

  useSocket(token, (event: any) => {
    if (event?.type === "budget:update" && event?.dashboard) mergeDashboardData(event.dashboard);
  });

  const deleteExpense = async (expenseId: string) => {
    if (!token) return;
    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/v1/expenses/${expenseId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.data?.dashboard) {
        mergeDashboardData(res.data.dashboard);
        if (res.data?.forecast) setForecast(res.data.forecast);
      } else {
        setDisplayedData(prev =>
          prev ? { ...prev, expenses: (prev.expenses || []).filter(e => e._id !== expenseId) } : prev,
        );
      }
      broadcastDashboardSync("expense:delete");
      void refreshSnapshotViewData();
    } catch (err) { console.error(err); }
  };

  const updateExpense = async (expenseId: string, editForm: any) => {
    if (!token) return;
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/v1/expenses/${expenseId}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.data?.dashboard) {
        mergeDashboardData(res.data.dashboard);
        if (res.data?.forecast) setForecast(res.data.forecast);
      }
      const d = new Date(editForm.date + "T00:00:00");
      const editedMonth = d.getMonth() + 1;
      const editedYear = d.getFullYear();
      setDisplayedData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          expenses: (prev.expenses || []).map(e =>
            e._id !== expenseId ? e : {
              ...e, category: editForm.category, amount: editForm.amount,
              date: editForm.date, note: editForm.note, month: editedMonth, year: editedYear,
            },
          ),
        };
      });
      void refreshSnapshotViewData();
      broadcastDashboardSync("expense:update");
    } catch (err) { console.error(err); }
  };

  const handleDismissForecastWarning = async (warningId: string) => {
    try {
      setForecast(prev => prev
        ? { ...prev, warnings: prev.warnings.filter(w => w.id !== warningId) }
        : prev);
      await dismissForecastWarning(warningId, token);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (!currentUser || snapshots.length === 0) return;
    const now = new Date();
    const cm = now.getMonth() + 1;
    const cy = now.getFullYear();
    const sm = cm === 1 ? 12 : cm - 1;
    const sy = cm === 1 ? cy - 1 : cy;
    const latest = snapshots.find(s => s.month === sm && s.year === sy);
    if (!latest) return;
    const cat = Date.parse(latest.createdAt || "");
    const fresh = Number.isFinite(cat) && now.getTime() - cat <= 86400000;
    if (!fresh && now.getDate() !== 1) return;
    const key = `snapshotSeen_${currentUser.uid}_${sm}_${sy}_${Number.isFinite(cat) ? cat : "na"}`;
    if (localStorage.getItem(key) || profile?.seenSnapshotPopupKeys?.includes(key)) return;
    setPopupSnapshot(latest);
    setActiveSnapshotPopupKey(key);
    setShowSnapshotPopup(true);
  }, [snapshots, currentUser, profile?.seenSnapshotPopupKeys]);

  const handleCloseSnapshotPopup = async () => {
    if (activeSnapshotPopupKey && token) {
      localStorage.setItem(activeSnapshotPopupKey, "true");
      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/v1/snapshots/popup-seen`,
          { popupKey: activeSnapshotPopupKey },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } catch (_) {}
    }
    setShowSnapshotPopup(false);
    setActiveSnapshotPopupKey(null);
  };

  const healthScore = displayedData?.healthScore ?? 0;
  const healthColor = healthScore < 40 ? "text-red-500" : healthScore < 70 ? "text-amber-500" : "text-emerald-500";
  const healthVariant = (healthScore < 40 ? "danger" : healthScore < 70 ? "warning" : "success") as "danger" | "warning" | "success";

  if (error) {
    return (
      <div className="app-page">
        <TopNav />
        <div className="max-w-screen-lg mx-auto px-4 mt-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700 font-semibold">{error}</div>
        </div>
        <GroqChat />
      </div>
    );
  }

  return (
    <div className="app-page">
      <TopNav />
      {!isSnapshotMode && (
        <ForecastWarningPopup warnings={forecast?.warnings || []} onDismiss={handleDismissForecastWarning} />
      )}

      <div className="max-w-screen-xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="mt-4"><SkeletonDashboard /></div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-6">

            {/* Streak warning */}
            {showStreakWarning && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Complete a quiz this week to keep your streak alive
              </div>
            )}

            {/* Snapshot banner */}
            {isSnapshotMode && selectedSnapshot && (
              <div className="bg-purple-100 border border-purple-300 rounded-lg px-5 py-4" data-onboarding="dashboard-takehome">
                <h3 className="text-purple-700 font-semibold">
                  Snapshot: {snapshots[snapshotIndex].month}/{snapshots[snapshotIndex].year}
                </h3>
                <p className="text-purple-500 text-sm mt-0.5">Viewing archived values for this month.</p>
              </div>
            )}

            {/* Hero banner */}
            <div className="relative overflow-hidden rounded-xl border border-purple-300 bg-gradient-to-br from-purple-600 to-purple-700 p-6 text-white shadow-lg" data-onboarding="dashboard-takehome">
              <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/10" />
              <div className="absolute -bottom-6 -left-4 h-32 w-32 rounded-full bg-yellow-400/20" />
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-purple-200 text-sm font-semibold uppercase tracking-wider mb-1">Monthly overview</p>
                  <h2 className="text-2xl font-bold">Your money at a glance</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 bg-white/20 rounded-pill px-4 py-2 text-sm font-semibold">
                    <DollarSign className="h-4 w-4" />
                    Take-home: {formatGBP(monthlyTakeHome)}
                  </span>
                  <span className="inline-flex items-center gap-2 bg-white/20 rounded-pill px-4 py-2 text-sm font-semibold">
                    Budget: {formatGBP(displayedData?.totalBudget)}
                  </span>
                </div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Health score"
                value={String(healthScore)}
                meta={healthScore < 40 ? "Needs attention" : healthScore < 70 ? "Room to improve" : "Looking great"}
                icon={Heart}
                accentColor={healthColor}
                highlight
                onClick={!isSnapshotMode ? () => setShowBreakdown(true) : undefined}
                dataOnboarding="dashboard-health-score"
              />
              <KpiCard
                label="Take-home"
                value={formatGBP(monthlyTakeHome)}
                icon={DollarSign}
                dataOnboarding="dashboard-takehome"
              />
              <KpiCard
                label="Budget remaining"
                value={formatGBP(incomeBudgetLeft)}
                icon={PiggyBank}
                accentColor={incomeBudgetLeft < 0 ? "text-red-500" : "text-emerald-600"}
              />
              <KpiCard
                label="Budget status"
                value={incomeBudgetLeft >= 0 ? "Under budget" : "Over budget"}
                meta={incomeBudgetLeft >= 0
                  ? `${formatGBP(incomeBudgetLeft)} remaining`
                  : `${formatGBP(Math.abs(incomeBudgetLeft))} over`}
                icon={incomeBudgetLeft >= 0 ? TrendingDown : TrendingUp}
                accentColor={incomeBudgetLeft >= 0 ? "text-emerald-600" : "text-red-500"}
                dataOnboarding="dashboard-budget-vs-actual"
              />
              {displayedData?.averageSalary && (
                <KpiCard
                  label="Market salary"
                  value={"\xA3" + displayedData.averageSalary.toLocaleString()}
                  meta="Average for your role"
                  icon={BarChart2}
                />
              )}
            </div>

            {/* Health progress bar */}
            <div className="bg-white border border-purple-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-purple-700">Financial Health Score</h4>
                <Badge variant={healthVariant}>{healthScore}/100</Badge>
              </div>
              <Progress value={healthScore} variant={healthVariant} size="lg" showLabel />
            </div>

            {/* Chart view toggle + charts */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-purple-700">Budget Analysis</h3>
              <div className="flex items-center gap-1 bg-purple-100 rounded-md p-1">
                <button
                  onClick={() => setChartView("pie")}
                  className={cn("px-3 py-1 rounded text-xs font-semibold transition-colors", chartView === "pie" ? "bg-white text-purple-700 shadow-sm" : "text-gecko-muted hover:text-purple-600")}
                >
                  Pie
                </button>
                <button
                  onClick={() => setChartView("bar")}
                  className={cn("px-3 py-1 rounded text-xs font-semibold transition-colors", chartView === "bar" ? "bg-white text-purple-700 shadow-sm" : "text-gecko-muted hover:text-purple-600")}
                >
                  Bar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Budget Allocation */}
              <div className="bg-white border border-purple-200 rounded-lg p-5" data-onboarding="dashboard-allocation">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-purple-700">Budget Allocation</h4>
                  {!isSnapshotMode && (
                    <Button variant="ghost" size="sm" onClick={() => navigate("/payslip?mode=edit", { state: { prefillJobTitle: profile?.payslipData?.jobTitle ?? "", prefillLocation: profile?.payslipData?.location ?? "" } })}>
                      <Edit2 className="h-3 w-3 mr-1" /> Edit
                    </Button>
                  )}
                </div>
                {chartView === "pie" ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={displayedData?.budgetAllocation || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                        {(displayedData?.budgetAllocation || []).map((entry, i) => (
                          <Cell key={`alloc-${i}`} fill={getCategoryColor(entry.name)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => ["\xA3" + Number(v).toFixed(2)]} />
                      <Legend verticalAlign="bottom" height={24} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={displayedData?.budgetAllocation || []} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ede8f8" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => ["\xA3" + Number(v).toFixed(2)]} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {(displayedData?.budgetAllocation || []).map((entry, i) => (
                          <Cell key={`alloc-bar-${i}`} fill={getCategoryColor(entry.name)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Actual Spending */}
              <div className="bg-white border border-purple-200 rounded-lg p-5" data-onboarding="dashboard-actual-spending">
                <h4 className="text-sm font-semibold text-purple-700 mb-4">Actual Spending</h4>
                {chartView === "pie" ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={displayedData?.actualSpending || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                        {(displayedData?.actualSpending || []).map((entry, i) => (
                          <Cell key={`spend-${i}`} fill={getCategoryColor(entry.name)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => ["\xA3" + Number(v).toFixed(2)]} />
                      <Legend verticalAlign="bottom" height={24} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={displayedData?.actualSpending || []} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ede8f8" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => ["\xA3" + Number(v).toFixed(2)]} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {(displayedData?.actualSpending || []).map((entry, i) => (
                          <Cell key={`spend-bar-${i}`} fill={getCategoryColor(entry.name)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Quick expense log */}
            {!isSnapshotMode && (
              <div>
                <Button variant="secondary" size="md" onClick={() => setShowExpenses(v => !v)} className="mb-3">
                  {showExpenses ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                  {showExpenses ? "Hide expense form" : "Log new expense"}
                </Button>
                <AnimatePresence>
                  {showExpenses && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                      data-onboarding="dashboard-embedded-expenses"
                    >
                      <Expenses
                        categories={displayedData?.budgetAllocation}
                        onExpenseCreated={(dashboard, forecastPayload) => {
                          if (dashboard) mergeDashboardData(dashboard);
                          if (forecastPayload) setForecast(forecastPayload);
                          broadcastDashboardSync("expense:create");
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Expense breakdown */}
            {isSnapshotMode ? (
              <ExpenseBreakdown
                expenses={displayedData?.expenses || []}
                budgetAllocation={displayedData?.budgetAllocation || []}
                onDelete={deleteExpense}
                onUpdate={updateExpense}
              />
            ) : (
              <div>
                <Button variant="outline" size="md" onClick={() => setShowExpenseBreakdown(v => !v)} className="mb-3">
                  {showExpenseBreakdown ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                  {showExpenseBreakdown ? "Hide expenses" : "View all expenses"}
                </Button>
                <AnimatePresence>
                  {showExpenseBreakdown && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <ExpenseBreakdown
                        expenses={displayedData?.expenses || []}
                        budgetAllocation={displayedData?.budgetAllocation || []}
                        onDelete={deleteExpense}
                        onUpdate={updateExpense}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <SnapshotNavigator snapshots={snapshots} snapshotIndex={snapshotIndex} setSnapshotIndex={setSnapshotIndex} />

            {/* Market tips */}
            {(displayedData?.adzunaTips?.length ?? 0) > 0 && (
              <div className="space-y-4" data-onboarding="dashboard-adzuna-tips">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-purple-700">Market-based Financial Tips</h3>
                  <Badge variant="outline">{displayedData!.adzunaTips!.length} tips</Badge>
                </div>
                <div className="space-y-3">
                  {visibleTips.map((tip, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        "rounded-lg border-l-4 p-4",
                        tip.priority === "high"
                          ? "bg-amber-50 border-yellow-400"
                          : tip.priority === "medium"
                            ? "bg-purple-50 border-purple-400"
                            : "bg-purple-100/60 border-purple-300",
                      )}
                    >
                      <p className="text-sm font-semibold text-purple-700 mb-1">{tip.title}</p>
                      <p className="text-sm text-gecko-muted">{tip.description}</p>
                    </motion.div>
                  ))}
                </div>
                {hasMoreTips && (
                  <Button variant="ghost" size="sm" onClick={() => setShowAllTips(v => !v)}>
                    {showAllTips ? "Show fewer" : `Show all ${displayedData!.adzunaTips!.length} tips`}
                    {showAllTips ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            )}

          </motion.div>
        )}
      </div>

      <GroqChat />
      <TooltipGuide
        isOpen={isOnboardingOpen}
        activeStepNumber={activeStepNumber}
        steps={onboardingSteps}
        onClose={closeGuide}
        onComplete={completeGuide}
        onGoToStep={goToStep}
      />
      {!isSnapshotMode && (
        <BreakdownPanel isOpen={showBreakdown} onClose={() => setShowBreakdown(false)} breakdown={displayedData?.healthBreakdown || null} />
      )}
      {showSnapshotPopup && popupSnapshot && (
        <Modal onClose={handleCloseSnapshotPopup}>
          <MonthlySnapshot snapshot={popupSnapshot} />
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;
