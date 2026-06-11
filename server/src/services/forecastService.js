const SLRModule = require("ml-regression-simple-linear");
const SimpleLinearRegression = SLRModule.SimpleLinearRegression || SLRModule.default || SLRModule;
const Expense = require("../models/Expense");
const MonthlyBudget = require("../models/MonthlyBudget");
const User = require("../models/User");

function getMonthKey(date) {
  const d = date || new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}
function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function round2(v) { return Number(Number(v || 0).toFixed(2)); }
function normCat(v) { return String(v || "").trim().toLowerCase(); }
function monthIndex(d) { return d.getFullYear() * 12 + d.getMonth(); }

function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
}
function mean(arr) { return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0; }
function stdDev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
}
function detectAnomaly(series, value) {
  if (series.length < 4) return false;
  const sd = stdDev(series);
  return sd > 0 && Math.abs((value - mean(series)) / sd) > 2.0;
}
function seasonalPrediction(series, targetMonth) {
  const s = series.filter(i => new Date(i.monthKey + "-01").getMonth() === targetMonth);
  return s.length ? round2(mean(s.map(i => i.total))) : null;
}
function rollingMedian3(series) {
  const last3 = series.slice(-3).map(i => i.total);
  return last3.length ? round2(median(last3)) : null;
}
function linearPrediction(series) {
  const x = series.map(i => i.monthIndex);
  const y = series.map(i => i.total);
  if (series.length < 2) return 0;
  if (y.every(v => v === y[0])) return round2(y[0]);
  const reg = new SimpleLinearRegression(x, y);
  return round2(Math.max(0, reg.predict(x[x.length - 1] + 1)));
}
function computeConfidence(values) {
  if (values.length < 2) return 50;
  const m = mean(values);
  if (m === 0) return 50;
  return Math.round(Math.max(10, Math.min(99, 100 - (stdDev(values) / m) * 100)));
}
function trendDirection(series) {
  if (series.length < 3) return "stable";
  const last = series.slice(-3).map(i => i.total);
  const slope = (last[2] - last[0]) / 2;
  const m = mean(last);
  if (slope > m * 0.1) return "up";
  if (slope < -m * 0.1) return "down";
  return "stable";
}

async function ensureForecastMonthState(userDoc) {
  const key = getMonthKey();
  if (!userDoc.forecastWarningState || userDoc.forecastWarningState.monthKey !== key) {
    userDoc.forecastWarningState = { monthKey: key, dismissedWarningIds: [] };
    await userDoc.save();
  }
  return userDoc.forecastWarningState;
}

function buildCategoryBudgetMap(doc) {
  const bm = {}, lm = {};
  for (const c of (doc?.categories || [])) {
    const raw = c.name || c.category || c.label;
    const name = normCat(raw);
    if (!name) continue;
    bm[name] = round2(c.budgetedAmount ?? c.budget ?? c.amount ?? 0);
    if (!lm[name]) lm[name] = String(raw || "").trim() || name;
  }
  return { categoryBudgetMap: bm, categoryLabelMap: lm };
}

function buildHistoricalSeries(expenses, lm) {
  const bc = {};
  for (const e of expenses) {
    const date = new Date(e.date);
    const cat = normCat(e.category);
    if (!cat || Number(e.amount) <= 0) continue;
    if (!lm[cat]) lm[cat] = String(e.category || "").trim() || cat;
    const mk = getMonthKey(date);
    const mi = monthIndex(date);
    if (!bc[cat]) bc[cat] = {};
    if (!bc[cat][mk]) bc[cat][mk] = { monthIndex: mi, monthKey: mk, total: 0 };
    bc[cat][mk].total += Number(e.amount);
  }
  const r = {};
  for (const cat of Object.keys(bc)) {
    r[cat] = Object.values(bc[cat]).map(i => ({ ...i, total: round2(i.total) })).sort((a, b) => a.monthIndex - b.monthIndex);
  }
  return r;
}

function buildCurrentSpendMap(expenses, now, lm) {
  const ck = getMonthKey(now);
  const map = {};
  for (const e of expenses) {
    if (getMonthKey(new Date(e.date)) !== ck) continue;
    const cat = normCat(e.category);
    if (!cat) continue;
    if (!lm[cat]) lm[cat] = String(e.category || "").trim() || cat;
    map[cat] = round2((map[cat] || 0) + Number(e.amount));
  }
  return map;
}

function applySalaryBound(forecasts, gross) {
  const total = Object.values(forecasts).reduce((s, i) => s + i.finalForecast, 0);
  if (!gross || total <= gross) return forecasts;
  const scale = gross / total;
  const r = {};
  for (const [c, item] of Object.entries(forecasts)) {
    r[c] = { ...item, finalForecast: round2(item.finalForecast * scale), salaryClamped: true };
  }
  return r;
}

