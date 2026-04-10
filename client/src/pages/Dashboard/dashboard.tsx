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
import SnapshotMonthDropdown from "../../components/MonthlySnapshotDropdown";

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

// types for monthly snapshot
type SnapshotCategory = {
  name: string;
  budget: number;
  actual: number;
};

type MonthlySnapshot = {
  _id: string;
  userId: string;
  month: number;
  year: number;
  healthScore: number;
  grossSalary: number;
  takeHomePay: number;
  totalExpenses: number;
  savings: number;
  categories: SnapshotCategory[];
  xpEarned: number;
  quizzesCompleted: number;
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
};

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, loading, currentUser } = useAuth();
  const socket = useSocket(currentUser?.uid);
  //react state which stores dashboard data, initially null
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const showExpenses = true;
  const {
    isOpen: isOnboardingOpen,
    activeStepNumber,
    steps: onboardingSteps,
    closeGuide,
    completeGuide,
    goToStep,
  } = usePageOnboarding("/dashboard");

// const for monthly snapshot
const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>([]);
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
        setError("error fetching dashboard data");
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
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setSnapshots(res.data);
      } catch (err) {
        console.error(err);
      }
    };

  fetchSnapshots();
}, [token, loading, currentUser]);

const isSnapshotMode = snapshotIndex !== null;

const selectedSnapshot =
  snapshotIndex !== null ? snapshots[snapshotIndex] : null;

