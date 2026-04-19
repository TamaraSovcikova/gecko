// Responsible for handling payslip related API requests 
// Specifically: 
// ------------
// - POST /api/v1/payslip <- When the user submits their salary + categories
// - GET  /api/v1/payslip <- Retrieving the submitted user data
// ___________________________________________________________________________________
//
// User Interaction Flow: 
// ---------------------
// 1. Recieve data from the frontend (on user salary + categories)
// 2. Verifies the user's auth
// 3. Runs HMRC calculations
// 4. Stores the result in the DB
// 5. Updates the User models fields (payslip data + completed onboarding)
// 6. Sends the calculated financial breakdown to the frontend

const MonthlyBudget = require('../models/MonthlyBudget');
const User = require('../models/User');
const Expense = require('../models/Expense');
const calculatePayslip = require('../services/hmrcCalculator');
const { computeDashboard } = require('../services/dashboardAggregate');

const normalizeCategoryName = (name) => String(name || "").trim();

const sanitizeCategories = (categories) => {
  const normalized = categories.map((category) => ({
    name: normalizeCategoryName(category?.name),
    budget: Number(category?.budget ?? category?.amount ?? 0),
  }));

  if (normalized.some((category) => !category.name)) {
    throw new Error("Each category requires a name");
  }

  if (normalized.some((category) => !Number.isFinite(category.budget) || category.budget < 0)) {
    throw new Error("Each category budget must be 0 or more");
  }

  const dedupedNames = new Set(normalized.map((category) => category.name.toLowerCase()));
  if (dedupedNames.size !== normalized.length) {
    throw new Error("Category names must be unique");
  }

  return normalized;
};

const reconcileCurrentMonthExpenses = async (userId, previousCategories, nextCategories) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const activeCategoryNames = new Set(nextCategories.map((category) => category.name));

  for (let index = 0; index < Math.min(previousCategories.length, nextCategories.length); index += 1) {
    const previousName = normalizeCategoryName(previousCategories[index]?.name);
    const nextName = normalizeCategoryName(nextCategories[index]?.name);

    if (previousName && nextName && previousName !== nextName) {
      await Expense.updateMany(
        { userId, month, year, category: previousName },
        { $set: { category: nextName } }
      );
    }
  }

  const previousNames = previousCategories.map((category) => normalizeCategoryName(category?.name)).filter(Boolean);
  const namesToArchive = previousNames.filter((name) => !activeCategoryNames.has(name));

  if (namesToArchive.length > 0) {
    await Expense.updateMany(
      { userId, month, year, category: { $in: namesToArchive } },
      { $set: { category: "Uncategorised" } }
    );
  }
};

// POST /api/v1/payslip
exports.createPayslip = async (req, res) => {
  try {
    const grossSalary = Number(req.body.grossSalary);
    const categories = sanitizeCategories(Array.isArray(req.body.categories) ? req.body.categories : []);
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: "User ID missing from token" });
    }

    if (!Number.isFinite(grossSalary) || grossSalary <= 0) {
      return res.status(400).json({ error: "Gross salary must be a positive number" });
    }

    const result = calculatePayslip(grossSalary);

    const budget = await MonthlyBudget.create({
      userId,
      grossSalary,
      taxPaid: result.taxPaid,
      niPaid: result.niPaid,
      takeHomePay: result.takeHomePay,
      categories,
    });

    await User.findByIdAndUpdate(userId, {
      "payslipData.grossSalary": grossSalary,
      hasCompletedOnboarding: true,
    });

    const dashboardData = await computeDashboard(userId);
    const io = req.app.get("io");
    io?.to(userId).emit("budget:update", dashboardData);

    res.status(201).json(budget);
  } catch (error) {
    console.error("Create payslip error:", error);
    res.status(500).json({ error: error.message });
  }
};
  

// GET /api/v1/payslip
exports.getPayslip = async (req, res) => {

    try {
        const userId = req.user.uid;
    const budget = await MonthlyBudget.findOne({ userId }).sort({ createdAt: -1 });
  
        if (!budget) {
            return res.status(404).json({ message: "No payslip found" });
        }
  
        res.json(budget);
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

// PUT /api/v1/payslip
exports.updatePayslip = async (req, res) => {
  try {
    const grossSalary = Number(req.body.grossSalary);
    const categories = sanitizeCategories(Array.isArray(req.body.categories) ? req.body.categories : []);
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: "User ID missing from token" });
    }

    if (!Number.isFinite(grossSalary) || grossSalary <= 0) {
      return res.status(400).json({ error: "Gross salary must be a positive number" });
    }

    const result = calculatePayslip(grossSalary);

    const existingBudget = await MonthlyBudget.findOne({ userId }).sort({ createdAt: -1 });

    if (!existingBudget) {
      return res.status(404).json({ error: "Payslip not found" });
    }

    await reconcileCurrentMonthExpenses(userId, existingBudget.categories || [], categories);

    const budget = await MonthlyBudget.findByIdAndUpdate(
      existingBudget._id,
      {
        grossSalary,
        taxPaid: result.taxPaid,
        niPaid: result.niPaid,
        takeHomePay: result.takeHomePay,
        categories,
      },
      { new: true }
    );

    await User.findByIdAndUpdate(userId, {
      "payslipData.grossSalary": grossSalary,
    });

    const dashboardData = await computeDashboard(userId);
    const io = req.app.get("io");
    io?.to(userId).emit("budget:update", dashboardData);

    res.status(200).json(budget);
  } catch (error) {
    console.error("Update payslip error:", error);
    res.status(500).json({ error: error.message });
  }
};