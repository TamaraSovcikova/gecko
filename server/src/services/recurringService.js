const Expense = require("../models/Expense");

function round2(v) { return Number(Number(v || 0).toFixed(2)); }
function normCat(v) { return String(v || "").trim().toLowerCase(); }
function getMonthKey(date) {
  const d = new Date(date);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}
function dayOfMonth(date) { return new Date(date).getDate(); }
function mean(arr) { return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0; }
function stdDev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
}
function nextOccurrenceDate(avgDay, refDate) {
  const ref = new Date(refDate);
  const day = Math.round(avgDay);
  const nextMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
  const maxDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
  nextMonth.setDate(Math.min(day, maxDay));
  return nextMonth.toISOString().split("T")[0];
}

async function detectRecurringTransactions(userId) {
  const expenses = await Expense.find({ userId }).sort({ date: 1 });
  if (expenses.length < 3) return [];
  const groups = {};
  for (const e of expenses) {
    const cat = normCat(e.category);
    const bucket = Math.round(Number(e.amount) / 5) * 5;
    const key = cat + "::" + bucket;
    if (!groups[key]) groups[key] = { cat, items: [] };
    groups[key].items.push({ date: new Date(e.date), amount: Number(e.amount), monthKey: getMonthKey(e.date), note: e.note || "" });
  }
  const recurring = [];
  const now = new Date();
  for (const [, group] of Object.entries(groups)) {
    const { cat, items } = group;
    if (items.length < 2) continue;
    const byMonth = {};
    for (const item of items) {
      if (!byMonth[item.monthKey] || item.amount > byMonth[item.monthKey].amount) byMonth[item.monthKey] = item;
    }
    const monthly = Object.values(byMonth).sort((a, b) => a.date - b.date);
    if (monthly.length < 2) continue;
    let consecutiveMonths = 0;
    for (let i = 1; i < monthly.length; i++) {
      const prev = monthly[i - 1].date;
      const curr = monthly[i].date;
      const diffMonths = (curr.getFullYear() - prev.getFullYear()) * 12 + (curr.getMonth() - prev.getMonth());
      if (diffMonths === 1) consecutiveMonths++;
    }
    if (consecutiveMonths < 1) continue;
    const amounts = monthly.map(i => i.amount);
    const days = monthly.map(i => dayOfMonth(i.date));
    const avgAmount = mean(amounts);
    const avgDay = mean(days);
    const amountCV = stdDev(amounts) / (avgAmount || 1);
    const daySD = stdDev(days);
    if (amountCV > 0.15 || daySD > 5) continue;
    const monthsSeen = monthly.length;
    const confidence = Math.min(99, Math.round(50 + (consecutiveMonths / monthsSeen) * 30 + (1 - amountCV) * 19));
    const nextDate = nextOccurrenceDate(avgDay, now);
    const currentMonthKey = getMonthKey(now);
    const paidThisMonth = Boolean(byMonth[currentMonthKey]);
    const daysUntil = Math.round((new Date(nextDate) - now) / (1000 * 60 * 60 * 24));
    recurring.push({
      category: cat,
      avgAmount: round2(avgAmount),
      avgDay: Math.round(avgDay),
      nextDate,
      daysUntil,
      paidThisMonth,
      monthsSeen,
      consecutiveMonths,
      confidence,
      status: paidThisMonth ? "paid" : daysUntil <= 3 ? "due_soon" : daysUntil <= 7 ? "upcoming" : "scheduled",
    });
  }
  return recurring.sort((a, b) => a.daysUntil - b.daysUntil);
}

module.exports = { detectRecurringTransactions };
