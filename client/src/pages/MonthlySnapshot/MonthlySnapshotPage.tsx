import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { useNavigate } from "react-router-dom";

const COLOURS = ["red", "green", "turquoise", "blue", "orange", "purple"];

type Category = {
  name: string;
  budget: number;
};

type MonthlySnapshot = {
  userId: string;
  month: number;
  year: number;
  grossSalary: number;
  taxPaid?: number;
  niPaid?: number;
  takeHomePay?: number;
  categories: Category[];
  createdAt: string;
};

const MonthlySnapshotPage = () => {
  const navigate = useNavigate();
  const { token, loading, currentUser } = useAuth();

  const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<MonthlySnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch all snapshots for this user
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
          setSelectedSnapshot(res.data[0]); // newest snapshot
        }
      } catch (err) {
        console.error(err);
        setError("Error fetching monthly snapshots");
      }
    };

    fetchSnapshots();
  }, [token, loading, currentUser]);

  const monthName = (month: number) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months[month - 1] || "Unknown";
  };

  if (error) return <div>{error}</div>;
  if (!selectedSnapshot) return <div>Loading snapshots...</div>;

  const budgetAllocationData = selectedSnapshot.categories.map((c) => ({
    name: c.name,
    value: c.budget,
  }));

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "30px auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Navbar */}
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
          <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
          <button onClick={() => navigate("/profile")}>Profile</button>
        </div>
      </div>

      {/* Snapshot Selector */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ marginRight: "10px" }}>Select Month:</label>
        <select
          value={selectedSnapshot._id}
          onChange={(e) => {
            const snapshot = snapshots.find((s: any) => s._id === e.target.value);
            if (snapshot) setSelectedSnapshot(snapshot);
          }}
        >
          {snapshots.map((s: any) => (
            <option key={s._id} value={s._id}>
              {monthName(s.month)} {s.year}
            </option>
          ))}
        </select>
      </div>

      {/* Snapshot Display */}
      <div style={{ marginBottom: "20px" }}>
        <h3>
          {monthName(selectedSnapshot.month)} {selectedSnapshot.year}
        </h3>

        <p>
          Gross Salary: £{selectedSnapshot.grossSalary.toFixed(2)}
        </p>
        <p>
          Tax Paid: £{(selectedSnapshot.taxPaid || 0).toFixed(2)}
        </p>
        <p>
          NI Paid: £{(selectedSnapshot.niPaid || 0).toFixed(2)}
        </p>
        <p>
          Take Home Pay: £{(selectedSnapshot.takeHomePay || 0).toFixed(2)}
        </p>
      </div>

      {/* Budget Allocation Pie Chart */}
      <div style={{ marginTop: "30px" }}>
        <h4>Budget Allocation</h4>
        <PieChart width={400} height={260}>
          <Pie
            data={budgetAllocationData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
          >
            {budgetAllocationData.map((_, index) => (
              <Cell key={index} fill={COLOURS[index % COLOURS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </div>

      {/* Categories Table */}
      <div style={{ marginTop: "30px" }}>
        <h4>Categories</h4>
        <ul>
          {selectedSnapshot.categories.map((cat, index) => (
            <li key={index}>
              {cat.name}: £{cat.budget.toFixed(2)}
            </li>
          ))}
        </ul>
      </div>

      <p style={{ marginTop: "40px", fontSize: "12px", color: "#777" }}>
        Snapshot created on: {new Date(selectedSnapshot.createdAt).toLocaleString()}
      </p>
    </div>
  );
};

export default MonthlySnapshotPage;