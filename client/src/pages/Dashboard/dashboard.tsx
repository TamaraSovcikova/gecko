import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  DollarSign,
  Heart,
  PiggyBank,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Edit2,
  Target,
  ChevronRight,
  CalendarClock,
  Zap,
  Info,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import { useSocket } from "../../hooks/useSocket";
import Expenses from "../Expenses/Expenses";
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
import { SkeletonDashboard } from "../../components/ui/skeleton";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { buildHealthNarrative } from "../../lib/healthNarrative";
import { evaluateCallouts } from "../../data/calloutConditions";
import { getBenchmarkBand, benchmarkPosition } from "../../data/benchmarks";
import { FinanceCalloutList } from "../../components/FinanceCallout";
import { monthlyRepayment } from "../../lib/studentLoan";
import { fmt } from "../../lib/ukTaxCalc";
import "./dashboard.css";

const formatGBP = (v: number | undefined) =>
  typeof v === "number"
    ? "\xA3" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "\xA30.00";

type AdzunaTip = {
  type: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
};
type HealthFactor = {
  key: string;
  title: string;
  weight: number;
  score: number;
  contribution: number;
  impact: "helping" | "lowering" | "neutral";
  valueLabel: string;
  explanation: string;
};
type HealthBreakdown = {
  healthScore: number;
  hasEnoughData: boolean;
  summary: string;
  factors: HealthFactor[];
};
type ExpenseItem = {
  _id: string;
  category: string;
  amount: number;
  day: number;
  month: number;
  year: number;
  date: string;
  note?: string;
  createdAt: string;
};
type DashboardData = {
  healthScore: number;
  takeHome: number;
  budgetLeft: number;
  totalBudget: number;
  actualSpending: { name: string; value: number }[];
  budgetAllocation: { name: string; value: number }[];
  averageSalary?: number;
  adzunaTips?: AdzunaTip[];
  healthBreakdown?: HealthBreakdown;
  expenses?: ExpenseItem[];
};

type SavingsGoal = {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  emoji: string;
  color: string;
  isCompleted: boolean;
};
type RecurringBill = {
  category: string;
  avgAmount: number;
  avgDay: number;
  nextDate: string;
  daysUntil: number;
  paidThisMonth: boolean;
  status: "paid" | "due_soon" | "upcoming" | "scheduled";
};

type KpiCardProps = {
  label: string;
  value: string;
  meta?: string;
  icon?: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
  accentColor?: string;
  onClick?: () => void;
  dataOnboarding?: string;
};

