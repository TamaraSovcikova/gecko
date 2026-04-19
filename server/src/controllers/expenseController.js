// After the user inputs an expense -> expenseController handles the data
// Specifically: 
// ------------
// - POST api/v1/expenses <- When the user submits their salary + categories


const Expense = require('../models/Expense');
const MonthlyBudget = require('../models/MonthlyBudget');
const { computeDashboard } = require('../services/dashboardAggregate');

const emitDashboardUpdate = async (req, userId) => {
  const dashboardData = await computeDashboard(userId);
  const io = req.app.get('io');
  io.to(userId).emit('budget:update', dashboardData);
};

const validateExpenseCategory = async (userId, category) => {
  const latestBudget = await MonthlyBudget.findOne({ userId }).sort({ createdAt: -1 });
  const normalizedInput = String(category || '').trim().toLowerCase();
  const validCategories = new Set(
    (latestBudget?.categories || [])
      .map((item) => String(item.name || '').trim().toLowerCase())
      .filter(Boolean)
  );

  if (validCategories.size > 0 && !validCategories.has(normalizedInput)) {
    return 'Expense category must match one of your current budget categories';
  }

  return null;
};

exports.listExpenses = async (req, res) => {
  try {
    const userId = req.user?.uid;
    const expenses = await Expense.find({ userId }).sort({ date: -1, createdAt: -1 });

    res.json({ expenses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load expenses' });
  }
};

// POST api/v1/expenses
exports.createExpense = async (req, res) => {
  try {
    const userId = req.user?.uid;
    const { category, amount, date, note } = req.body;
    const normalizedCategory = String(category || '').trim();

    // Throwing an error for integral missing fields
    if (!normalizedCategory || !amount || !date) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const categoryError = await validateExpenseCategory(userId, normalizedCategory);
    if (categoryError) {
      return res.status(400).json({ error: categoryError });
    }

    const expenseDate = new Date(date);
    const month = expenseDate.getMonth() + 1; // JS is 0-indexed
    const year = expenseDate.getFullYear();

    // 1. Save expense
    const expense = await Expense.create({
      userId,
      category: normalizedCategory,
      amount,
      date: expenseDate,
      note,
      month,
      year
    });

    // 2. Recompute dashboard -> Shared logic from the dashboard
    await emitDashboardUpdate(req, userId);

    // 4. Respond
    res.status(201).json({
      success: true,
      expense
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create expense' });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const userId = req.user?.uid;
    const expenseId = req.params.expenseId;
    const { category, amount, date, note } = req.body;
    const normalizedCategory = String(category || '').trim();

    if (!normalizedCategory || !amount || !date) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const categoryError = await validateExpenseCategory(userId, normalizedCategory);
    if (categoryError) {
      return res.status(400).json({ error: categoryError });
    }

    const expenseDate = new Date(date);
    const month = expenseDate.getMonth() + 1;
    const year = expenseDate.getFullYear();

    const expense = await Expense.findOneAndUpdate(
      { _id: expenseId, userId },
      {
        category: normalizedCategory,
        amount,
        date: expenseDate,
        note,
        month,
        year,
      },
      { new: true }
    );

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await emitDashboardUpdate(req, userId);

    res.json({ success: true, expense });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update expense' });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const userId = req.user?.uid;
    const expenseId = req.params.expenseId;
    const expense = await Expense.findOneAndDelete({ _id: expenseId, userId });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await emitDashboardUpdate(req, userId);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
};