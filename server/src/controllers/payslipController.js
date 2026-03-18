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
    console.log("DEBUG AUTH:", req.user)
  
    const grossSalary = req.body.grossSalary
    const categories = req.body.categories
    const userId = req.user.uid;
    
    if (!userId) {
      return res.status(401).json({ error: "User ID missing from token" });
    }
    if (!grossSalary) {
        return res.status(400).json({ error: "Gross Salary required" });
    }
  
    const result = calculatePayslip(grossSalary);
  
    const budget = await MonthlyBudget.create({
        userId,
        grossSalary,
        taxPaid: result.taxPaid,
        niPaid: result.niPaid,
        takeHomePay: result.takeHomePay,
        categories
    });

    // Updating the User model fields
    
    await User.findByIdAndUpdate(userId, {
        "payslipData.grossSalary": grossSalary,
        hasCompletedOnboarding: true
    });
    
  
    res.status(201).json(budget);
  
    } catch (error) {
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