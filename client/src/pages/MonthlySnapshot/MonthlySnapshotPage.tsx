import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import TopNav from "../../components/TopNav";

const COLOURS = ["red", "green", "turquoise", "blue", "orange", "purple"];

type CategorySnapshot = {
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
  categories: CategorySnapshot[];
  xpEarned: number;
  quizzesCompleted: number;
  createdAt: string;
};

const monthName = (month: number) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return months[month - 1] || "Unknown";
};

const MonthlySnapshotPage = () => {
  const { token, loading, currentUser } = useAuth();

  const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !token || !currentUser) return;

    const fetchSnapshots = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/snapshots/${currentUser.uid}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setSnapshots(res.data);

        // default to most recent snapshot
        if (res.data.length > 0) {
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error(err);
        setError("Error fetching monthly snapshots");
      }
    };

    fetchSnapshots();
  }, [token, loading, currentUser]);

  if (error) return <div>{error}</div>;

  if (snapshots.length === 0) {
    return (
      <>
        <TopNav />
        <div style={{ maxWidth: "1000px", margin: "30px auto" }}>
          No monthly snapshots available yet.
        </div>
      </>
    );
  }

  const selectedSnapshot = snapshots[selectedIndex];

  if (!selectedSnapshot) {
    return (
      <>
        <TopNav />
        <div style={{ maxWidth: "1000px", margin: "30px auto" }}>
          Loading monthly snapshots...
        </div>
      </>
    );
  }

  const budgetAllocation = selectedSnapshot.categories.map((cat) => ({
    name: cat.name,
    value: cat.budget,
  }));

  const actualSpending = selectedSnapshot.categories.map((cat) => ({
    name: cat.name,
    value: cat.actual,
  }));

  const handlePrev = () => {
    if (selectedIndex < snapshots.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

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
        {/* month navigation */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={handlePrev}
            disabled={selectedIndex === snapshots.length - 1}
            style={{
              padding: "6px 12px",
              cursor: "pointer",
              opacity: selectedIndex === snapshots.length - 1 ? 0.5 : 1,
            }}
          >
            ◀ Prev
          </button>

          <h3 style={{ margin: 0 }}>
            {monthName(selectedSnapshot.month)} {selectedSnapshot.year}
          </h3>

          <button
            onClick={handleNext}
            disabled={selectedIndex === 0}
            style={{
              padding: "6px 12px",
              cursor: "pointer",
              opacity: selectedIndex === 0 ? 0.5 : 1,
            }}
          >
            Next ▶
          </button>
        </div>

        {/* summary */}
        <div style={{ marginBottom: "30px" }}>
          <h4>Summary</h4>
          <p><b>Health Score:</b> {selectedSnapshot.healthScore}</p>
          <p><b>Gross Salary:</b> £{selectedSnapshot.grossSalary.toFixed(2)}</p>
          <p><b>Take Home Pay:</b> £{selectedSnapshot.takeHomePay.toFixed(2)}</p>
          <p><b>Total Expenses:</b> £{selectedSnapshot.totalExpenses.toFixed(2)}</p>
          <p><b>Savings:</b> £{selectedSnapshot.savings.toFixed(2)}</p>
          <p><b>XP Earned:</b> {selectedSnapshot.xpEarned}</p>
          <p><b>Quizzes Completed:</b> {selectedSnapshot.quizzesCompleted}</p>
        </div>

        {/* charts */}
        <div style={{ display: "flex", gap: "40px", marginBottom: "40px" }}>
          <div>
            <h4>Budget Allocation</h4>
            <PieChart width={300} height={220}>
              <Pie
                data={budgetAllocation}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
              >
                {budgetAllocation.map((_, index) => (
                  <Cell key={index} fill={COLOURS[index % COLOURS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>

          <div>
            <h4>Actual Spending</h4>
            <PieChart width={300} height={220}>
              <Pie
                data={actualSpending}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
              >
                {actualSpending.map((_, index) => (
                  <Cell key={index} fill={COLOURS[index % COLOURS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
        </div>

        {/* budget adherence table */}
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
                      {diff >= 0
                        ? `+£${diff.toFixed(2)}`
                        : `-£${Math.abs(diff).toFixed(2)}`}
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
    </>
  );
};

export default MonthlySnapshotPage;