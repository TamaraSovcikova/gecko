import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLOURS = ["red", "green", "turquoise", "blue", "orange", "purple"];

type SnapshotCategory = {
  name: string;
  budget: number;
  actual: number;
};

type MonthlySnapshot = {
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

const monthName = (month: number) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return months[month - 1] || "Unknown";
};

type Props = {
  snapshot: MonthlySnapshot;
  onClose: () => void;
};

const MonthlySnapshotPopup = ({ snapshot, onClose }: Props) => {
  return (
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
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>
            Monthly Snapshot: {monthName(snapshot.month)} {snapshot.year}
          </h2>

          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: "20px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ marginTop: "10px", color: "#555" }}>
          Snapshot created: {new Date(snapshot.createdAt).toLocaleString()}
        </p>

        <p style={{ marginTop: "10px", color: "#000" }}>
          This is your monthly summary for the past month. Past snapshots can be
          found on your dashboard page using nav buttons and a dropdown
        </p>

        <div style={{ marginTop: "25px", marginBottom: "30px" }}>
          <h3 style={{ marginBottom: "10px" }}>Summary</h3>
          <p><b>Health Score:</b> {snapshot.healthScore}</p>
          <p><b>Gross Salary:</b> £{snapshot.grossSalary.toFixed(2)}</p>
          <p><b>Take Home Pay:</b> £{snapshot.takeHomePay.toFixed(2)}</p>
          <p><b>Total Expenses:</b> £{snapshot.totalExpenses.toFixed(2)}</p>
          <p><b>Savings:</b> £{snapshot.savings.toFixed(2)}</p>
          <p><b>XP Earned:</b> {snapshot.xpEarned}</p>
          <p><b>Quizzes Completed:</b> {snapshot.quizzesCompleted}</p>
        </div>

        <div style={{ display: "flex", gap: "40px", marginBottom: "40px", flexWrap: "wrap" }}>
          <div>
            <h4>Budget Allocation</h4>
            <PieChart width={320} height={240}>
              <Pie
                data={snapshot.categories.map((cat) => ({
                  name: cat.name,
                  value: cat.budget,
                }))}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
              >
                {snapshot.categories.map((_, index) => (
                  <Cell key={index} fill={COLOURS[index % COLOURS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>

          <div>
            <h4>Actual Spending</h4>
            <PieChart width={320} height={240}>
              <Pie
                data={snapshot.categories.map((cat) => ({
                  name: cat.name,
                  value: cat.actual,
                }))}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
              >
                {snapshot.categories.map((_, index) => (
                  <Cell key={index} fill={COLOURS[index % COLOURS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
        </div>

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
              {snapshot.categories.map((cat, idx) => {
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

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "25px" }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#2f6a4b",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Close Snapshot
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonthlySnapshotPopup;