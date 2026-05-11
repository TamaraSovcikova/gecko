import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useNavigate, useLocation } from "react-router-dom";
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
import MonthlySnapshot, {
  type MonthlySnapshotData,
} from "../../components/MonthlySnapshot";
import GroqChat from "./groqChat.tsx";
import { useStreakWarning } from "../../hooks/useStreakWarning";
import ExpenseBreakdown from "../../components/ExpenseBreakdown";
import Modal from "../../components/Modal";
import { attachDashboardDebug } from "../../dev/dashboardDebug";
import { COLORS } from "../../constants/theme";
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

const normalizeCategoryKey = (value: string) => String(value || "").trim().toLowerCase();

const getCategoryColor = (categoryName: string) => {
  const key = normalizeCategoryKey(categoryName);

  if (!key) return COLORS.chart[0];

  if (CATEGORY_COLOR_OVERRIDES[key]) {
    return CATEGORY_COLOR_OVERRIDES[key];
  }

  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }

  return COLORS.chart[Math.abs(hash) % COLORS.chart.length];
};

/* Full Real-time Update Flow
1. Frontend loads
2. useSocket connects
3. emits a join event
4. Backend joins room
5. User submits a new expense
6. Backend emits 'budget:update'
7. Frontend recieves the event
8. New dashboard data is set
9. React automatically re-renders the UI
*/

// Type for individual tips
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

//defined exact data as expected from backend endpoint...
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
  // gamification: TODO tasks
  // xpEarned: number;
  // quizzesCompleted: number;
  // createdAt: string;
};

const DASHBOARD_SYNC_CHANNEL = "zoar-dashboard-sync";
const DASHBOARD_SYNC_STORAGE_KEY = "zoar:dashboard:sync";

