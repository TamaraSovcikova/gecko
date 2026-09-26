const Expense = require("../models/Expense");

/**
 * Returns a 12-month analytics breakdown for the given user:
 *  - monthlyTotals: [{month, year, total, label}] - last 12 months
 *  - categoryTrend: [{label, categories: {name: amount}}] - for stacked bar
 *  - netSavings: [{label, income, expenses, net}] - requires payslip income
 *  - anomalies: [{month, category, amount, zscore}] - spikes > 2 SD
 *  - topCategories: [{name, total, pct}] - overall breakdown
 */
async function computeAnalytics(userId, monthlyIncome = 0) {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const expenses = await Expense.find({
    userId,
    date: { $gte: twelveMonthsAgo },
  }).sort({ date: 1 });

  // Build a 12-slot month grid
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
    });
  }

  // Aggregate by month + category
  const byMonthCategory = {};
  const byMonthTotal = {};
  const byCategoryTotal = {};

  expenses.forEach((e) => {
    const key = `${e.year}-${String(e.month).padStart(2, "0")}`;
    if (!byMonthCategory[key]) byMonthCategory[key] = {};
    byMonthCategory[key][e.category] = (byMonthCategory[key][e.category] || 0) + e.amount;
    byMonthTotal[key] = (byMonthTotal[key] || 0) + e.amount;
    byCategoryTotal[e.category] = (byCategoryTotal[e.category] || 0) + e.amount;
  });

  const monthlyTotals = months.map(({ year, month, label }) => {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    return { year, month, label, total: round(byMonthTotal[key] || 0) };
  });

  const categoryTrend = months.map(({ year, month, label }) => {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    return { label, categories: byMonthCategory[key] || {} };
  });

  const netSavings = months.map(({ year, month, label }) => {
    const key = `${year}-${String(month).padStart(2, "00")}`;
    const exp = byMonthTotal[key] || 0;
    const net = monthlyIncome > 0 ? monthlyIncome - exp : null;
    return { label, income: monthlyIncome, expenses: round(exp), net: net !== null ? round(net) : null };
  });

  // Anomaly detection: per category, flag months > 2 SD above mean
  const categoryMonthlyAmounts = {};
  months.forEach(({ year, month }) => {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const cats = byMonthCategory[key] || {};
    Object.entries(cats).forEach(([cat, amt]) => {
      if (!categoryMonthlyAmounts[cat]) categoryMonthlyAmounts[cat] = [];
      categoryMonthlyAmounts[cat].push(amt);
    });
  });

  const anomalies = [];
  months.forEach(({ year, month, label }) => {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const cats = byMonthCategory[key] || {};
    Object.entries(cats).forEach(([cat, amt]) => {
      const history = categoryMonthlyAmounts[cat] || [];
      if (history.length < 3) return;
      const mean = history.reduce((s, v) => s + v, 0) / history.length;
      const sd = Math.sqrt(history.reduce((s, v) => s + (v - mean) ** 2, 0) / history.length);
      if (sd === 0) return;
      const zscore = (amt - mean) / sd;
      if (zscore > 2) {
        anomalies.push({ label, category: cat, amount: round(amt), zscore: round(zscore) });
      }
    });
  });

  const totalExpenses = Object.values(byCategoryTotal).reduce((s, v) => s + v, 0);
  const topCategories = Object.entries(byCategoryTotal)
    .map(([name, total]) => ({
      name,
      total: round(total),
      pct: totalExpenses > 0 ? round((total / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return { monthlyTotals, categoryTrend, netSavings, anomalies, topCategories };
}

function round(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { computeAnalytics };
