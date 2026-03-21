// After the user inputs an expense -> expenseController handles the data
// Specifically: 
// ------------
// - POST api/v1/expenses <- When the user submits their salary + categories


const Expense = require('../models/Expense');
const { computeDashboard } = require('../services/dashboardAggregate');

// POST api/v1/expenses
exports.createExpense = async (req, res) => {
  try {
    const userId = req.user?.uid;
    const { category, amount, date, note } = req.body;
    const expenseDate = new Date(date);
    const month = expenseDate.getMonth() + 1; // JS is 0-indexed
    const year = expenseDate.getFullYear();

    // 1. Save expense
    const expense = await Expense.create({
      userId,
      category,
      amount,
      date: expenseDate,
      note,
      month,
      year
    });

    // 2. Recompute dashboard -> Shared logic from the dashboard
    const dashboardData = await computeDashboard(userId);

    // 3. Emit real-time update
    // Because socket.io lives in your server file, this gives the controller access
    const io = req.app.get('io'); 
    io.to(userId).emit('budget:update', dashboardData);

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