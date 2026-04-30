// After the user inputs an expense -> expenseController handles the data
// Specifically:
// ------------
// - POST /api/v1/expenses
// - PATCH /api/v1/expenses/:expenseId
// - DELETE /api/v1/expenses/:expenseId
// - GET /api/v1/expenses

const Expense = require('../models/Expense');
const MonthlyBudget = require('../models/MonthlyBudget');
const extractTotalFromText = require('../utils/extractTotal');
const { computeDashboard } = require('../services/dashboardAggregate');
const { scanReceipt: runOcrScan } = require('../services/ocrService');
const { computeForecastForUser } = require('../services/forecastService');

/**
 * Emit a combined dashboard + forecast update to the user's socket room.
 * This keeps the dashboard and warning popup in sync from one backend event.
 */
const emitDashboardUpdate = async (req, userId) => {
  try {
    console.log('[expenseController] emitDashboardUpdate called for userId =', userId);

    const dashboardData = await computeDashboard(userId);
    console.log('[expenseController] Dashboard recomputed inside emitDashboardUpdate');

    const forecastData = await computeForecastForUser(userId);
    console.log('[expenseController] Forecast recomputed inside emitDashboardUpdate');

    const io = req.app.get('io');

    // Guard in case backend socket setup is missing or not attached yet
    if (!io) {
      console.log('[expenseController] No Socket.io instance found on req.app. Skipping emit.');
      return { dashboardData, forecastData };
    }

    const payload = {
      dashboard: dashboardData,
      forecast: forecastData,
    };

    console.log('[expenseController] Emitting budget:update with payload =', JSON.stringify(payload, null, 2));

    io.to(String(userId)).emit('budget:update', payload);

    return { dashboardData, forecastData };
  } catch (err) {
    console.error('[expenseController] emitDashboardUpdate failed:', err);
    throw err;
  }
};

/**
 * Validate that the entered expense category exists in the latest saved budget categories.
 */
const validateExpenseCategory = async (userId, category) => {
  const latestBudget = await MonthlyBudget.findOne({ userId }).sort({ createdAt: -1 });

  const normalizedInput = String(category || '').trim().toLowerCase();

  const validCategories = new Set(
    (latestBudget?.categories || [])
      .map((item) => String(item.name || '').trim().toLowerCase())
      .filter(Boolean)
  );

  console.log('[expenseController] validateExpenseCategory validCategories =', [...validCategories]);
  console.log('[expenseController] validateExpenseCategory normalizedInput =', normalizedInput);

  if (validCategories.size > 0 && !validCategories.has(normalizedInput)) {
    return 'Expense category must match one of your current budget categories';
  }

  return null;
};

exports.listExpenses = async (req, res) => {
  try {
    const userId = req.user?.uid;

    console.log('[expenseController] listExpenses called for userId =', userId);

    const expenses = await Expense.find({ userId }).sort({ date: -1, createdAt: -1 });

    console.log('[expenseController] listExpenses found', expenses.length, 'expenses');

    res.json({ success: true, expenses });
  } catch (err) {
    console.error('[expenseController] listExpenses failed:', err);
    res.status(500).json({ success: false, error: 'Failed to load expenses' });
  }
};

