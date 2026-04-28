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
import MonthlySnapshot from "../../components/MonthlySnapshot";
import GroqChat from "./groqChat.tsx";
import { useStreakWarning } from "../../hooks/useStreakWarning";

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
  // gamification: TODO tasks
  // xpEarned: number;
  // quizzesCompleted: number;
  // createdAt: string;
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
  const [popupSnapshot, setPopupSnapshot] = useState<MonthlySnapshot | null>(
    null,
  );
  // dashboard states
  const navigate = useNavigate();
  const location = useLocation();
  const { token, loading, currentUser } = useAuth();
  const socket = useSocket(currentUser?.uid);
  const { showStreakWarning } = useStreakWarning();
  //react state which stores dashboard data, initially null
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  // expense breakdown toggle
  const [showExpenseBreakdown, setShowExpenseBreakdown] = useState(false);
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

  const selectedSnapshot =
    snapshotIndex !== null ? snapshots[snapshotIndex] : null;

  // use state for 7 expenses per table page
  const [expensePage, setExpensePage] = useState(1);
  const EXPENSES_PER_PAGE = 7;

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

  // expense edit button
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    category: "",
    amount: 0,
    date: "",
    note: "",
  });

  // pending delete state
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const updateExpense = async (expenseId: string) => {
    try {
      console.log("Updating expense:", expenseId, editForm);

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

      console.log("Expense updated successfully:", res.data);

      // update frontend immediately (without waiting for socket)
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

      setEditingExpenseId(null);
      setPendingDeleteId(null);
    } catch (err) {
      console.error("Failed to update expense:", err);
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

  // calculate number of expenses
  // 7 expenses (rows) per expense breakdown table page
  const totalExpenses = displayedData?.expenses?.length || 0;
  const totalExpensePages = Math.ceil(totalExpenses / EXPENSES_PER_PAGE);

  const expenseStartIndex = (expensePage - 1) * EXPENSES_PER_PAGE;
  const expenseEndIndex = expenseStartIndex + EXPENSES_PER_PAGE;

  const pagedExpenses =
    displayedData?.expenses?.slice(expenseStartIndex, expenseEndIndex) || [];

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

        {showStreakWarning && (
        <div
          style={{
            padding: "10px",
            marginBottom: "10px",
            background: "#fff3cd",
            border: "1px solid #ffeeba",
            borderRadius: "6px",
            fontSize: "13px",
            color: "#856404",
          }}
        >
          ⚠️ Complete a quiz this week to keep your streak alive
        </div>
      )}
      
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

        {/* expense breakdown button */}
        {!isSnapshotMode && (
          <button
            type="button"
            onClick={() => setShowExpenseBreakdown(!showExpenseBreakdown)}
            data-onboarding="dashboard-health-breakdown-trigger"
            style={{
              padding: "8px 12px",
              borderRadius: "999px",
              border: "1px solid #bfd1c0",
              backgroundColor: "#eef5eb",
              color: "#37553e",
              fontWeight: 600,
            }}
          >
            {showExpenseBreakdown
              ? "Hide expense breakdown"
              : "See expense breakdown"}
          </button>
        )}

        {/* expense table but make it live */}
        {!isSnapshotMode && showExpenseBreakdown && displayedData?.expenses && (
          <div style={{ marginTop: "30px" }}>
            <h4>Expense Breakdown</h4>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #ccc" }}>
                  <th style={{ textAlign: "left", padding: "8px" }}>
                    Category
                  </th>
                  <th style={{ textAlign: "left", padding: "8px" }}>Value</th>
                  <th style={{ textAlign: "left", padding: "8px" }}>
                    dd/mm/yyyy
                  </th>
                  <th style={{ textAlign: "left", padding: "8px" }}>Notes</th>
                  <th style={{ textAlign: "left", padding: "8px" }}>Edit</th>
                  <th style={{ textAlign: "left", padding: "8px" }}>Delete</th>
                </tr>
              </thead>

              <tbody>
                {pagedExpenses.map((exp, idx) => {
                  const isEditing = editingExpenseId === exp._id;

                  return (
                    <tr
                      key={exp._id || idx}
                      style={{ borderBottom: "1px solid #eee" }}
                    >
                      {/* CATEGORY */}
                      <td style={{ padding: "8px" }}>
                        {isEditing ? (
                          <select
                            value={editForm.category}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                category: e.target.value,
                              }))
                            }
                            style={{
                              padding: "6px",
                              borderRadius: "6px",
                              border: "1px solid #ccc",
                              width: "100%",
                            }}
                          >
                            {(displayedData.budgetAllocation || []).map(
                              (cat) => (
                                <option key={cat.name} value={cat.name}>
                                  {cat.name}
                                </option>
                              ),
                            )}
                          </select>
                        ) : (
                          exp.category
                        )}
                      </td>

                      {/* VALUE */}
                      <td style={{ padding: "8px" }}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.amount}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                amount: Number(e.target.value),
                              }))
                            }
                          />
                        ) : (
                          `£${exp.amount.toFixed(2)}`
                        )}
                      </td>

                      {/* DATE */}
                      <td style={{ padding: "8px" }}>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editForm.date}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                date: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          new Date(exp.date).toLocaleDateString("en-GB")
                        )}
                      </td>

                      {/* NOTE */}
                      <td style={{ padding: "8px" }}>
                        {isEditing ? (
                          <input
                            value={editForm.note}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                note: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          exp.note || "-"
                        )}
                      </td>

                      {/* EDIT / SAVE */}
                      <td style={{ padding: "8px" }}>
                        {isEditing ? (
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={() => updateExpense(exp._id)}
                              style={{
                                padding: "4px 10px",
                                borderRadius: "6px",
                                border: "1px solid #ccc",
                                cursor: "pointer",
                              }}
                            >
                              Save
                            </button>

                            <button
                              onClick={cancelEditing}
                              style={{
                                padding: "4px 10px",
                                borderRadius: "6px",
                                border: "1px solid #ccc",
                                cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingExpenseId(exp._id);
                              setPendingDeleteId(null);
                              setEditForm({
                                category: exp.category,
                                amount: exp.amount,
                                date: exp.date,
                                note: exp.note || "",
                              });
                            }}
                            style={{
                              padding: "4px 10px",
                              borderRadius: "6px",
                              border: "1px solid #ccc",
                              cursor: "pointer",
                            }}
                          >
                            Edit
                          </button>
                        )}
                      </td>

                      {/* DELETE */}
                      <td style={{ padding: "8px" }}>
                        {pendingDeleteId === exp._id ? (
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={() => {
                                deleteExpense(exp._id);
                                setPendingDeleteId(null);
                              }}
                              style={{
                                padding: "4px 10px",
                                borderRadius: "6px",
                                border: "1px solid #ccc",
                                cursor: "pointer",
                                backgroundColor: "#dc3545",
                                color: "white",
                              }}
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setPendingDeleteId(null)}
                              style={{
                                padding: "4px 10px",
                                borderRadius: "6px",
                                border: "1px solid #ccc",
                                cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setPendingDeleteId(exp._id)}
                            style={{
                              padding: "4px 10px",
                              borderRadius: "6px",
                              border: "1px solid #ccc",
                              cursor: "pointer",
                              color: "red",
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* expense breakdown table nav buttons */}
        {showExpenseBreakdown && totalExpensePages > 1 && (
          <div
            style={{
              marginTop: "12px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <button
              onClick={() => setExpensePage((prev) => Math.max(prev - 1, 1))}
              disabled={expensePage === 1}
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                cursor: "pointer",
              }}
            >
              ◀
            </button>

            <span style={{ fontSize: "13px", fontWeight: 600 }}>
              Page {expensePage}/{totalExpensePages}
            </span>

            <button
              onClick={() =>
                setExpensePage((prev) => Math.min(prev + 1, totalExpensePages))
              }
              disabled={expensePage === totalExpensePages}
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                cursor: "pointer",
              }}
            >
              ▶
            </button>
          </div>
        )}

        {/* Monthly Snapshot Section */}
        {isSnapshotMode && selectedSnapshot && (
          <div style={{ marginTop: "30px" }}>
            <MonthlySnapshot snapshot={selectedSnapshot} />
          </div>
        )}

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
              disabled={
                snapshotIndex !== null && snapshotIndex >= snapshots.length - 1
              }
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
              Monthly Snapshot: {monthName(popupSnapshot.month)} {popupSnapshot.year}
            </h2>

            <p style={{ marginTop: "10px", color: "#555" }}>
              Snapshot created: {new Date(popupSnapshot.createdAt).toLocaleString()}
            </p>

            <p style={{ marginTop: "10px", color: "#000" }}>
              This is your monthly summary for the past month. Past snapshots can be
              found on your dashboard page using nav buttons and a dropdown.
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
