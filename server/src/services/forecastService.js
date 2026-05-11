const SLRModule = require("ml-regression-simple-linear");
const SimpleLinearRegression = SLRModule.SimpleLinearRegression || SLRModule.default || SLRModule;
const Expense = require("../models/Expense");
const MonthlyBudget = require("../models/MonthlyBudget");
const User = require("../models/User");

/**
 * Utility: format a Date into YYYY-MM
 */
function getMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Utility: get total days in a month
 */
function getDaysInMonth(year, monthIndexZeroBased) {
  return new Date(year, monthIndexZeroBased + 1, 0).getDate();
}

/**
 * Utility: safe number
 */
function toMoneyNumber(value) {
  const num = Number(value || 0);
  if (Number.isNaN(num)) return 0;
  return Number(num.toFixed(2));
}

/**
 * Utility: round to 2 dp
 */
function round2(value) {
  return Number(Number(value || 0).toFixed(2));
}

function normalizeCategoryName(value) {
  return String(value || "").trim().toLowerCase();
}

/**
 * Utility: month difference helper
 */
function getMonthIndex(date) {
  return date.getFullYear() * 12 + date.getMonth();
}

/**
 * Clears dismissed warnings if month changed.
 */
async function ensureForecastMonthState(userDoc) {
  const currentMonthKey = getMonthKey(new Date());

  if (
    !userDoc.forecastWarningState ||
    userDoc.forecastWarningState.monthKey !== currentMonthKey
  ) {
    console.log("[forecast] Month changed or no state found. Resetting dismissed warnings.");

    userDoc.forecastWarningState = {
      monthKey: currentMonthKey,
      dismissedWarningIds: [],
    };

    await userDoc.save();
  }

  return userDoc.forecastWarningState;
}

/**
 * Build category budget map from MonthlyBudget.categories.
 * Assumes categories is an array like:
 * [{ name: "Food", budgetedAmount: 200 }]
 * or similar.
 *
 * Adjust this mapper to your exact schema.
 */
function buildCategoryBudgetMap(monthlyBudgetDoc) {
  const categoryBudgetMap = {};
  const categoryLabelMap = {};

  const categories = monthlyBudgetDoc?.categories || [];

  for (const category of categories) {
    const rawName = category.name || category.category || category.label;
    const name = normalizeCategoryName(rawName);
    const budget =
      category.budgetedAmount ??
      category.budget ??
      category.amount ??
      0;

    if (!name) continue;

    categoryBudgetMap[name] = toMoneyNumber(budget);

    if (!categoryLabelMap[name]) {
      categoryLabelMap[name] = String(rawName || "").trim() || name;
    }
  }

  console.log("[forecast] categoryBudgetMap =", categoryBudgetMap);
  return { categoryBudgetMap, categoryLabelMap };
}

/**
 * Build monthly category totals from expense documents.
 * Returns:
 * {
 *   Food: [
 *     { monthIndex: 24299, monthKey: "2025-12", total: 120 },
 *     ...
 *   ]
 * }
 */
function buildHistoricalCategorySeries(expenses, categoryLabelMap = {}) {
  const byCategoryAndMonth = {};

  for (const expense of expenses) {
    const expenseDate = new Date(expense.date);
    const category = normalizeCategoryName(expense.category);

    if (!category || Number(expense.amount) <= 0) continue;

    if (!categoryLabelMap[category]) {
      categoryLabelMap[category] = String(expense.category || "").trim() || category;
    }

    const monthKey = getMonthKey(expenseDate);
    const monthIndex = getMonthIndex(expenseDate);

    if (!byCategoryAndMonth[category]) {
      byCategoryAndMonth[category] = {};
    }

    if (!byCategoryAndMonth[category][monthKey]) {
      byCategoryAndMonth[category][monthKey] = {
        monthIndex,
        monthKey,
        total: 0,
      };
    }

    byCategoryAndMonth[category][monthKey].total += Number(expense.amount);
  }

  const result = {};

  for (const category of Object.keys(byCategoryAndMonth)) {
    result[category] = Object.values(byCategoryAndMonth[category])
      .map((item) => ({
        ...item,
        total: round2(item.total),
      }))
      .sort((a, b) => a.monthIndex - b.monthIndex);
  }

  console.log("[forecast] historical category series =", JSON.stringify(result, null, 2));
  return result;
}

/**
 * Run regression prediction for a category series
 */
