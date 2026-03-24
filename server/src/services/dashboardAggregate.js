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

const Expense = require('../models/Expense');
const MonthlyBudget = require('../models/MonthlyBudget');

async function computeDashboard(userId) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // 1. Get payslip (same as dashboard route)
  const payslip = await MonthlyBudget.findOne({ userId }).sort({ createdAt: -1 });

  const takeHome = payslip?.takeHomePay || 0;

  const budgetAllocation = (payslip?.categories || []).map(category => ({
    name: category.name,
    value: category.budget 
  }));

  const totalBudget = (payslip?.categories || []).reduce(
    (sum, category) => sum + category.budget,
    0
  );

  // 2. Aggregate expenses
  const categoryTotals = await Expense.aggregate([
    {
      $match: {
        userId: userId,   // matching the schema field name
        month,
        year
      }
    },
    {
      $group: {
        _id: "$category",
        total: { $sum: "$amount" }
      }
    }
  ]);

  const actualSpending = categoryTotals.map(item => ({
    name: item._id,
    value: item.total
  }));

  const totalExpenses = categoryTotals.reduce(
    (sum, e) => sum + e.total,
    0
  );

  // 3. Health score (same logic)
  let healthScore = 100;

  if (totalBudget > 0) {
    const score = (1 - totalExpenses / totalBudget) * 100;
    healthScore = Math.round(Math.min(100, Math.max(0, score)));
  }

  const budgetLeft = totalBudget - totalExpenses;

  console.log("TOTAL EXPENSES:", totalExpenses);
  console.log("TOTAL BUDGET:", totalBudget);

  // Return Structure 
  return {
    healthScore,
    takeHome,
    budgetLeft,
    totalBudget,
    actualSpending,
    budgetAllocation
  };
}

module.exports = { computeDashboard };