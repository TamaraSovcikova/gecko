import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "../../hooks/useSocket";
import Expenses from "../Expenses/Expenses";
import TopNav from "../../components/TopNav";
import TooltipGuide from "../../components/TooltipGuide";
import BreakdownPanel from "../../components/BreakdownPanel";
import { usePageOnboarding } from "../../hooks/usePageOnboarding";
import SnapshotNavigator from "../../components/SnapshotNavigator";
import MonthlySnapshot, {
  type MonthlySnapshotData,
} from "../../components/MonthlySnapshot";
import GroqChat from "./groqChat.tsx";
import ExpenseBreakdown from "../../components/ExpenseBreakdown";

const COLOURS = ["red", "green", "turquoise", "blue"]; //could probably do with a colour re-work (actual hex). this makes things very ugly

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
  expenses?: {
    _id: string;
    category: string;
    amount: number;
    day: number;
    month: number;
    year: number;
    date: string;
    note?: string;
    createdAt: string;
  }[];
};

// year, month select helper
const monthName = (month: number) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[month - 1] || "Unknown";
};

const Dashboard = () => {
  // monthly snapshot popup states
  const [showSnapshotPopup, setShowSnapshotPopup] = useState(false);
  const [snapshots, setSnapshots] = useState<MonthlySnapshotData[]>([]);
  const [popupSnapshot, setPopupSnapshot] =
    useState<MonthlySnapshotData | null>(null);
  // dashboard states
  const navigate = useNavigate();
  const location = useLocation();
  const { token, loading, currentUser } = useAuth();
  const socket = useSocket(currentUser?.uid);
  //react state which stores dashboard data, initially null
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  // expense breakdown toggle
  const [showExpenseBreakdown, setShowExpenseBreakdown] = useState(false);

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

  //useEffect runs on every navigation to /dashboard (location.key changes on each visit)
  useEffect(() => {
    if (loading || !token) return; //wait for auth to finish and token to be available before fetching data
    const fetchDashboard = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/v1/dashboard`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setData(res.data);
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
      }
    };
    fetchDashboard();
  }, [token, loading, location.key]); //location.key changes on every navigation, ensuring a re-fetch when returning from payslip edit

  // useEffect() for real-time updates to the dashboard
  // Runs when the socket is available
  useEffect(() => {
    if (!socket) return;
    // Listens for an emission from the backend of the dashboard
    socket.on("budget:update", (updatedData: DashboardData) => {
      console.log("Recieved real-time update:", updatedData);
      setData(updatedData);
    });
    return () => {
      // Switches off the socket to prevent duplicate listeners
      socket.off("budget:update");
    };
  }, [socket]);

  // useEffects for monthly snapshot
  useEffect(() => {
    if (loading || !token || !currentUser) return;

    const fetchSnapshots = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/snapshots/${currentUser.uid}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        setSnapshots(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchSnapshots();
  }, [token, loading, currentUser]);

  const isSnapshotMode = snapshotIndex !== null;
  const showExpenses = !isSnapshotMode;

  const selectedSnapshot =
    snapshotIndex !== null ? snapshots[snapshotIndex] : null;

  const displayedData: DashboardData | null = selectedSnapshot
    ? {
        healthScore: selectedSnapshot.healthScore,
        takeHome: selectedSnapshot.takeHomePay,
        totalBudget: selectedSnapshot.categories.reduce(
          (sum, c) => sum + c.budget,
          0,
        ),
        budgetLeft:
          selectedSnapshot.categories.reduce((sum, c) => sum + c.budget, 0) -
          selectedSnapshot.totalExpenses,
        budgetAllocation: selectedSnapshot.categories.map((c) => ({
          name: c.name,
          value: c.budget,
        })),
        actualSpending: selectedSnapshot.categories.map((c) => ({
          name: c.name,
          value: c.actual,
        })),
      }
    : data;

  // delete expense
  const deleteExpense = async (expenseId: string) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/v1/expenses/${expenseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // socket connection updates automatically
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
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/v1/expenses/${expenseId}`,
        editForm,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // OPTIONAL: you can remove this if socket handles sync
      setData((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          expenses: prev.expenses?.map((exp) =>
            exp._id === expenseId ? { ...exp, ...editForm } : exp,
          ),
        };
      });
    } catch (err) {
      console.error(err);
    }
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
        return "#fff3cd"; // light yellow
      case "medium":
        return "#d1ecf1"; // light blue
      case "low":
        return "#d4edda"; // light green
      default:
        return "#e2e3e5"; // light gray
    }
  };

  const getTipBorderColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#ffc107"; // yellow
      case "medium":
        return "#17a2b8"; // blue
      case "low":
        return "#28a745"; // green
      default:
        return "#6c757d"; // gray
    }
  };

  if (error) return <div>{error}</div>;
  if (!displayedData) return <div>Loading...</div>;

  return (
    <>
      <TopNav />
      <div
        style={{
          maxWidth: "1000px",
          margin: "30px auto",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {isSnapshotMode && selectedSnapshot && (
          <div
            style={{ marginBottom: "20px" }}
            data-onboarding="dashboard-takehome"
          >
            <h3>
              Snapshot of {snapshots[snapshotIndex].month}/
              {snapshots[snapshotIndex].year}
            </h3>
          </div>
        )}

        <div
          style={{ marginBottom: "20px" }}
          data-onboarding="dashboard-takehome"
        >
          <h3>
            Take-home: £{displayedData.takeHome.toFixed(2)} | Budget: £
            {displayedData.totalBudget.toFixed(2)}
          </h3>
        </div>

        <div style={{ display: "flex", gap: "40px", marginBottom: "40px" }}>
          <div data-onboarding="dashboard-allocation">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
                gap: "12px",
              }}
            >
              <h4 style={{ margin: 0 }}>Budget Allocation</h4>
              {/*disable if snapshot mode*/}
              {!isSnapshotMode && (
                <button
                  type="button"
                  onClick={() => navigate("/payslip?mode=edit")}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "999px",
                    border: "1px solid #bfd1c0",
                    backgroundColor: "#eef5eb",
                    color: "#37553e",
                    fontWeight: 600,
                  }}
                >
                  Edit Payslip/Budget
                </button>
              )}
              {/*disable if snapshot mode*/}
            </div>
            <PieChart width={300} height={220}>
              <Pie
                data={displayedData.budgetAllocation || []} //fallback to empty array prevents runtime
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
              >
                {/* different colours for each slice*/}
                {(displayedData.budgetAllocation || []).map((_, index) => (
                  <Cell key={index} fill={COLOURS[index % COLOURS.length]} />
                ))}
              </Pie>
              {/*tooltips and labels allow cool breakdowns when hovering*/}
              <Tooltip />
              <Legend />
            </PieChart>
          </div>

          <div data-onboarding="dashboard-actual-spending">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
                gap: "12px",
              }}
            >
              <h4 style={{ margin: 0 }}>Actual Spending</h4>
            </div>
            <PieChart width={300} height={220}>
              <Pie
                data={displayedData.actualSpending || []}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
              >
                {(displayedData.actualSpending || []).map((_, index) => (
                  <Cell key={index} fill={COLOURS[index % COLOURS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>

          {/* Embed the Expenses form, using the budgetAllocation categories from Dashboard */}
          {showExpenses && (
            <div
              style={{
                flex: 1,
                borderLeft: "1px solid #ccc",
                paddingLeft: "20px",
              }}
              data-onboarding="dashboard-embedded-expenses"
            >
              <Expenses categories={displayedData.budgetAllocation} />
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "60px" }}>
          <div data-onboarding="dashboard-health-score">
            <p
              style={{
                margin: 0,
                fontSize: "28px",
                fontWeight: "bold",
                color:
                  displayedData.healthScore < 40
                    ? "red"
                    : displayedData.healthScore < 70
                      ? "orange"
                      : "green",
              }}
            >
              {displayedData.healthScore}
            </p>

            {/*breakdown button test*/}
            {!isSnapshotMode && (
              <button
                type="button"
                onClick={() => setShowBreakdown(true)}
                data-onboarding="dashboard-health-breakdown-trigger"
                style={{
                  marginTop: "8px",
                  border: "none",
                  background: "none",
                  color: "#2f6a4b",
                  textDecoration: "underline",
                  cursor: "pointer",
                  padding: 0,
                  fontWeight: 600,
                }}
              >
                See breakdown
              </button>
            )}
          </div>
          {/*breakdown button test*/}

          <div>
            <h4>Take Home</h4>
            <p style={{ fontSize: "20px" }}>
              £{displayedData.takeHome.toFixed(2)}
            </p>
          </div>

          <div>
            <h4>Budget Left</h4>
            <p style={{ fontSize: "20px" }}>
              £{displayedData.budgetLeft.toFixed(2)}
            </p>
          </div>

          <div data-onboarding="dashboard-budget-vs-actual">
            <h4>Budget vs Actual</h4>
            {displayedData.budgetLeft >= 0 ? (
              <p>Under budget by £{displayedData.budgetLeft.toFixed(2)}</p>
            ) : (
              <p>
                {/* tabs ensures displayed number is positive when showing overbudget*/}
                Over budget by £{Math.abs(displayedData.budgetLeft).toFixed(2)}
              </p>
            )}
          </div>

          {displayedData.averageSalary && (
            <div>
              <h4>Market Salary</h4>
              <p style={{ fontSize: "20px" }}>
                £{displayedData.averageSalary.toLocaleString()}
              </p>
              <p style={{ fontSize: "12px", color: "#666" }}>
                Average for your role
              </p>
            </div>
          )}
        </div>

        {/* expense breakdown toggle / snapshot behaviour */}
        {isSnapshotMode ? (
          <ExpenseBreakdown
            expenses={displayedData.expenses || []}
            budgetAllocation={displayedData.budgetAllocation || []}
            onDelete={deleteExpense}
            onUpdate={updateExpense}
          />
        ) : (
          <>
            <button
              type="button"
              onClick={() => setShowExpenseBreakdown((prev) => !prev)}
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
          </>
        )}

        <SnapshotNavigator
          snapshots={snapshots}
          snapshotIndex={snapshotIndex}
          setSnapshotIndex={setSnapshotIndex}
        />

        {/* Adzuna Tips Section */}
        {displayedData.adzunaTips && displayedData.adzunaTips.length > 0 && (
          <div
            style={{
              marginTop: "50px",
              borderTop: "2px solid #ddd",
              paddingTop: "30px",
            }}
            data-onboarding="dashboard-adzuna-tips"
          >
            <h3 style={{ marginBottom: "20px", color: "#333" }}>
              Financial Tips Based on Market Data
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              {displayedData.adzunaTips.map((tip, index) => (
                <div
                  key={`tip-${index}`}
                  style={{
                    padding: "16px",
                    backgroundColor: getTipColor(tip.priority),
                    borderLeft: `4px solid ${getTipBorderColor(tip.priority)}`,
                    borderRadius: "4px",
                    transition: "transform 0.2s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <h5
                    style={{
                      margin: "0 0 8px 0",
                      color: "#333",
                      fontSize: "16px",
                      fontWeight: "600",
                    }}
                  >
                    {tip.title}
                  </h5>
                  <p
                    style={{
                      margin: "0",
                      color: "#555",
                      fontSize: "14px",
                      lineHeight: "1.5",
                    }}
                  >
                    {tip.description}
                  </p>
                </div>
              ))}
            </div>
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
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.55)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "14px",
              width: "900px",
              maxWidth: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "30px",
              fontFamily: "Arial, sans-serif",
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
              position: "relative",
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowSnapshotPopup(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                border: "none",
                background: "transparent",
                fontSize: "20px",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              ✕
            </button>

            {/* EXTRA LINES */}
            {/* Moved from component to popup */}
            <h2 style={{ margin: 0 }}>
              Monthly Snapshot: {monthName(popupSnapshot.month)}{" "}
              {popupSnapshot.year}
            </h2>

            <p style={{ marginTop: "10px", color: "#555" }}>
              Snapshot created:{" "}
              {new Date(popupSnapshot.createdAt).toLocaleString()}
            </p>

            <p style={{ marginTop: "10px", color: "#000" }}>
              This is your monthly summary for the past month. Past snapshots
              can be found on your dashboard page using nav buttons and a
              dropdown.
            </p>
            {/* Reuse snapshot component */}
            <MonthlySnapshot snapshot={popupSnapshot} />
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
