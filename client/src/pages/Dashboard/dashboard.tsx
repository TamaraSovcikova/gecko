import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/config";

const COLOURS = ["red", "green", "turquoise", "blue"]; //could probably do with a colour re-work (actual hex). this makes things very ugly

// Type for individual tips
type AdzunaTip = {
  type: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
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
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { token, loading } = useAuth();
  //react state which stores dadhboard data, intially null
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  //useEffect runs once - triggers loading data from backens
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
  }, [token]); //dependency array ensures this only runs once when component mounts and when token changes
  
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
  if (!data) return <div>Loading...</div>;

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "30px auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* simple navbar with navigation buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
          padding: "10px 0",
          borderBottom: "1px solid #ccc",
        }}
      >
        <h2>Dashboard</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          {/* redirects user to profile page */}
          <button onClick={() => navigate("/profile")}>Profile</button>
          {/* redirects user to quiz page */}
          <button onClick={() => navigate("/quiz")}>Quiz</button>
          {/* redirects to expense - may need to be renamed*/}
          <button onClick={() => navigate("/expenses")}>Log Expense</button>
          {/* logout button */}
          <button onClick={handleLogout} style={{ backgroundColor: "#ff6b6b", color: "white" }}>Logout</button>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>
          Take-home: £{data.takeHome.toFixed(2)} | Budget: £{data.totalBudget.toFixed(2)}
        </h3>
      </div>

      <div style={{ display: "flex", gap: "40px", marginBottom: "40px" }}>
        <div>
          <h4>Budget Allocation</h4>
          <PieChart width={300} height={220}>
            <Pie
              data={data.budgetAllocation || []} //fallback to empty array prevents runtime
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={70}
            >
              {/* different colours for each slice*/}
              {(data.budgetAllocation || []).map((_, index) => (
                <Cell key={index} fill={COLOURS[index % COLOURS.length]} />
              ))}
            </Pie>
            {/*tooltps and labels allow cool breakdowns when hoevering*/}
            <Tooltip />
            <Legend />
          </PieChart>
        </div>

        <div>
          <h4>Actual Spending</h4>
          <PieChart width={300} height={220}>
            <Pie
              data={data.actualSpending || []}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={70}
            >
              {(data.actualSpending || []).map((_, index) => (
                <Cell key={index} fill={COLOURS[index % COLOURS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      </div>

      <div style={{ display: "flex", gap: "60px" }}>
        <p
          style={{
            fontSize: "28px",
            fontWeight: "bold",
            color:
              data.healthScore < 40
                ? "red"
                : data.healthScore < 70
                  ? "orange"
                  : "green",
          }}
        >
          {data.healthScore}
        </p>

        <div>
          <h4>Take Home</h4>
          <p style={{ fontSize: "20px" }}>£{data.takeHome.toFixed(2)}</p>
        </div>

        <div>
          <h4>Budget Left</h4>
          <p style={{ fontSize: "20px" }}>£{data.budgetLeft.toFixed(2)}</p>
        </div>

        <div>
          <h4>Budget vs Actual</h4>
          {data.budgetLeft >= 0 ? (
            <p>Under budget by £{data.budgetLeft.toFixed(2)}</p>
          ) : (
            <p>
              {/*abs ensures displayed numebr is positive wen showing overbudget*/}
              Over budget by £{Math.abs(data.budgetLeft).toFixed(2)}
            </p>
          )}
        </div>

        {data.averageSalary && (
          <div>
            <h4>Market Salary</h4>
            <p style={{ fontSize: "20px" }}>£{data.averageSalary.toLocaleString()}</p>
            <p style={{ fontSize: "12px", color: "#666" }}>Average for your role</p>
          </div>
        )}
      </div>

      {/* Adzuna Tips Section */}
      {data.adzunaTips && data.adzunaTips.length > 0 && (
        <div style={{ marginTop: "50px", borderTop: "2px solid #ddd", paddingTop: "30px" }}>
          <h3 style={{ marginBottom: "20px", color: "#333" }}>💡 Financial Tips Based on Market Data</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {data.adzunaTips.map((tip, index) => (
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
  );
};
export default Dashboard;