function buildWarnings({ categoryForecasts, categoryBudgetMap, categoryLabelMap, dismissedWarningIds, currentMonthKey }) {
  const w = [];
  for (const [cat, item] of Object.entries(categoryForecasts)) {
    const label = categoryLabelMap[cat] || cat;
    const budget = categoryBudgetMap[cat] || 0;
    if (budget > 0 && item.finalForecast > budget * 1.15) {
      const id = "overspend:" + cat + ":" + currentMonthKey;
      if (!dismissedWarningIds.includes(id)) {
        const over = round2(item.finalForecast - budget);
        w.push({ id, type: "overspend", category: label, budget: round2(budget), projectedSpend: round2(item.finalForecast), overspendAmount: over, message: "You're on track to overspend on " + label + " by \xA3" + over.toFixed(2) + " this month." });
      }
    }
    if (item.anomaly) {
      const id = "anomaly:" + cat + ":" + currentMonthKey;
      if (!dismissedWarningIds.includes(id)) w.push({ id, type: "anomaly", category: label, message: "Unusual spending pattern in " + label + "." });
    }
  }
  return w;
}

async function computeForecastForUser(userId) {
  const now = new Date();
  const cKey = getMonthKey(now);
  const cIdx = monthIndex(now);
  const daysElapsed = now.getDate();
  const totalDays = getDaysInMonth(now.getFullYear(), now.getMonth());
  const targetMonth = (now.getMonth() + 1) % 12;

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  await ensureForecastMonthState(user);

  const budget = await MonthlyBudget.findOne({ userId }).sort({ createdAt: -1 });
  if (!budget) return { forecastingActive: false, reason: "NO_BUDGET_FOUND", projections: {}, warnings: [] };

  const allExpenses = await Expense.find({ userId }).sort({ date: 1 });
  const { categoryBudgetMap, categoryLabelMap } = buildCategoryBudgetMap(budget);
  const histSeries = buildHistoricalSeries(allExpenses, categoryLabelMap);
  const curSpendMap = buildCurrentSpendMap(allExpenses, now, categoryLabelMap);

  const histKeys = new Set();
  for (const e of allExpenses) {
    const idx = monthIndex(new Date(e.date));
    if (idx < cIdx) histKeys.add(getMonthKey(new Date(e.date)));
  }
  const monthsOfHistory = histKeys.size;
  if (monthsOfHistory < 2) return { forecastingActive: false, reason: "INSUFFICIENT_HISTORY", monthsOfHistory, projections: {}, warnings: [] };

  const categoryForecasts = {};
  const cats = new Set([...Object.keys(categoryBudgetMap), ...Object.keys(histSeries), ...Object.keys(curSpendMap)]);

  for (const cat of cats) {
    const full = histSeries[cat] || [];
    const hist = full.filter(i => i.monthIndex < cIdx);
    if (hist.length < 2) continue;
    const totals = hist.map(i => i.total);
    const linPred = linearPrediction(hist);
    const seasonal = seasonalPrediction(hist, targetMonth);
    const rolling = rollingMedian3(hist);
    const curSpend = curSpendMap[cat] || 0;
    const curTrend = daysElapsed > 0 ? round2(curSpend / daysElapsed * totalDays) : 0;
    const components = [[0.30, linPred], [0.20, seasonal], [0.30, rolling], [0.20, curTrend > 0 ? curTrend : null]].filter(([, v]) => v !== null);
    const tw = components.reduce((s, [w]) => s + w, 0);
    const ensemble = Math.max(0, tw > 0 ? components.reduce((s, [w, v]) => s + (w / tw) * v, 0) : linPred);
    const sd = stdDev(totals);
    categoryForecasts[cat] = {
      category: categoryLabelMap[cat] || cat, currentSpend: round2(curSpend), currentTrendMean: curTrend,
      linearPrediction: round2(linPred), seasonalPrediction: seasonal != null ? round2(seasonal) : null,
      rollingMedian: rolling != null ? round2(rolling) : null, finalForecast: round2(ensemble),
      lowerBound: Math.max(0, round2(ensemble - sd)), upperBound: round2(ensemble + sd),
      confidence: computeConfidence(totals), trend: trendDirection(hist),
      anomaly: detectAnomaly(totals, curSpend), budget: round2(categoryBudgetMap[cat] || 0), salaryClamped: false
    };
  }

  const gross = Number(budget.grossSalary || 0);
  const clamped = applySalaryBound(categoryForecasts, gross);
  const warnings = buildWarnings({ categoryForecasts: clamped, categoryBudgetMap, categoryLabelMap, dismissedWarningIds: user.forecastWarningState?.dismissedWarningIds || [], currentMonthKey: cKey });

  return {
    forecastingActive: true, reason: null, monthKey: cKey, monthsOfHistory, projections: clamped,
    totals: { totalProjectedSpend: round2(Object.values(clamped).reduce((s, i) => s + i.finalForecast, 0)), grossSalaryUpperBound: round2(gross) },
    warnings
  };
}

module.exports = { computeForecastForUser };