// POST /api/v1/expenses
exports.createExpense = async (req, res) => {
  try {
    const userId = req.user?.uid;
    const { category, amount, date, note, newCategoryName, newCategoryBudget } = req.body;

    const normalizedCategory = String(category || '').trim();
    const parsedAmount = Number(amount);

    console.log('[expenseController] createExpense called');
    console.log('[expenseController] Authenticated userId =', userId);
    console.log('[expenseController] Request body =', req.body);

    // Validate required fields
    if (!normalizedCategory || !date || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      console.log('[expenseController] Missing or invalid required fields');

      return res.status(400).json({
        success: false,
        error: 'Valid category, amount, and date are required',
      });
    }

    // Handle new category creation if present
    if (newCategoryName) {
      const normalizedNewName = String(newCategoryName).trim();

      console.log('[expenseController] New category flow triggered:', normalizedNewName);

      if (!normalizedNewName) {
        return res.status(400).json({
          success: false,
          error: 'New category name is required',
        });
      }

      const latestBudget = await MonthlyBudget.findOne({ userId }).sort({ createdAt: -1 });

      if (!latestBudget) {
        return res.status(400).json({
          success: false,
          error: 'No monthly budget found for this user',
        });
      }

      const existingNames = new Set(
        (latestBudget.categories || []).map((cat) => String(cat.name || '').trim().toLowerCase())
      );

      if (existingNames.has(normalizedNewName.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: 'Category name already exists',
        });
      }

      latestBudget.categories.push({
        name: normalizedNewName,
        budget: Number(newCategoryBudget) || 0,
      });

      await latestBudget.save();
      console.log('[expenseController] New category added to latest budget');
    }

    const categoryError = await validateExpenseCategory(userId, normalizedCategory);

    if (categoryError) {
      console.log('[expenseController] Category validation failed:', categoryError);
      return res.status(400).json({ success: false, error: categoryError });
    }

    const expenseDate = new Date(date);

    if (Number.isNaN(expenseDate.getTime())) {
      console.log('[expenseController] Invalid expense date');
      return res.status(400).json({
        success: false,
        error: 'Invalid expense date',
      });
    }

    const month = expenseDate.getMonth() + 1;
    const year = expenseDate.getFullYear();

    console.log('[expenseController] Parsed expense month/year =', { month, year });

    // Save expense
    const expense = await Expense.create({
      userId,
      category: normalizedCategory,
      amount: parsedAmount,
      date: expenseDate,
      note: note || '',
      month,
      year,
    });

    console.log('[expenseController] Expense created successfully with ID =', expense._id);

    // Recompute dashboard + forecast and emit one combined live update
    // const { dashboardData, forecastData } = await emitDashboardUpdate(req, userId);
    const dashboardData = await computeDashboard(userId);
    let forecastData = null;
    try {
      forecastData = await computeForecastForUser(userId);
      console.log('[expenseController] Forecast recomputed successfully');
    } catch (forecastError) {
      console.error('[expenseController] Forecast recompute failed:', forecastError);
    }
    // -----TEMPORARY ^ -----

    console.log('[expenseController] Returning expense + dashboard + forecast response');

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      expense,
      dashboard: dashboardData,
      forecast: forecastData,
    });
  } catch (err) {
    console.error('[expenseController] createExpense failed:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create expense',
      details: err.message,
    });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const userId = req.user?.uid;
    const expenseId = req.params.expenseId;
    const { category, amount, date, note } = req.body;

    const normalizedCategory = String(category || '').trim();
    const parsedAmount = Number(amount);

    console.log('[expenseController] updateExpense called');
    console.log('[expenseController] userId =', userId);
    console.log('[expenseController] expenseId =', expenseId);
    console.log('[expenseController] Request body =', req.body);

    if (!normalizedCategory || !date || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid category, amount, and date are required',
      });
    }

    const categoryError = await validateExpenseCategory(userId, normalizedCategory);
    if (categoryError) {
      return res.status(400).json({ success: false, error: categoryError });
    }

    const expenseDate = new Date(date);

    if (Number.isNaN(expenseDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid expense date',
      });
    }

    const month = expenseDate.getMonth() + 1;
    const year = expenseDate.getFullYear();

    const expense = await Expense.findOneAndUpdate(
      { _id: expenseId, userId },
      {
        category: normalizedCategory,
        amount: parsedAmount,
        date: expenseDate,
        note: note || '',
        month,
        year,
      },
      { new: true }
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found',
      });
    }

    console.log('[expenseController] Expense updated successfully');

    const { dashboardData, forecastData } = await emitDashboardUpdate(req, userId);

    res.json({
      success: true,
      message: 'Expense updated successfully',
      expense,
      dashboard: dashboardData,
      forecast: forecastData,
    });
  } catch (err) {
    console.error('[expenseController] updateExpense failed:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update expense',
      details: err.message,
    });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const userId = req.user?.uid;
    const expenseId = req.params.expenseId;

    console.log('[expenseController] deleteExpense called');
    console.log('[expenseController] userId =', userId);
    console.log('[expenseController] expenseId =', expenseId);

    const expense = await Expense.findOneAndDelete({ _id: expenseId, userId });

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found',
      });
    }

    console.log('[expenseController] Expense deleted successfully');

    const { dashboardData, forecastData } = await emitDashboardUpdate(req, userId);

    res.json({
      success: true,
      message: 'Expense deleted successfully',
      dashboard: dashboardData,
      forecast: forecastData,
    });
  } catch (err) {
    console.error('[expenseController] deleteExpense failed:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete expense',
      details: err.message,
    });
  }
};

// POST api/v1/expenses/scan
exports.scanReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded',
      });
    }

    const ocrResult = await runOcrScan(req.file.buffer);
    const parsedText = ocrResult?.ParsedResults?.[0]?.ParsedText || '';
    const amount = extractTotalFromText(parsedText);

    if (!amount) {
      return res.status(200).json({
        success: false,
        message: 'Could not detect total',
      });
    }

    return res.status(200).json({
      success: true,
      amount,
    });
  } catch (error) {
    console.error('Scan receipt error:', error);
    return res.status(500).json({
      success: false,
      message: 'Receipt scanning failed',
    });
  }
};