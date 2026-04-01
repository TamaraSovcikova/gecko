import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const { token, loading, currentUser } = useAuth();

  const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<MonthlySnapshot | null>(null);
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

        if (res.data.length > 0) {
          setSelectedSnapshot(res.data[0]);
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
    return <div>No monthly snapshots available yet.</div>;
  }
  if (!selectedSnapshot) return <div>Loading monthly snapshots...</div>;

  const budgetAllocation = selectedSnapshot.categories.map((cat) => ({
    name: cat.name,
    value: cat.budget,
  }));

  const actualSpending = selectedSnapshot.categories.map((cat) => ({
    name: cat.name,
    value: cat.actual,
  }));

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "30px auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* navbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
          padding: "10px 0",
          borderBottom: "1px solid #ccc",
        }}
      >
        <h2>Monthly Snapshot</h2>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => navigate("/dashboard")}>Dashboard</button>
          <button onClick={() => navigate("/profile")}>Profile</button>
        </div>
      </div>

      {/* dropdown */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ marginRight: "10px" }}>Select Month:</label>

        <select
          value={selectedSnapshot._id}
          onChange={(e) => {
            const found = snapshots.find((s) => s._id === e.target.value);
            if (found) setSelectedSnapshot(found);
          }}
        >
          {snapshots.map((snap) => (
            <option key={snap._id} value={snap._id}>
              {monthName(snap.month)} {snap.year}
            </option>
          ))}
        </select>
      </div>

      <h3>
        Snapshot: {monthName(selectedSnapshot.month)} {selectedSnapshot.year}
      </h3>

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
  );
};

export default MonthlySnapshotPage;