function runCategoryRegression(series) {
  // series = [{ monthIndex, total }, ...]
  const x = series.map((item) => item.monthIndex);
  const y = series.map((item) => item.total);
  
  console.log("[forecast] SimpleLinearRegression import =", SimpleLinearRegression);
  console.log("[forecast] Regression inputs x =", x, "y =", y);

  if (series.length < 2) {
    return {
      regressionPrediction: 0,
      slope: 0,
      intercept: 0,
      enoughData: false,
    };
  }

  const allSame = y.every((value) => value === y[0]);

  if (allSame) {
    console.log("[forecast] Flat spending detected.");
    return {
      regressionPrediction: round2(y[0]),
      slope: 0,
      intercept: y[0],
      enoughData: true,
    };
  }

  const regression = new SimpleLinearRegression(x, y);
  const nextMonthIndex = x[x.length - 1] + 1;

  let prediction = regression.predict(nextMonthIndex);

  // Guard against negative prediction
  if (prediction < 0) {
    console.log("[forecast] Negative prediction detected. Clamping to 0.");
    prediction = 0;
  }

  return {
    regressionPrediction: round2(prediction),
    slope: round2(regression.slope),
    intercept: round2(regression.intercept),
    enoughData: true,
  };
}

/**
 * Gets current month spend per category
 */
function buildCurrentMonthSpendMap(expenses, now = new Date(), categoryLabelMap = {}) {
  const currentMonthKey = getMonthKey(now);
  const spendMap = {};

  for (const expense of expenses) {
    const expenseDate = new Date(expense.date);
    const expenseMonthKey = getMonthKey(expenseDate);

    if (expenseMonthKey !== currentMonthKey) continue;

    const category = normalizeCategoryName(expense.category);
    if (!category) continue;

    if (!categoryLabelMap[category]) {
      categoryLabelMap[category] = String(expense.category || "").trim() || category;
    }

    spendMap[category] = round2((spendMap[category] || 0) + Number(expense.amount));
  }

  console.log("[forecast] currentMonthSpendMap =", spendMap);
  return spendMap;
}

/**
 * Scale projected category totals so the total does not exceed gross salary.
 */
function applyGrossSalaryUpperBound(categoryForecasts, grossSalary) {
  const totalProjection = Object.values(categoryForecasts).reduce(
    (sum, item) => sum + item.finalForecast,
    0
  );

  console.log("[forecast] totalProjection before salary clamp =", totalProjection);
  console.log("[forecast] grossSalary upper bound =", grossSalary);

  if (!grossSalary || totalProjection <= grossSalary) {
    return categoryForecasts;
  }

  const scaleFactor = grossSalary / totalProjection;

  console.log("[forecast] Applying salary clamp with scaleFactor =", scaleFactor);

  const scaled = {};

  for (const [category, item] of Object.entries(categoryForecasts)) {
    scaled[category] = {
      ...item,
      finalForecast: round2(item.finalForecast * scaleFactor),
      salaryClamped: true,
    };
  }

  return scaled;
}

/**
 * Build user-facing warnings from category forecasts
 */
function buildWarnings({
  categoryForecasts,
  categoryBudgetMap,
  categoryLabelMap,
  dismissedWarningIds,
  currentMonthKey,
}) {
  const warnings = [];

  for (const [category, item] of Object.entries(categoryForecasts)) {
    const displayCategory = categoryLabelMap[category] || item.category || category;
    const budget = categoryBudgetMap[category] || 0;

    if (!budget || budget <= 0) continue;

    const overspendThreshold = budget * 1.15;
    const finalForecast = item.finalForecast;

    if (finalForecast > overspendThreshold) {
      const overspendAmount = round2(finalForecast - budget);
      const warningId = `overspend:${category}:${currentMonthKey}`;

      if (dismissedWarningIds.includes(warningId)) {
        console.log(`[forecast] Skipping dismissed warning ${warningId}`);
        continue;
      }

      warnings.push({
        id: warningId,
        type: "overspend",
        category: displayCategory,
        budget: round2(budget),
        projectedSpend: round2(finalForecast),
        overspendAmount,
        message: `You're on track to overspend on ${displayCategory} by £${overspendAmount.toFixed(
          2
        )} this month based on your recent activity.`,
      });
    }
  }

  console.log("[forecast] warnings =", warnings);
  return warnings;
}

/**
 * Main entry point
 */
