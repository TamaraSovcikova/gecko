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
const calculatePayslip = require('../services/hmrcCalculator');

// POST /api/v1/payslip
exports.createPayslip = async (req, res) => {
  try {
    const grossSalary = Number(req.body.grossSalary);
    const categories = Array.isArray(req.body.categories) ? req.body.categories : [];
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
      categories: categories.map((category) => ({
        name: String(category?.name || "").trim(),
        budget: Number(category?.budget ?? category?.amount ?? 0),
      })),
    });

    await User.findByIdAndUpdate(userId, {
      "payslipData.grossSalary": grossSalary,
      hasCompletedOnboarding: true,
    });

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
        const budget = await MonthlyBudget.findOne({ userId });
  
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
    const categories = Array.isArray(req.body.categories) ? req.body.categories : [];
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: "User ID missing from token" });
    }

    if (!Number.isFinite(grossSalary) || grossSalary <= 0) {
      return res.status(400).json({ error: "Gross salary must be a positive number" });
    }

    const result = calculatePayslip(grossSalary);

    const budget = await MonthlyBudget.findOneAndUpdate(
      { userId },
      {
        grossSalary,
        taxPaid: result.taxPaid,
        niPaid: result.niPaid,
        takeHomePay: result.takeHomePay,
        categories: categories.map((category) => ({
          name: String(category?.name || "").trim(),
          budget: Number(category?.budget ?? category?.amount ?? 0),
        })),
      },
      { new: true }
    );

    if (!budget) {
      return res.status(404).json({ error: "Payslip not found" });
    }

    await User.findByIdAndUpdate(userId, {
      "payslipData.grossSalary": grossSalary,
    });

    res.status(200).json(budget);
  } catch (error) {
    console.error("Update payslip error:", error);
    res.status(500).json({ error: error.message });
  }
};