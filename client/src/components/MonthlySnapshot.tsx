import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { COLORS } from "../constants/theme";

const COLOURS = [
  ...COLORS.chart,
  COLORS.purple400,
  COLORS.success,
];

type SnapshotCategory = {
  name: string;
  budget: number;
  actual: number;
};

export type MonthlySnapshotData = {
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

type Props = {
  snapshot: MonthlySnapshotData;
};

const cardStyle: React.CSSProperties = {
  padding: "12px",
  borderRadius: "10px",
  border: `1px solid ${COLORS.purple300}`,
  background: COLORS.purple50,
};

const MONTHS = [
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

export default function MonthlySnapshot({ snapshot }: Props) {
  const monthLabel = MONTHS[snapshot.month - 1] || "Unknown";

  return (
    <div>
      {/* HEADER */}
      <h2 style={{ margin: 0 }}>
        Monthly Snapshot: {monthLabel} {snapshot.year}
      </h2>

      <p style={{ marginTop: "10px", color: COLORS.textSecondary }}>
        Snapshot created: {new Date(snapshot.createdAt).toLocaleString()}
      </p>

      <p style={{ marginTop: "10px", color: COLORS.textPrimary }}>
        This is your monthly summary for the past month.
      </p>

      {/* SUMMARY GRID */}
      <div
        style={{
          marginTop: "20px",
          marginBottom: "30px",
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "12px",
        }}
      >
        <div style={cardStyle}>
          <b>Health Score:</b> {snapshot.healthScore}
        </div>
        <div style={cardStyle}>
          <b>Gross Salary:</b> £{snapshot.grossSalary.toFixed(2)}
        </div>
        <div style={cardStyle}>
          <b>Take Home:</b> £{snapshot.takeHomePay.toFixed(2)}
        </div>
        <div style={cardStyle}>
          <b>Expenses:</b> £{snapshot.totalExpenses.toFixed(2)}
        </div>
        <div style={cardStyle}>
          <b>Savings:</b> £{snapshot.savings.toFixed(2)}
        </div>
        <div style={cardStyle}>
          <b>XP:</b> {snapshot.xpEarned}
        </div>
        <div style={cardStyle}>
          <b>Quizzes:</b> {snapshot.quizzesCompleted}
        </div>
      </div>

      {/* CHARTS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "30px",
          marginBottom: "40px",
        }}
      >
        <div>
          <h4>Budget Allocation</h4>
          <PieChart width={320} height={240}>
            <Pie
              data={snapshot.categories.map((c) => ({
                name: c.name,
                value: c.budget,
              }))}
              dataKey="value"
              nameKey="name"
              outerRadius={80}
              cx="50%"
              cy="50%"
            >
              {snapshot.categories.map((_, i) => (
                <Cell key={i} fill={COLOURS[i % COLOURS.length]} />
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
              data={snapshot.categories.map((c) => ({
                name: c.name,
                value: c.actual,
              }))}
              dataKey="value"
              nameKey="name"
              outerRadius={80}
              cx="50%"
              cy="50%"
            >
              {snapshot.categories.map((_, i) => (
                <Cell key={i} fill={COLOURS[i % COLOURS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      </div>

      {/* TABLE */}
      <div style={{ borderTop: `1px solid ${COLORS.purple300}`, paddingTop: "20px" }}>
        <h4>Budget Adherence</h4>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">Category</th>
              <th align="left">Budget</th>
              <th align="left">Actual</th>
              <th align="left">Difference</th>
            </tr>
          </thead>

          <tbody>
            {snapshot.categories.map((cat, i) => {
              const diff = cat.budget - cat.actual;

              return (
                <tr key={i}>
                  <td>{cat.name}</td>
                  <td>£{cat.budget.toFixed(2)}</td>
                  <td>£{cat.actual.toFixed(2)}</td>
                  <td style={{ color: diff >= 0 ? COLORS.purple500 : COLORS.error }}>
                    {diff >= 0 ? `+£${diff}` : `-£${Math.abs(diff)}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