const displayedData: DashboardData | null = selectedSnapshot
  ? {
      healthScore: selectedSnapshot.healthScore,
      takeHome: selectedSnapshot.takeHomePay,
      totalBudget: selectedSnapshot.categories.reduce((sum, c) => sum + c.budget, 0),
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
      <div style={{ marginBottom: "20px" }} data-onboarding="dashboard-takehome">
        <h3>
          Snapshot of {snapshots[snapshotIndex].month}/{snapshots[snapshotIndex].year}
        </h3>
      </div>
      )}

      <div style={{ marginBottom: "20px" }} data-onboarding="dashboard-takehome">
        <h3>
          Take-home: £{displayedData.takeHome.toFixed(2)} | Budget: £{displayedData.totalBudget.toFixed(2)}
        </h3>
      </div>

      <div style={{ display: "flex", gap: "40px", marginBottom: "40px" }}>
        <div data-onboarding="dashboard-allocation">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", gap: "12px" }}>
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", gap: "12px" }}>
            <h4 style={{ margin: 0 }}>Actual Spending</h4>
            {/*disable if snapshot mode*/}
            {!isSnapshotMode && (
              <button
                type="button"
                onClick={() => navigate("/expenses")}
                style={{
                  padding: "8px 12px",
                  borderRadius: "999px",
                  border: "1px solid #bfd1c0",
                  backgroundColor: "#eef5eb",
                  color: "#37553e",
                  fontWeight: 600,
                }}
              >
                Edit Expenses
              </button>
            )}
            {/*disable if snapshot mode*/}
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
          <div style={{ flex: 1, borderLeft: "1px solid #ccc", paddingLeft: "20px" }} data-onboarding="dashboard-embedded-expenses">
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
          <p style={{ fontSize: "20px" }}>£{displayedData.takeHome.toFixed(2)}</p>
        </div>

        <div>
          <h4>Budget Left</h4>
          <p style={{ fontSize: "20px" }}>£{displayedData.budgetLeft.toFixed(2)}</p>
        </div>

        <div data-onboarding="dashboard-budget-vs-actual">
          <h4>Budget vs Actual</h4>
          {displayedData.budgetLeft >= 0 ? (
            <p>Under budget by £{displayedData.budgetLeft.toFixed(2)}</p>
          ) : (
            <p>
              {/*abs ensures displayed number is positive when showing overbudget*/}
              Over budget by £{Math.abs(displayedData.budgetLeft).toFixed(2)}
            </p>
          )}
        </div>

        {displayedData.averageSalary && (
          <div>
            <h4>Market Salary</h4>
            <p style={{ fontSize: "20px" }}>£{displayedData.averageSalary.toLocaleString()}</p>
            <p style={{ fontSize: "12px", color: "#666" }}>Average for your role</p>
          </div>
        )}
      </div>

      {snapshots.length > 0 && (
        <div
          style={{
            marginTop: "60px",
            paddingTop: "20px",
            borderTop: "1px solid #ddd",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <button
            onClick={() => {
              if (snapshotIndex === null) {
                setSnapshotIndex(0);
              } else if (snapshotIndex < snapshots.length - 1) {
                setSnapshotIndex(snapshotIndex + 1);
              }
            }}
            disabled={snapshotIndex !== null && snapshotIndex >= snapshots.length - 1}
          >
            ◀ Older
          </button>

          <div style={{ fontWeight: 600 }}>
            {snapshotIndex === null
              ? "Live (Current Month)"
              : `${snapshots[snapshotIndex].month}/${snapshots[snapshotIndex].year}`}
          </div>

          <button
            onClick={() => {
              if (snapshotIndex === null) return;
              if (snapshotIndex > 0) setSnapshotIndex(snapshotIndex - 1);
              else setSnapshotIndex(null); // go back to live
            }}
          >
            Newer ▶
          </button>
        </div>
      )}

      {/* Calendar dropdown */}
      {/* Only shows months with valid snapshots */}
      <SnapshotMonthDropdown
        snapshots={snapshots}
        snapshotIndex={snapshotIndex}
        setSnapshotIndex={setSnapshotIndex}
      />

      {/* If no snapshot yet */}
      {snapshots.length == 0 && (
          <div style={{ fontWeight: 600 }}>
              You don't have any snapshots yet
          </div>
      )}

      {/* summary */}
      {isSnapshotMode && selectedSnapshot && (
        <div style={{ marginBottom: "30px" }}>
          <p><b>XP Earned:</b> {selectedSnapshot.xpEarned}</p>
          <p><b>Quizzes Completed:</b> {selectedSnapshot.quizzesCompleted}</p>
        </div>
      )}

      {/* budget adherence table */}
      {isSnapshotMode && selectedSnapshot && (
  <div>
    <div style={{ marginTop: "20px" }}>
      <h4>Budget Adherence</h4>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #ccc" }}>
            <th style={{ textAlign: "left", padding: "8px" }}>Category</th>
            <th style={{ textAlign: "left", padding: "8px" }}>Budget</th>
            <th style={{ textAlign: "left", padding: "8px" }}>Actual</th>
            <th style={{ textAlign: "left", padding: "8px" }}>Difference</th>
          </tr>
        </thead>
        <tbody>
          {selectedSnapshot.categories.map((cat, idx) => {
            const diff = cat.budget - cat.actual;
            return (
              <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "8px" }}>{cat.name}</td>
                <td style={{ padding: "8px" }}>£{cat.budget.toFixed(2)}</td>
                <td style={{ padding: "8px" }}>£{cat.actual.toFixed(2)}</td>
                <td style={{ padding: "8px", color: diff >= 0 ? "green" : "red" }}>
                  {diff >= 0 ? `+£${diff.toFixed(2)}` : `-£${Math.abs(diff).toFixed(2)}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    <p style={{ marginTop: "40px", fontSize: "12px", color: "#777" }}>
      Snapshot created: {new Date(selectedSnapshot.createdAt).toLocaleString()}
    </p>
  </div>
)}

      {/* Adzuna Tips Section */}
      {displayedData.adzunaTips && displayedData.adzunaTips.length > 0 && (
        <div style={{ marginTop: "50px", borderTop: "2px solid #ddd", paddingTop: "30px" }} data-onboarding="dashboard-adzuna-tips">
          <h3 style={{ marginBottom: "20px", color: "#333" }}>💡 Financial Tips Based on Market Data</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
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
                <h5 style={{ margin: "0 0 8px 0", color: "#333", fontSize: "16px", fontWeight: "600" }}>
                  {tip.title}
                </h5>
                <p style={{ margin: "0", color: "#555", fontSize: "14px", lineHeight: "1.5" }}>
                  {tip.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
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
    </>
  );
};

export default Dashboard;