const Dashboard = () => {
  // monthly snapshot popup states
  const [showSnapshotPopup, setShowSnapshotPopup] = useState(false);
  const [snapshots, setSnapshots] = useState<MonthlySnapshotData[]>([]);
  const [popupSnapshot, setPopupSnapshot] =
    useState<MonthlySnapshotData | null>(null);
  // dashboard states
  const navigate = useNavigate();
  const location = useLocation();
  const { token, loading, currentUser, profile } = useAuth();
  const socket = useSocket(currentUser?.uid);
  const { showStreakWarning } = useStreakWarning();
  //react state which stores dashboard data, initially null
  const [data, setData] = useState<DashboardData | null>(null);
  const [forecast, setForecast] = useState<ForecastPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  // expense breakdown toggle
  const [showExpenseBreakdown, setShowExpenseBreakdown] = useState(false);
  const [showAllTips, setShowAllTips] = useState(false);
  const [snapshotExpenses, setSnapshotExpenses] = useState<ExpenseItem[]>([]);
  const [snapshotViewData, setSnapshotViewData] = useState<DashboardData | null>(null);
  const [snapshotExpensesLoaded, setSnapshotExpensesLoaded] = useState(false);
  const isRefreshingRef = useRef(false);
  const pendingRefreshRef = useRef(false);
  const snapshotViewRequestIdRef = useRef(0);

  const broadcastDashboardSync = useCallback(
    (eventType: "expense:create" | "expense:update" | "expense:delete") => {
      const payload = {
        type: eventType,
        userId: currentUser?.uid,
        timestamp: Date.now(),
      };

      try {
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          const channel = new BroadcastChannel(DASHBOARD_SYNC_CHANNEL);
          channel.postMessage(payload);
          channel.close();
        }
      } catch (err) {
        console.warn("[Dashboard] BroadcastChannel sync failed:", err);
      }

      try {
        localStorage.setItem(DASHBOARD_SYNC_STORAGE_KEY, JSON.stringify(payload));
        // Removing allows repeated events with the same type to keep firing storage listeners.
        localStorage.removeItem(DASHBOARD_SYNC_STORAGE_KEY);
      } catch (err) {
        console.warn("[Dashboard] localStorage sync fallback failed:", err);
      }
    },
    [currentUser?.uid],
  );

  const {
    isOpen: isOnboardingOpen,
    activeStepNumber,
    steps: onboardingSteps,
    closeGuide,
    completeGuide,
    goToStep,
  } = usePageOnboarding("/dashboard");

  // const for monthly snapshot
  const [snapshotIndex, setSnapshotIndex] = useState<number | null>(null);

  const refreshDashboardAndForecast = useCallback(async () => {
    if (loading || !token) return;

    if (isRefreshingRef.current) {
      pendingRefreshRef.current = true;
      return;
    }

    isRefreshingRef.current = true;

    try {
      const [dashboardRes, forecastRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/v1/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        getForecast(token)
          .then((result) => ({ ok: true as const, value: result }))
          .catch((err) => {
            console.error("[Dashboard] Failed to fetch forecast:", err);
            return { ok: false as const, value: null };
          }),
      ]);

      setError(null);
      setData(dashboardRes.data);

      if (forecastRes.ok && forecastRes.value) {
        setForecast(forecastRes.value);
      }
    } catch (err) {
      console.error(err);
      setError("error fetching dashboard data, using fallback");
      setData({
        healthScore: 100,
        takeHome: 100,
        budgetLeft: 100,
        totalBudget: 100,
        actualSpending: [{ name: "Fallback", value: 100 }],
        budgetAllocation: [{ name: "Fallback", value: 100 }],
      });
    } finally {
      isRefreshingRef.current = false;

      if (pendingRefreshRef.current) {
        pendingRefreshRef.current = false;
        void refreshDashboardAndForecast();
      }
    }
  }, [loading, token]);

  //useEffect runs on every navigation to /dashboard (location.key changes on each visit)
  useEffect(() => {
    if (loading || !token) return; //wait for auth to finish and token to be available before fetching data
    void refreshDashboardAndForecast();
  }, [token, loading, location.key, refreshDashboardAndForecast]); //location.key changes on every navigation, ensuring a re-fetch when returning from payslip edit

  // useEffect() for real-time updates to the dashboard
  // Runs when the socket is available
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      void refreshDashboardAndForecast();
    };

    const handleBudgetUpdate = () => {
      void refreshDashboardAndForecast();
    };

    socket.on("connect", handleConnect);
    socket.on("budget:update", handleBudgetUpdate);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("budget:update", handleBudgetUpdate);
    };
  }, [socket, refreshDashboardAndForecast]);

  useEffect(() => {
    const currentUid = currentUser?.uid;

    if (!currentUid) return;

    const handleSyncPayload = (payload?: { userId?: string }) => {
      if (payload?.userId && payload.userId !== currentUid) return;
      void refreshDashboardAndForecast();
    };

    let channel: BroadcastChannel | null = null;

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      channel = new BroadcastChannel(DASHBOARD_SYNC_CHANNEL);
      channel.onmessage = (event) => {
        handleSyncPayload(event.data);
      };
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== DASHBOARD_SYNC_STORAGE_KEY || !event.newValue) return;

      try {
        const parsed = JSON.parse(event.newValue);
        handleSyncPayload(parsed);
      } catch (err) {
        console.warn("[Dashboard] Failed to parse cross-tab sync payload:", err);
      }
    };

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      channel?.close();
    };
  }, [currentUser?.uid, refreshDashboardAndForecast]);

  // useEffects for monthly snapshot
  useEffect(() => {
    if (loading || !token || !currentUser) return;

    const fetchSnapshots = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/v1/snapshots/${currentUser.uid}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        setSnapshots(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchSnapshots();
  }, [token, loading, currentUser]);

  useEffect(() => {
    attachDashboardDebug({
      snapshots,
      setPopupSnapshot,
      setShowSnapshotPopup,
    });
  }, [snapshots]);

  const isSnapshotMode = snapshotIndex !== null;
  const showExpenses = !isSnapshotMode;

  const selectedSnapshot =
    snapshotIndex !== null ? snapshots[snapshotIndex] : null;

  const refreshSnapshotViewData = useCallback(async () => {
    if (!isSnapshotMode || !selectedSnapshot || loading || !token) {
      setSnapshotViewData(null);
      return;
    }

    const targetMonth = Number(selectedSnapshot.month);
    const targetYear = Number(selectedSnapshot.year);
    const requestId = ++snapshotViewRequestIdRef.current;

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/dashboard`,
        {
          params: {
            month: targetMonth,
            year: targetYear,
          },
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (snapshotViewRequestIdRef.current !== requestId) {
        return;
      }

      const monthData: DashboardData = res.data;
      setSnapshotViewData(monthData);

      const apiExpenses = Array.isArray(monthData.expenses) ? monthData.expenses : [];
      setSnapshotExpenses(apiExpenses);
      setSnapshotExpensesLoaded(true);
    } catch (err) {
      console.error("[Dashboard] Failed to fetch snapshot dashboard:", err);

      if (snapshotViewRequestIdRef.current === requestId) {
        setSnapshotViewData(null);
      }
    }
  }, [isSnapshotMode, selectedSnapshot, loading, token]);

  useEffect(() => {
    if (!isSnapshotMode || !selectedSnapshot) {
      setSnapshotExpenses([]);
      setSnapshotExpensesLoaded(false);
      setSnapshotViewData(null);
      return;
    }

    setSnapshotExpenses([]);
    setSnapshotExpensesLoaded(false);
    void refreshSnapshotViewData();
  }, [isSnapshotMode, selectedSnapshot, refreshSnapshotViewData]);

  const mergeDashboardData = (incoming?: DashboardData | null) => {
    if (!incoming) return;

    setData((prev) => {
      if (!prev) return incoming;

      return {
        ...prev,
        ...incoming,
        // Some endpoints return partial dashboard payloads after expense actions.
        adzunaTips: incoming.adzunaTips ?? prev.adzunaTips,
        averageSalary: incoming.averageSalary ?? prev.averageSalary,
        healthBreakdown: incoming.healthBreakdown ?? prev.healthBreakdown,
      };
    });
  };

  const formatCurrency = (amount: number) => `£${amount.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const snapshotActualSpendingFromExpenses = selectedSnapshot
    ? (() => {
        if (snapshotViewData?.actualSpending) {
          return snapshotViewData.actualSpending;
        }

        if (!snapshotExpensesLoaded) {
          return selectedSnapshot.categories.map((c) => ({
            name: c.name,
            value: c.actual,
          }));
        }

        const totals = new Map<string, number>();

        snapshotExpenses.forEach((expense) => {
          totals.set(
            expense.category,
            (totals.get(expense.category) || 0) + Number(expense.amount || 0),
          );
        });

        return Array.from(totals.entries()).map(([name, value]) => ({ name, value }));
      })()
    : [];

  const snapshotTotalExpenses = snapshotActualSpendingFromExpenses.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  const displayedData: DashboardData | null = selectedSnapshot
    ? {
        healthScore: snapshotViewData?.healthScore ?? selectedSnapshot.healthScore,
        takeHome: snapshotViewData?.takeHome ?? selectedSnapshot.takeHomePay,
        totalBudget: snapshotViewData?.totalBudget ?? selectedSnapshot.categories.reduce(
          (sum, c) => sum + c.budget,
          0,
        ),
        budgetLeft: snapshotViewData?.budgetLeft ?? (
          selectedSnapshot.categories.reduce((sum, c) => sum + c.budget, 0) -
          snapshotTotalExpenses
        ),
        budgetAllocation: snapshotViewData?.budgetAllocation ?? selectedSnapshot.categories.map((c) => ({
          name: c.name,
          value: c.budget,
        })),
        actualSpending: snapshotActualSpendingFromExpenses,
        expenses: snapshotViewData?.expenses ?? snapshotExpenses,
      }
    : data;

  const monthlyTakeHome = displayedData
    ? displayedData.takeHome / 12
    : 0;

  const displayedTotalSpending = displayedData
    ? (displayedData.actualSpending || []).reduce((sum, item) => sum + Number(item.value || 0), 0)
    : 0;

  const incomeBudgetLeft = monthlyTakeHome - displayedTotalSpending;

  const visibleTips = displayedData?.adzunaTips
    ? showAllTips
      ? displayedData.adzunaTips
      : displayedData.adzunaTips.slice(0, 3)
    : [];

  const hasMoreTips = (displayedData?.adzunaTips?.length || 0) > 3;

  // delete expense
  const deleteExpense = async (expenseId: string) => {
    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/v1/expenses/${expenseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.data?.dashboard) {
        mergeDashboardData(res.data.dashboard);
      }

      if (res.data?.forecast) {
        setForecast(res.data.forecast);
      }

      if (isSnapshotMode && selectedSnapshot) {
        setSnapshotExpensesLoaded(true);
        setSnapshotExpenses((prev) => prev.filter((expense) => expense._id !== expenseId));
        void refreshSnapshotViewData();
      }

      broadcastDashboardSync("expense:delete");
    } catch (error) {
      console.error(error);
    }
  };

  type ExpenseForm = {
    category: string;
    amount: number;
    date: string;
    note: string;
  };

  const updateExpense = async (expenseId: string, editForm: ExpenseForm) => {
    try {
      const res = await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/v1/expenses/${expenseId}`,
        {
          category: editForm.category,
          amount: editForm.amount,
          date: editForm.date,
          note: editForm.note,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data?.dashboard) {
        mergeDashboardData(res.data.dashboard);
      } else {
        setData((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            expenses: prev.expenses?.map((exp) =>
              exp._id === expenseId
                ? {
                    ...exp,
                    category: editForm.category,
                    amount: editForm.amount,
                    date: editForm.date,
                    note: editForm.note,
                    month: new Date(editForm.date).getMonth() + 1,
                    year: new Date(editForm.date).getFullYear(),
                  }
                : exp,
            ),
          };
        });
      }

      if (res.data?.forecast) {
        setForecast(res.data.forecast);
      }

      if (isSnapshotMode && selectedSnapshot) {
        const selectedMonth = Number(selectedSnapshot.month);
        const selectedYear = Number(selectedSnapshot.year);

        setSnapshotExpensesLoaded(true);
        setSnapshotExpenses((prev) =>
          prev.flatMap((expense) => {
            if (expense._id !== expenseId) return [expense];

            const editedDate = new Date(editForm.date);
            const editedMonth = editedDate.getMonth() + 1;
            const editedYear = editedDate.getFullYear();

            if (editedMonth !== selectedMonth || editedYear !== selectedYear) {
              return [];
            }

            return [{
              ...expense,
              category: editForm.category,
              amount: editForm.amount,
              date: editForm.date,
              note: editForm.note,
              month: editedMonth,
              year: editedYear,
            }];
          }),
        );
        void refreshSnapshotViewData();
      }

      broadcastDashboardSync("expense:update");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismissForecastWarning = async (warningId: string) => {
    try {
      setForecast((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          warnings: prev.warnings.filter((warning) => warning.id !== warningId),
        };
      });

      await dismissForecastWarning(warningId, token);
    } catch (err) {
      console.error("[Dashboard] Failed to dismiss forecast warning:", err);
    }
  };

  // cancel expense edit
  const cancelEditing = () => {
    setEditingExpenseId(null);
    setPendingDeleteId(null);
    setEditForm({
      category: "",
      amount: 0,
      date: "",
      note: "",
    });
  };

  // useEffect for pop-up on first log-in of the month
  useEffect(() => {
    if (!currentUser || snapshots.length === 0) return;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // snapshot is always previous month
    const snapshotMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const snapshotYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const latestSnapshot = snapshots.find(
      (s) => s.month === snapshotMonth && s.year === snapshotYear,
    );

    if (!latestSnapshot) return;

    const key = `snapshotSeen_${currentUser.uid}_${snapshotMonth}_${snapshotYear}`;
    const alreadySeen = localStorage.getItem(key);

    if (!alreadySeen) {
      setPopupSnapshot(latestSnapshot);
      setShowSnapshotPopup(true);
      localStorage.setItem(key, "true");
    }
  }, [snapshots, currentUser]);

  const getTipColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#f4effd";
      case "medium":
        return "#ede8f8";
      case "low":
        return COLORS.purple200;
      default:
        return COLORS.purple100;
    }
  };

  const getTipBorderColor = (priority: string) => {
    switch (priority) {
      case "high":
        return COLORS.gold;
      case "medium":
        return COLORS.purple500;
      case "low":
        return COLORS.purple600;
      default:
        return COLORS.textMuted;
    }
  };

  if (error) {
    return (
      <div className="app-page">
        <TopNav />
        <div className="dashboard-shell">
          <div className="dashboard-streak-warning">{error}</div>
        </div>
        <GroqChat />
      </div>
    );
  }

  if (!displayedData) {
    return (
      <div className="app-page">
        <TopNav />
        <div className="dashboard-shell">
          <div className="dashboard-snapshot-banner">
            <p className="dashboard-snapshot-copy">Loading dashboard...</p>
          </div>
        </div>
        <GroqChat />
      </div>
    );
  }

  return (
    <div className="app-page">
      <TopNav />
      {!isSnapshotMode && (
        <ForecastWarningPopup
          warnings={forecast?.warnings || []}
          onDismiss={handleDismissForecastWarning}
        />
      )}
      <div className="dashboard-shell">
        {showStreakWarning && (
          <div className="dashboard-streak-warning">
            ⚠️ Complete a quiz this week to keep your streak alive
          </div>
        )}

        {isSnapshotMode && selectedSnapshot && (
          <div
            className="dashboard-snapshot-banner"
            data-onboarding="dashboard-takehome"
          >
            <h3 className="dashboard-snapshot-title">
              Snapshot of {snapshots[snapshotIndex].month}/
              {snapshots[snapshotIndex].year}
            </h3>
            <p className="dashboard-snapshot-copy">
              Viewing archived values for this month.
            </p>
          </div>
        )}

        <div className="dashboard-hero" data-onboarding="dashboard-takehome">
          <div>
            <p className="dashboard-hero-eyebrow">Monthly snapshot</p>
            <h2 className="dashboard-hero-title">Your money at a glance</h2>
          </div>
          <div className="dashboard-hero-pill-wrap">
            <span className="dashboard-hero-pill">
              Take-home: {formatCurrency(monthlyTakeHome)}
            </span>
            <span className="dashboard-hero-pill">
              Budget: {formatCurrency(displayedData.totalBudget)}
            </span>
          </div>
        </div>

        <section className="dashboard-kpi-grid">
          <div className="dashboard-kpi-card" data-onboarding="dashboard-health-score">
            <p className="dashboard-kpi-label">Health score</p>
            <p
              className="dashboard-kpi-value"
              style={{
                color:
                  displayedData.healthScore < 40
                    ? COLORS.error
                    : displayedData.healthScore < 70
                      ? COLORS.gold
                      : COLORS.purple500,
              }}
            >
              {displayedData.healthScore}
            </p>

            {!isSnapshotMode && (
              <button
                type="button"
                onClick={() => setShowBreakdown(true)}
                data-onboarding="dashboard-health-breakdown-trigger"
                className="dashboard-link-button"
              >
                See breakdown
              </button>
            )}
          </div>

          <div className="dashboard-kpi-card">
            <p className="dashboard-kpi-label">Monthly take-home</p>
            <p className="dashboard-kpi-value">{formatCurrency(monthlyTakeHome)}</p>
          </div>

          <div className="dashboard-kpi-card">
            <p className="dashboard-kpi-label">Budget left</p>
            <p className="dashboard-kpi-value">{formatCurrency(incomeBudgetLeft)}</p>
          </div>

          <div className="dashboard-kpi-card" data-onboarding="dashboard-budget-vs-actual">
            <p className="dashboard-kpi-label">Budget status</p>
            <p className="dashboard-kpi-value dashboard-kpi-status">
              {incomeBudgetLeft >= 0
                ? `Under budget by ${formatCurrency(incomeBudgetLeft)}`
                : `Over budget by ${formatCurrency(Math.abs(incomeBudgetLeft))}`}
            </p>
          </div>

          {displayedData.averageSalary && (
            <div className="dashboard-kpi-card">
              <p className="dashboard-kpi-label">Market salary</p>
              <p className="dashboard-kpi-value">
                £{displayedData.averageSalary.toLocaleString()}
              </p>
              <p className="dashboard-kpi-meta">Average for your role</p>
            </div>
          )}
        </section>

        <section className="dashboard-main-grid">
          <div className="dashboard-chart-card" data-onboarding="dashboard-allocation">
            <div className="dashboard-card-header">
              <h4 className="dashboard-card-title">Budget Allocation</h4>
              {/*disable if snapshot mode*/}
              {!isSnapshotMode && (
                <button
                  type="button"
                  onClick={() =>
                    navigate("/payslip?mode=edit", {
                      state: {
                        prefillJobTitle:
                          typeof profile?.payslipData?.jobTitle === "string"
                            ? profile.payslipData.jobTitle
                            : "",
                        prefillLocation:
                          typeof profile?.payslipData?.location === "string"
                            ? profile.payslipData.location
                            : "",
                      },
                    })
                  }
                  className="dashboard-chip-button"
                >
                  Edit Payslip/Budget
                </button>
              )}
              {/*disable if snapshot mode*/}
            </div>
            <div className="dashboard-chart-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                  <Pie
                    data={displayedData.budgetAllocation || []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={92}
                  >
                    {(displayedData.budgetAllocation || []).map((entry, index) => (
                      <Cell
                        key={`${entry.name || "category"}-${index}`}
                        fill={getCategoryColor(entry.name)}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={28} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="dashboard-chart-card" data-onboarding="dashboard-actual-spending">
            <div className="dashboard-card-header">
              <h4 className="dashboard-card-title">Actual Spending</h4>
            </div>
            <div className="dashboard-chart-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                  <Pie
                    data={displayedData.actualSpending || []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={92}
                  >
                    {(displayedData.actualSpending || []).map((entry, index) => (
                      <Cell
                        key={`${entry.name || "category"}-${index}`}
                        fill={getCategoryColor(entry.name)}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={28} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Embed the Expenses form, using the budgetAllocation categories from Dashboard */}
          {showExpenses && (
            <div
              className="dashboard-expenses-panel"
              data-onboarding="dashboard-embedded-expenses"
            >
              <div className="dashboard-card-header">
                <h4 className="dashboard-card-title">Quick expense log</h4>
              </div>
              <Expenses
                categories={displayedData.budgetAllocation}
                onExpenseCreated={(dashboard, forecastPayload) => {
                  if (dashboard) {
                    mergeDashboardData(dashboard);
                  }

                  if (forecastPayload) {
                    setForecast(forecastPayload);
                  }

                  broadcastDashboardSync("expense:create");
                }}
              />
            </div>
          )}
        </section>

        {/* expense breakdown toggle / snapshot behaviour */}
        {isSnapshotMode ? (
          <ExpenseBreakdown
            expenses={displayedData.expenses || []}
            budgetAllocation={displayedData.budgetAllocation || []}
            onDelete={deleteExpense}
            onUpdate={updateExpense}
          />
        ) : (
          <div className="dashboard-expense-breakdown-area">
            <button
              type="button"
              onClick={() => setShowExpenseBreakdown((prev) => !prev)}
              className="dashboard-primary-button"
            >
              {showExpenseBreakdown
                ? "Hide expense breakdown"
                : "See expense breakdown"}
            </button>

            {showExpenseBreakdown && (
              <ExpenseBreakdown
                expenses={displayedData.expenses || []}
                budgetAllocation={displayedData.budgetAllocation || []}
                onDelete={deleteExpense}
                onUpdate={updateExpense}
              />
            )}
          </div>
        )}

        <div className="dashboard-snapshot-nav-wrap">
          <SnapshotNavigator
            snapshots={snapshots}
            snapshotIndex={snapshotIndex}
            setSnapshotIndex={setSnapshotIndex}
          />
        </div>

        {/* Adzuna Tips Section */}
        {displayedData.adzunaTips && displayedData.adzunaTips.length > 0 && (
          <div
            className="dashboard-tips"
            data-onboarding="dashboard-adzuna-tips"
          >
            <div className="dashboard-tips-header">
              <h3 className="dashboard-tips-title">
                Financial Tips Based on Market Data
              </h3>
              <div className="dashboard-tips-controls">
                <span className="dashboard-tips-count">
                  {displayedData.adzunaTips.length} tip
                  {displayedData.adzunaTips.length === 1 ? "" : "s"}
                </span>
                {hasMoreTips && (
                  <button
                    type="button"
                    className="dashboard-secondary-button"
                    onClick={() => setShowAllTips((prev) => !prev)}
                  >
                    {showAllTips ? "Show fewer" : "Show all"}
                  </button>
                )}
              </div>
            </div>
            <div className="dashboard-tips-list">
              {visibleTips.map((tip, index) => (
                <div
                  key={`tip-${index}`}
                  className="dashboard-tip-card"
                  style={{
                    backgroundColor: getTipColor(tip.priority),
                    borderLeft: `4px solid ${getTipBorderColor(tip.priority)}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <h5
                    className="dashboard-tip-title"
                  >
                    {tip.title}
                  </h5>
                  <p className="dashboard-tip-description">
                    {tip.description}
                  </p>
                </div>
              ))}
            </div>
            {hasMoreTips && !showAllTips && (
              <p className="dashboard-tips-footnote">
                Showing 3 most relevant tips. Use "Show all" to view the rest.
              </p>
            )}
          </div>
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
      {/*breakdown disable for snapshot test*/}
      {!isSnapshotMode && (
        <BreakdownPanel
          isOpen={showBreakdown}
          onClose={() => setShowBreakdown(false)}
          breakdown={displayedData.healthBreakdown || null}
        />
      )}
      {/*breakdown disable for snapshot test*/}

      {/* snapshot popup for first login of month */}
      {showSnapshotPopup && popupSnapshot && (
        <Modal onClose={() => setShowSnapshotPopup(false)}>
          <MonthlySnapshot snapshot={popupSnapshot} />
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;
