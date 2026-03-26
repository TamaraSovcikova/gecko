// controllers/userController.js - User management and data export

const User = require("../models/User");
const Expense = require("../models/Expense");
const MonthlyBudget = require("../models/MonthlyBudget");
const PDFDocument = require("pdfkit");
const { searchJobTitles, searchLocations } = require("../services/adzunaCalculator");

// GET /api/v1/user/profile
// Returns the current user's profile information
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.uid;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/v1/user/export-data
// Exports all user data as a PDF
const exportUserData = async (req, res) => {
  try {
    const userId = req.user.uid;

    // Fetch all user data
    const user = await User.findById(userId);
    const expenses = await Expense.find({ userId });
    const budgets = await MonthlyBudget.find({ userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=my-data.pdf");

    doc.pipe(res);

    // Title
    doc.fontSize(20).font("Helvetica-Bold").text("My Data Export", { align: "center" });
    doc.moveDown();

    // Export date
    doc.fontSize(10).font("Helvetica").text(`Export Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    // User Information
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("User Information");
    doc.fontSize(11).font("Helvetica");
    doc.text(`Name: ${user.displayName}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Member Since: ${new Date(user.createdAt).toLocaleDateString()}`);
    doc.text(`Total XP: ${user.xpTotal}`);
    doc.moveDown();

    // Payslip Data - Complete breakdown
    if (user.payslipData && user.payslipData.grossSalary > 0) {
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Payslip Information");
      doc.fontSize(11).font("Helvetica");
      doc.text(`Gross Salary: £${user.payslipData.grossSalary.toFixed(2)}`);
      
      if (user.payslipData.jobTitle) {
        doc.text(`Job Title: ${user.payslipData.jobTitle}`);
      }
      if (user.payslipData.location) {
        doc.text(`Location: ${user.payslipData.location}`);
      }
      doc.moveDown();
    }

    // Budget Breakdown - Most recent payslip
    if (budgets.length > 0) {
      const latestBudget = budgets[budgets.length - 1];
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Latest Budget Breakdown");
      doc.fontSize(11).font("Helvetica");
      doc.text(`Gross Salary: £${(latestBudget.grossSalary || 0).toFixed(2)}`);
      doc.text(`Tax Paid: £${(latestBudget.taxPaid || 0).toFixed(2)}`);
      doc.text(`National Insurance: £${(latestBudget.niPaid || 0).toFixed(2)}`);
      doc.text(`Take-Home Pay: £${(latestBudget.takeHomePay || 0).toFixed(2)}`);
      doc.moveDown();

      // Category Allocations
      if (latestBudget.categories && latestBudget.categories.length > 0) {
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .text("Category Allocations");
        doc.fontSize(11).font("Helvetica");
        latestBudget.categories.forEach((category) => {
          doc.text(`  ${category.name}: £${(category.budget || 0).toFixed(2)}`);
        });
        doc.moveDown();
      }

      // All budgets history
      if (budgets.length > 1) {
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Budget History");
        doc.fontSize(10).font("Helvetica");
        budgets.forEach((budget, index) => {
          doc.text(`\nBudget ${index + 1}:`);
          doc.text(`  Created: ${new Date(budget.createdAt).toLocaleDateString()}`);
          doc.text(`  Gross: £${(budget.grossSalary || 0).toFixed(2)}`);
          doc.text(`  Tax: £${(budget.taxPaid || 0).toFixed(2)}`);
          doc.text(`  NI: £${(budget.niPaid || 0).toFixed(2)}`);
          doc.text(`  Take-Home: £${(budget.takeHomePay || 0).toFixed(2)}`);
          if (budget.categories && budget.categories.length > 0) {
            doc.text(`  Categories: ${budget.categories.map(c => `${c.name} (£${(c.budget || 0).toFixed(2)})`).join(", ")}`);
          }
        });
        doc.moveDown();
      }
    }

    // Expenses - Detailed list with all information
    if (expenses.length > 0) {
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("All Expenses");
      doc.fontSize(10).font("Helvetica");

      expenses.forEach((expense, index) => {
        doc.text(`${index + 1}. ${expense.category.toUpperCase()} - £${(expense.amount || 0).toFixed(2)}`);
        doc.text(`   Date: ${new Date(expense.date).toLocaleDateString()}`);
        doc.text(`   Month: ${expense.month}/${expense.year}`);
        if (expense.note) {
          doc.text(`   Note: ${expense.note}`);
        }
      });
      doc.moveDown();

      // Expense Summary by Category
      const expenseSummary = {};
      expenses.forEach((expense) => {
        if (!expenseSummary[expense.category]) {
          expenseSummary[expense.category] = 0;
        }
        expenseSummary[expense.category] += expense.amount || 0;
      });

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Expense Summary by Category");
      doc.fontSize(10).font("Helvetica");
      Object.entries(expenseSummary).forEach(([category, total]) => {
        doc.text(`  ${category}: £${total.toFixed(2)}`);
      });
      const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      doc.font("Helvetica-Bold").text(`  TOTAL: £${totalExpenses.toFixed(2)}`);
      doc.moveDown();
    }

    // Footer
    doc.fontSize(9).font("Helvetica").text("This is your personal data export from Zoar.", {
      align: "center",
    });

    doc.end();
  } catch (err) {
    console.error("Error exporting data:", err);
    res.status(500).json({ error: "Failed to export data" });
  }
};

// DELETE /api/v1/user/profile
// Deletes the user account and all associated data
const deleteUserProfile = async (req, res) => {
  try {
    const userId = req.user.uid;

    // Delete all associated data
    await Expense.deleteMany({ userId });
    await MonthlyBudget.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    res.json({ message: "Profile deleted successfully" });
  } catch (err) {
    console.error("Error deleting profile:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// PATCH /api/v1/user/profile
// Updates user profile fields (e.g., payslipData)
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { payslipData } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        ...(payslipData && {
          "payslipData.jobTitle": payslipData.jobTitle,
          "payslipData.location": payslipData.location,
          "payslipData.grossSalary": payslipData.grossSalary,
        }),
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/v1/user/job-search
// Searches for job titles from Adzuna
const getJobTitleOptions = async (req, res) => {
  try {
    const { query } = req.query;
    const jobs = await searchJobTitles(query || "");
    res.json({ jobs });
  } catch (err) {
    console.error("Error searching job titles:", err);
    res.status(500).json({ error: "Failed to search job titles" });
  }
};

// GET /api/v1/user/location-search
// Searches for locations from Adzuna
const getLocationOptions = async (req, res) => {
  try {
    const { query } = req.query;
    const locations = await searchLocations(query || "");
    res.json({ locations });
  } catch (err) {
    console.error("Error searching locations:", err);
    res.status(500).json({ error: "Failed to search locations" });
  }
};

module.exports = {
  getUserProfile,
  exportUserData,
  deleteUserProfile,
  updateUserProfile,
  getJobTitleOptions,
  getLocationOptions,
};