const KpiCard = ({ label, value, meta, icon: Icon, highlight, accentColor, onClick, dataOnboarding }: KpiCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}
    onClick={onClick}
    data-onboarding={dataOnboarding}
    className={cn(
      "relative bg-white border border-gray-200 rounded-lg p-5 overflow-hidden transition-shadow",
      onClick && "cursor-pointer",
      highlight && "border-purple-400"
    )}
  >
    {highlight && <div className="absolute top-0 left-0 right-0 h-[3px] bg-purple-600" />}
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
        <p className={cn("text-2xl font-bold truncate", accentColor || "text-gray-900")}>{value}</p>
        {meta && <p className="text-xs text-gray-500 mt-1 truncate">{meta}</p>}
      </div>
      {Icon && (
        <div className="shrink-0 p-2 rounded-md bg-gray-100">
          <Icon className="h-5 w-5 text-gray-600" />
        </div>
      )}
    </div>
    {onClick && <p className="mt-2 text-xs font-semibold text-purple-600">See breakdown →</p>}
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
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const hasFetchedRef = useRef(false);

  const { showStreakWarning } = useStreakWarning();
  const {
    isOpen: isOnboardingOpen,
    activeStepNumber,
    steps: onboardingSteps,
    closeGuide,
    completeGuide,
    goToStep,
  } = usePageOnboarding("/dashboard");

  const monthlyTakeHome = dashboardData?.takeHome ?? 0;
  const incomeBudgetLeft =
    (dashboardData?.takeHome ?? 0) - (displayedData?.totalBudget ?? 0) + (displayedData?.budgetLeft ?? 0);
  const visibleTips = showAllTips ? (displayedData?.adzunaTips ?? []) : (displayedData?.adzunaTips ?? []).slice(0, 5);
  const totalSpent = (displayedData?.actualSpending || []).reduce((sum, e) => sum + e.value, 0);
  const actualByCategory = new Map((displayedData?.actualSpending || []).map((e) => [e.name.toLowerCase(), e.value]));
  const now = new Date();
  const monthLabel = now.toLocaleString("en-GB", { month: "long", year: "numeric" });

  const mergeDashboardData = useCallback(
    (newData: DashboardData) => {
      setDashboardData(newData);
      if (!isSnapshotMode) setDisplayedData(newData);
    },
    [isSnapshotMode]
  );

  const broadcastDashboardSync = useCallback((eventType: string) => {
    window.dispatchEvent(new CustomEvent("dashboard:sync", { detail: { type: eventType } }));
  }, []);

  const refreshSnapshotViewData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/snapshots`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
          axios.get(`${import.meta.env.VITE_API_URL}/api/v1/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/v1/user/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/v1/snapshots`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        mergeDashboardData(dashRes.data);
        setProfile(profileRes.data);
        if (Array.isArray(snapshotRes.data)) setSnapshots(snapshotRes.data);
        setLoading(false);
        try {
          const forecastData = await getForecast(token);
          setForecast(forecastData);
        } catch (_) {}
        try {
          const [savRes, recRes] = await Promise.all([
            axios.get(`${import.meta.env.VITE_API_URL}/api/v1/savings`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(`${import.meta.env.VITE_API_URL}/api/v1/recurring`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);
          if (Array.isArray(savRes.data)) setSavingsGoals(savRes.data);
          if (Array.isArray(recRes.data?.recurring)) setRecurringBills(recRes.data.recurring);
        } catch (_) {}
      } catch (err: any) {
        const detail = err?.response?.data?.error ?? err?.response?.status ?? err?.message ?? String(err);
        console.error("[Dashboard] fetch failed:", err);
        setError(`Failed to load dashboard (${detail}). Check browser console for details.`);
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
      const res = await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/expenses/${expenseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.dashboard) {
        mergeDashboardData(res.data.dashboard);
        if (res.data?.forecast) setForecast(res.data.forecast);
      } else {
        setDisplayedData((prev) =>
          prev ? { ...prev, expenses: (prev.expenses || []).filter((e) => e._id !== expenseId) } : prev
        );
      }
      broadcastDashboardSync("expense:delete");
      void refreshSnapshotViewData();
    } catch (err) {
      console.error(err);
    }
  };

  const updateExpense = async (expenseId: string, editForm: any) => {
    if (!token) return;
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/v1/expenses/${expenseId}`, editForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.dashboard) {
        mergeDashboardData(res.data.dashboard);
        if (res.data?.forecast) setForecast(res.data.forecast);
      }
      const d = new Date(editForm.date + "T00:00:00");
      const editedMonth = d.getMonth() + 1;
      const editedYear = d.getFullYear();
      setDisplayedData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          expenses: (prev.expenses || []).map((e) =>
            e._id !== expenseId
              ? e
              : {
                  ...e,
                  category: editForm.category,
                  amount: editForm.amount,
                  date: editForm.date,
                  note: editForm.note,
                  month: editedMonth,
                  year: editedYear,
                }
          ),
        };
      });
      void refreshSnapshotViewData();
      broadcastDashboardSync("expense:update");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismissForecastWarning = async (warningId: string) => {
    try {
      setForecast((prev) => (prev ? { ...prev, warnings: prev.warnings.filter((w) => w.id !== warningId) } : prev));
      await dismissForecastWarning(warningId, token);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!currentUser || snapshots.length === 0) return;
    const now = new Date();
    const cm = now.getMonth() + 1;
    const cy = now.getFullYear();
    const sm = cm === 1 ? 12 : cm - 1;
    const sy = cm === 1 ? cy - 1 : cy;
    const latest = snapshots.find((s) => s.month === sm && s.year === sy);
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
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (_) {}
    }
    setShowSnapshotPopup(false);
    setActiveSnapshotPopupKey(null);
  };

  const healthScore = displayedData?.healthScore ?? 0;
  const healthColor = healthScore < 40 ? "text-red-500" : healthScore < 70 ? "text-amber-500" : "text-emerald-500";
  const healthVariant = (healthScore < 40 ? "danger" : healthScore < 70 ? "warning" : "success") as
    | "danger"
    | "warning"
    | "success";

  if (error) {
    return (
      <div className="app-page">
        <div className="max-w-screen-lg mx-auto mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700 font-semibold">{error}</div>
        </div>
        <GroqChat />
      </div>
    );
  }

  return (
    <div className="app-page">
      {!isSnapshotMode && (
        <ForecastWarningPopup warnings={forecast?.warnings || []} onDismiss={handleDismissForecastWarning} />
      )}

      <div className="max-w-screen-xl mx-auto pb-12">
        {loading ? (
          <div className="mt-4">
            <SkeletonDashboard />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {/* Streak warning */}
            {showStreakWarning && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 font-medium mb-5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Complete a quiz this week to keep your streak alive
              </div>
            )}

            {/* Page header */}
            <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">
                  {isSnapshotMode && selectedSnapshot
                    ? `Snapshot - ${selectedSnapshot.month}/${selectedSnapshot.year}`
                    : monthLabel}
                </p>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={!isSnapshotMode ? () => setShowBreakdown(true) : undefined}
                  className={cn(
                    "flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm",
                    !isSnapshotMode && "hover:border-purple-300 cursor-pointer transition-colors"
                  )}
                  data-onboarding="dashboard-health-score"
                >
                  <Heart className={cn("w-4 h-4", healthColor)} />
                  <span className={cn("font-bold", healthColor)}>{healthScore}</span>
                  <span className="text-gray-400 text-xs">/100</span>
                  <Badge variant={healthVariant} className="ml-1 text-xs">
                    {healthScore < 40 ? "Poor" : healthScore < 70 ? "Fair" : "Good"}
                  </Badge>
                  {!isSnapshotMode && <span className="text-xs text-gray-400">details</span>}
                </button>
                <SnapshotNavigator
                  snapshots={snapshots}
                  snapshotIndex={snapshotIndex}
                  setSnapshotIndex={setSnapshotIndex}
                />
              </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6" data-onboarding="dashboard-takehome">
              <KpiCard label="Take-home" value={formatGBP(monthlyTakeHome)} icon={DollarSign} />
              <KpiCard
                label="Spent this month"
                value={formatGBP(totalSpent)}
                icon={TrendingUp}
                accentColor={totalSpent > monthlyTakeHome ? "text-red-600" : "text-gray-900"}
              />
              <KpiCard
                label="Budget remaining"
                value={formatGBP(incomeBudgetLeft)}
                icon={PiggyBank}
                highlight
                accentColor={incomeBudgetLeft < 0 ? "text-red-500" : "text-emerald-600"}
              />
              {displayedData?.averageSalary ? (
                <KpiCard
                  label="Market salary"
                  value={"\xA3" + displayedData.averageSalary.toLocaleString()}
                  meta="Average for your role"
                  icon={BarChart2}
                />
              ) : (
                <KpiCard
                  label="Budget used"
                  value={monthlyTakeHome > 0 ? Math.round((totalSpent / monthlyTakeHome) * 100) + "%" : "—"}
                  meta="of take-home pay"
                  icon={BarChart2}
                  accentColor={totalSpent > monthlyTakeHome ? "text-red-600" : "text-gray-900"}
                />
              )}
            </div>

            {/* Health narrative + callouts */}
            {!isSnapshotMode &&
              displayedData &&
              (() => {
                const narrative = buildHealthNarrative({
                  healthScore: displayedData.healthScore ?? 0,
                  takeHome: monthlyTakeHome,
                  budgetLeft: incomeBudgetLeft,
                  totalBudget: displayedData.totalBudget ?? 0,
                  actualSpending: displayedData.actualSpending ?? [],
                  budgetAllocation: displayedData.budgetAllocation ?? [],
                });
                const callouts = evaluateCallouts({
                  healthScore: displayedData.healthScore ?? 0,
                  takeHome: monthlyTakeHome,
                  budgetLeft: incomeBudgetLeft,
                  totalBudget: displayedData.totalBudget ?? 0,
                  actualSpending: displayedData.actualSpending ?? [],
                  budgetAllocation: displayedData.budgetAllocation ?? [],
                });
                if (!narrative && !callouts.length) return null;
                return (
                  <div className="space-y-2 mb-5">
                    {narrative && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                        <p className="text-xs text-gray-600 leading-relaxed">{narrative}</p>
                      </div>
                    )}
                    <FinanceCalloutList callouts={callouts} />
                  </div>
                );
              })()}

            {/* Financial journey strip */}
            {!isSnapshotMode &&
              (() => {
                const loan = profile?.studentLoan;
                const pension = profile?.pensionSettings;
                const readiness = profile?.readinessCheck;
                const gross = profile?.payslipData?.grossSalary ?? 0;
                const checkDone = !!readiness?.completedAt;
                const hasLoan = loan?.plan && loan.plan !== "none";
                const hasPensionGap =
                  pension?.employerMatchPct != null &&
                  pension?.employeeContributionPct != null &&
                  pension.employeeContributionPct < pension.employerMatchPct;
                const showStrip = !checkDone || hasLoan || hasPensionGap;
                if (!showStrip) return null;
                return (
                  <div className="mb-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                      Your financial picture
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {!checkDone && (
                        <Link
                          to="/check"
                          className="flex items-center gap-3 bg-purple-600 hover:bg-purple-700 rounded-xl px-4 py-3.5 no-underline transition-colors group"
                        >
                          <Sparkles className="w-4 h-4 text-purple-200 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white">Financial readiness check</p>
                            <p className="text-[11px] text-purple-200">5 questions, personalized priorities</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-purple-300 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      )}
                      {hasLoan && gross > 0 && (
                        <Link
                          to="/loans"
                          className="flex items-center gap-3 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl px-4 py-3.5 no-underline transition-colors group"
                        >
                          <GraduationCap className="w-4 h-4 text-blue-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900">Student loan</p>
                            <p className="text-[11px] text-gray-400">
                              {fmt(monthlyRepayment(gross, loan.plan))}/mo repayment
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      )}
                      {hasPensionGap && gross > 0 && (
                        <Link
                          to="/pension"
                          className="flex items-center gap-3 bg-white border border-red-200 hover:bg-red-50 rounded-xl px-4 py-3.5 no-underline transition-colors group"
                        >
                          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900">Pension gap</p>
                            <p className="text-[11px] text-gray-400">
                              Contributing {pension.employeeContributionPct}% vs {pension.employerMatchPct}% max
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 group-hover:text-red-400 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })()}

            {/* Main two-column grid */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
              {/* Left: budget bars + expense list */}
              <div className="space-y-5">
                {/* Budget vs Actual */}
                <div
                  className="bg-white border border-gray-200 rounded-lg p-5"
                  data-onboarding="dashboard-budget-vs-actual"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-800">Budget vs Actual</h4>
                    {!isSnapshotMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate("/payslip?mode=edit", {
                            state: {
                              prefillJobTitle: profile?.payslipData?.jobTitle ?? "",
                              prefillLocation: profile?.payslipData?.location ?? "",
                            },
                          })
                        }
                      >
                        <Edit2 className="h-3 w-3 mr-1" /> Edit budget
                      </Button>
                    )}
                  </div>
                  {(displayedData?.budgetAllocation || []).length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-400 mb-3">No budget set up yet.</p>
                      <Button variant="secondary" size="sm" onClick={() => navigate("/payslip")}>
                        Set up payslip
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {(displayedData?.budgetAllocation || []).map(({ name, value: budget }) => {
                        const actual = actualByCategory.get(name.toLowerCase()) ?? 0;
                        const pct = budget > 0 ? Math.min((actual / budget) * 100, 100) : 0;
                        const over = actual > budget && budget > 0;
                        const benchmarkInfo = monthlyTakeHome > 0 ? getBenchmarkBand(name) : null;
                        const spendPct = monthlyTakeHome > 0 ? (actual / monthlyTakeHome) * 100 : 0;
                        const benchPos = benchmarkInfo ? benchmarkPosition(spendPct, benchmarkInfo.band) : null;
                        return (
                          <div key={name}>
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="font-medium text-gray-700 capitalize">{name}</span>
                              <div className="flex items-center gap-2">
                                {benchmarkInfo && benchPos === "very_high" && (
                                  <span className="text-[10px] text-amber-600 font-semibold">
                                    above UK median ({benchmarkInfo.band.median}%)
                                  </span>
                                )}
                                {benchmarkInfo && benchPos === "low" && (
                                  <span className="text-[10px] text-emerald-600 font-semibold">below UK median</span>
                                )}
                                <span
                                  className={cn("font-semibold tabular-nums", over ? "text-red-600" : "text-gray-500")}
                                >
                                  {formatGBP(actual)}{" "}
                                  <span className="font-normal text-gray-300">/ {formatGBP(budget)}</span>
                                  {over && <span className="ml-1 text-red-400 font-normal text-[11px]">over</span>}
                                </span>
                              </div>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  over ? "bg-red-500" : pct > 85 ? "bg-amber-400" : "bg-purple-600"
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Savings goals */}
                {!isSnapshotMode && savingsGoals.filter((g) => !g.isCompleted).length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-purple-50">
                          <Target className="w-3.5 h-3.5 text-purple-600" />
                        </div>
                        <h4 className="text-sm font-semibold text-gray-800">Savings Goals</h4>
                      </div>
                      <button
                        onClick={() => navigate("/savings")}
                        className="flex items-center gap-0.5 text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors"
                      >
                        View all <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {savingsGoals
                        .filter((g) => !g.isCompleted)
                        .slice(0, 3)
                        .map((goal) => {
                          const pct =
                            goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
                          return (
                            <div key={goal._id}>
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="font-medium text-gray-700">
                                  {goal.emoji} {goal.name}
                                </span>
                                <span className="font-semibold text-gray-500 tabular-nums">
                                  {formatGBP(goal.currentAmount)}{" "}
                                  <span className="font-normal text-gray-300">/ {formatGBP(goal.targetAmount)}</span>
                                </span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%`, backgroundColor: goal.color || "#8b6fd4" }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    {savingsGoals.filter((g) => !g.isCompleted).length > 3 && (
                      <p className="mt-2 text-[11px] text-gray-400 text-center">
                        +{savingsGoals.filter((g) => !g.isCompleted).length - 3} more goals
                      </p>
                    )}
                  </div>
                )}

                {/* Upcoming recurring bills */}
                {!isSnapshotMode && recurringBills.filter((b) => !b.paidThisMonth).length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-amber-50">
                          <CalendarClock className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                        <h4 className="text-sm font-semibold text-gray-800">Upcoming Bills</h4>
                      </div>
                      <Badge variant="outline" className="text-[11px]">
                        {recurringBills.filter((b) => !b.paidThisMonth).length} pending
                      </Badge>
                    </div>
                    <div className="space-y-0">
                      {recurringBills
                        .filter((b) => !b.paidThisMonth)
                        .slice(0, 5)
                        .map((bill, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                          >
                            <div>
                              <p className="text-xs font-medium text-gray-700 capitalize">{bill.category}</p>
                              <p
                                className={cn(
                                  "text-[11px] mt-0.5",
                                  bill.status === "due_soon" ? "text-red-500 font-semibold" : "text-gray-400"
                                )}
                              >
                                {bill.daysUntil <= 0
                                  ? "Due today"
                                  : bill.daysUntil === 1
                                    ? "Due tomorrow"
                                    : `Due in ${bill.daysUntil} days`}
                              </p>
                            </div>
                            <span className="text-xs font-bold text-gray-800 tabular-nums">
                              {formatGBP(bill.avgAmount)}
                            </span>
                          </div>
                        ))}
                    </div>
                    {(() => {
                      const total = recurringBills.filter((b) => !b.paidThisMonth).reduce((s, b) => s + b.avgAmount, 0);
                      return total > 0 ? (
                        <p className="mt-3 text-[11px] text-gray-400 text-right font-medium">
                          {formatGBP(total)} remaining this month
                        </p>
                      ) : null;
                    })()}
                  </div>
                )}

                {/* Expense breakdown - always visible */}
                <div data-onboarding="dashboard-embedded-expenses">
                  <ExpenseBreakdown
                    expenses={displayedData?.expenses || []}
                    budgetAllocation={displayedData?.budgetAllocation || []}
                    onDelete={deleteExpense}
                    onUpdate={updateExpense}
                  />
                </div>
              </div>

              {/* Right: market tips (if any) + quick-add form */}
              <div className="space-y-4">
                {/* Market insights - always visible, sorted high-priority first */}
                {(displayedData?.adzunaTips?.length ?? 0) > 0 && !isSnapshotMode && (
                  <div
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                    data-onboarding="dashboard-adzuna-tips"
                  >
                    <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-gray-100">
                      <div className="p-1.5 rounded-md bg-amber-50">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 leading-none">Market Insights</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Based on your role and location</p>
                      </div>
                      {(displayedData?.adzunaTips?.length ?? 0) > 3 && (
                        <button
                          type="button"
                          onClick={() => setShowAllTips((v) => !v)}
                          className="flex items-center gap-0.5 text-[11px] font-semibold text-purple-600 hover:text-purple-700 shrink-0"
                        >
                          {showAllTips ? "Less" : `+${(displayedData?.adzunaTips?.length ?? 0) - 3} more`}
                          {showAllTips ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                    <div className="divide-y divide-gray-100">
                      {[...(displayedData?.adzunaTips ?? [])]
                        .sort((a, b) => (a.priority === "high" ? -1 : b.priority === "high" ? 1 : 0))
                        .slice(0, showAllTips ? undefined : 3)
                        .map((tip, i) => (
                          <div
                            key={i}
                            className={cn(
                              "flex gap-3 px-4 py-3",
                              tip.priority === "high" ? "bg-amber-50/60" : "bg-white"
                            )}
                          >
                            <div
                              className={cn(
                                "shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center",
                                tip.priority === "high" ? "bg-amber-100" : "bg-gray-100"
                              )}
                            >
                              {tip.priority === "high" ? (
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                              ) : (
                                <Info className="w-3 h-3 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p
                                className={cn(
                                  "text-xs font-semibold mb-0.5",
                                  tip.priority === "high" ? "text-amber-900" : "text-gray-800"
                                )}
                              >
                                {tip.title}
                              </p>
                              <p
                                className={cn(
                                  "text-[11px] leading-relaxed",
                                  tip.priority === "high" ? "text-amber-700" : "text-gray-500"
                                )}
                              >
                                {tip.description}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Expense form - always visible, hidden in snapshot mode */}
                {!isSnapshotMode && (
                  <div data-onboarding="dashboard-allocation">
                    <Expenses
                      categories={displayedData?.budgetAllocation}
                      onExpenseCreated={(dashboard, forecastPayload) => {
                        if (dashboard) mergeDashboardData(dashboard);
                        if (forecastPayload) setForecast(forecastPayload);
                        broadcastDashboardSync("expense:create");
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
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
        <BreakdownPanel
          isOpen={showBreakdown}
          onClose={() => setShowBreakdown(false)}
          breakdown={displayedData?.healthBreakdown || null}
        />
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
