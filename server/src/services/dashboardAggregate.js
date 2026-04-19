// This function is needed to perform the dashboard aggregate calculation 
/*
async function computeDashboard(userId) {
    // 1. Get payslip (budget)
    // 2. Get current month expenses
    // 3. Aggregate totals per category
    // 4. Calculate:
    //    - health score
    //    - take home
    //    - budget left
    //    - total budget
    //    - actual spending
    //    - budget allocation
    // 5. Return structured object
  }
*/

// services/computeDashboard.js
// UPDATE:
// Take in month and year as arguments
// Logic can be re-used by cron job "../jobs/monthlySnapshot.js"

const Expense = require("../models/Expense");
const MonthlyBudget = require("../models/MonthlyBudget");
const User = require("../models/User");
const { getAverageSalary } = require("../services/adzunaCalculator");
const { computeHealthScoreBreakdown } = require("../services/healthScoreService");

async function computeDashboard(userId, month = null, year = null) {
  // Default to current month/year if not provided
  const now = new Date();
  month = month || now.getMonth() + 1;
  year = year || now.getFullYear();

  // Fetch latest monthly budget for the user
  const budget = await MonthlyBudget.findOne({ userId }).sort({ createdAt: -1 });
  const takeHome = budget?.takeHomePay || 0;
  const budgetAllocation = (budget?.categories || []).map(cat => ({
    name: cat.name,
    value: cat.budget,
  }));
  const totalBudget = budgetAllocation.reduce((sum, cat) => sum + cat.value, 0);

  // Fetch actual expenses for the specified month/year
  const categoryTotals = await Expense.aggregate([
    { $match: { userId, month, year } },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
  ]);

  const actualSpending = categoryTotals.map(item => ({
    name: item._id,
    value: item.total,
  }));

  const totalExpenses = categoryTotals.reduce((sum, e) => sum + e.total, 0);

  // Compute health score
  const healthBreakdown = computeHealthScoreBreakdown({
    takeHome,
    totalBudget,
    totalExpenses,
    budgetAllocation,
    actualSpending,
  });
  const healthScore = healthBreakdown.healthScore;

  const budgetLeft = totalBudget - totalExpenses;

  // Fetch user info for Adzuna
  const currentUser = await User.findById(userId);
  let averageSalary = null;
  let grossSalary = budget?.grossSalary || 0;

  if (currentUser?.payslipData?.jobTitle && currentUser?.payslipData?.location) {
    try {
      averageSalary = await getAverageSalary(
        currentUser.payslipData.jobTitle,
        currentUser.payslipData.location
      );
    } catch (err) {
      console.error(`Error fetching average salary for user ${userId}:`, err);
    }
  }

  return {
    healthScore,
    takeHome,
    budgetLeft,
    totalBudget,
    actualSpending,
    budgetAllocation,
    healthBreakdown,
    averageSalary,
    grossSalary,
  };
}

module.exports = { computeDashboard };