async function computeForecastForUser(userId) {
  console.log("[forecast] -------------------------------------------");
  console.log("[forecast] computeForecastForUser called for userId =", userId);

  const now = new Date();
  const currentMonthKey = getMonthKey(now);
  const currentMonthIndex = getMonthIndex(now);
  const daysElapsed = now.getDate();
  const totalDaysInMonth = getDaysInMonth(now.getFullYear(), now.getMonth());

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("Forecast failed: user not found");
  }

  await ensureForecastMonthState(user);

  const monthlyBudget = await MonthlyBudget.findOne({ userId }).sort({createdAt: -1});
  if (!monthlyBudget) {
    console.log("[forecast] No MonthlyBudget found. Returning inactive forecast.");
    return {
      forecastingActive: false,
      reason: "NO_BUDGET_FOUND",
      projections: {},
      warnings: [],
    };
  }

  const allExpenses = await Expense.find({ userId }).sort({ date: 1 });

  console.log("[forecast] Total expenses found =", allExpenses.length);

  const { categoryBudgetMap, categoryLabelMap } = buildCategoryBudgetMap(monthlyBudget);
  const historicalSeries = buildHistoricalCategorySeries(allExpenses, categoryLabelMap);
  const currentMonthSpendMap = buildCurrentMonthSpendMap(allExpenses, now, categoryLabelMap);

  // Only count months BEFORE the current month as history
  const historicalMonthKeys = new Set();

  for (const expense of allExpenses) {
    const expenseDate = new Date(expense.date);
    const expenseMonthIndex = getMonthIndex(expenseDate);

    if (expenseMonthIndex < currentMonthIndex) {
      historicalMonthKeys.add(getMonthKey(expenseDate));
    }
  }

  const monthsOfHistory = historicalMonthKeys.size;

  console.log("[forecast] monthsOfHistory =", monthsOfHistory);

  if (monthsOfHistory < 2) {
    console.log("[forecast] Not enough history. Forecast inactive.");
    return {
      forecastingActive: false,
      reason: "INSUFFICIENT_HISTORY",
      monthsOfHistory,
      projections: {},
      warnings: [],
    };
  }

  const categoryForecasts = {};

  const categoriesToEvaluate = new Set([
    ...Object.keys(categoryBudgetMap),
    ...Object.keys(historicalSeries),
    ...Object.keys(currentMonthSpendMap),
  ]);

  for (const category of categoriesToEvaluate) {
    const categorySeriesFull = historicalSeries[category] || [];

    // Only regression on completed previous months, not current month
    const categorySeriesHistoryOnly = categorySeriesFull.filter(
      (item) => item.monthIndex < currentMonthIndex
    );

    if (categorySeriesHistoryOnly.length < 2) {
      console.log(`[forecast] Skipping category ${category} because it has < 2 months of history.`);
      continue;
    }

    const regressionOutput = runCategoryRegression(categorySeriesHistoryOnly);

    const currentSpend = currentMonthSpendMap[category] || 0;
    const currentTrendMean =
      daysElapsed > 0
        ? round2((currentSpend / daysElapsed) * totalDaysInMonth)
        : 0;

    // Blend long-term + short-term
    let finalForecast =
      0.6 * regressionOutput.regressionPrediction + 0.4 * currentTrendMean;

    if (finalForecast < 0) finalForecast = 0;

    categoryForecasts[category] = {
      category: categoryLabelMap[category] || category,
      currentSpend: round2(currentSpend),
      currentTrendMean: round2(currentTrendMean),
      regressionPrediction: round2(regressionOutput.regressionPrediction),
      slope: regressionOutput.slope,
      intercept: regressionOutput.intercept,
      finalForecast: round2(finalForecast),
      budget: round2(categoryBudgetMap[category] || 0),
      salaryClamped: false,
    };

    console.log(`[forecast] category=${category}`, categoryForecasts[category]);
  }

  const grossSalary = Number(monthlyBudget.grossSalary || 0);
  const clampedForecasts = applyGrossSalaryUpperBound(categoryForecasts, grossSalary);

  const warnings = buildWarnings({
    categoryForecasts: clampedForecasts,
    categoryBudgetMap,
    categoryLabelMap,
    dismissedWarningIds: user.forecastWarningState?.dismissedWarningIds || [],
    currentMonthKey,
  });

  const totalProjectedSpend = round2(
    Object.values(clampedForecasts).reduce((sum, item) => sum + item.finalForecast, 0)
  );

  const response = {
    forecastingActive: true,
    reason: null,
    monthKey: currentMonthKey,
    monthsOfHistory,
    projections: clampedForecasts,
    totals: {
      totalProjectedSpend,
      grossSalaryUpperBound: round2(grossSalary),
    },
    warnings,
  };

  console.log("[forecast] Final forecast response =", JSON.stringify(response, null, 2));
  console.log("[forecast] -------------------------------------------");

  return response;
}

module.exports = {
  computeForecastForUser,
};