// This function is needed to perform the dashboard aggregate calculation 
/*
async function computeDashboard(userId) {
    // 1. Get payslip (budget)
    // 2. Get current month expenses
    // 3. Aggregate totals per category
    // 4. Calculate:
    //    - total spent
    //    - budget left
    //    - health score
    // 5. Return structured object
  }
*/

const Expense = require('../models/Expense');
const MonthlyBudget = require('../models/MonthlyBudget'); // adjust name if needed

async function computeDashboard(userId) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // 1. Get budget
  const budget = await MonthlyBudget.findOne({ userId });

  // 2. Get expenses for current month
  const expenses = await Expense.find({ userId, month, year });

  // 3. Total spent
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  // 4. Budget total
  const totalBudget = budget?.takeHomePay || 0;

  // 5. Budget left
  const budgetLeft = totalBudget - totalSpent;

  // 6. Health score 
  const healthScore = totalBudget > 0
    ? Math.max(0, Math.round((budgetLeft / totalBudget) * 100))
    : 100;

  return {
    healthScore,
    budgetLeft,
    totalSpent,
    expenses
  };
}

module.exports = { computeDashboard };
