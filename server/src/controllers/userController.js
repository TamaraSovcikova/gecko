// controllers/userController.js - User management and data export

const User = require("../models/User");
const Expense = require("../models/Expense");
const MonthlyBudget = require("../models/MonthlyBudget");
const PDFDocument = require("pdfkit");
const admin = require("../config/firebase");
const { searchJobTitles, searchLocations } = require("../services/adzunaCalculator");
const {
  hashToken,
  createUnsubscribeToken,
  getPreviousMonthPeriod,
  sendMonthlyNewsletterToUser,
} = require("../services/newsletterService");

const buildAuditEntries = ({ displayNameChanged, auditEvent }) => {
  const entries = [];

  if (displayNameChanged) {
    entries.push({ action: "username_changed", changedAt: new Date() });
  }

  if (auditEvent) {
    entries.push({ action: auditEvent, changedAt: new Date() });
  }

  return entries;
};

const buildFallbackDisplayName = (decodedUser = {}) => {
  if (decodedUser.name) {
    return String(decodedUser.name).trim();
  }

  if (decodedUser.email) {
    return String(decodedUser.email).split("@")[0] || "User";
  }

  return "User";
};

// GET /api/v1/user/profile
// Returns the current user's profile information
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.uid;
    let user = await User.findById(userId);

    // Some Google-auth users may exist in Firebase before a Mongo user is created.
    if (!user) {
      user = await User.create({
        _id: userId,
        email: String(req.user.email || "").toLowerCase().trim() || "unknown@example.com",
        displayName: buildFallbackDisplayName(req.user),
      });
    }

    const [expenses, budgets] = await Promise.all([
      Expense.find({ userId }).sort({ date: -1, createdAt: -1 }),
      MonthlyBudget.find({ userId }).sort({ createdAt: -1 }),
    ]);

    res.json({
      ...user.toObject(),
      expenses,
      budgets,
      latestBudget: budgets[0] || null,
    });
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

    try {
      await admin.auth().deleteUser(userId);
    } catch (firebaseError) {
      console.error("Error deleting Firebase auth user:", firebaseError);
      return res.status(500).json({ error: "Failed to delete authentication account" });
    }

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
// Updates user profile fields (e.g., payslipData, username, metadata)
const updateUserProfile = async (req, res) => {
  try {
    const authenticatedUserId = req.user.uid;
    const requestedUserId = req.params.userId || authenticatedUserId;
    const { payslipData, displayName, auditEvent, onboarding, newsletterOptIn } = req.body;

    if (requestedUserId !== authenticatedUserId) {
      return res.status(403).json({ error: "You can only update your own profile" });
    }

    const user = await User.findById(authenticatedUserId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updateDoc = {};
    const trimmedDisplayName = typeof displayName === "string" ? displayName.trim() : "";

    if (typeof displayName === "string") {
      if (!trimmedDisplayName) {
        return res.status(400).json({ error: "Username cannot be empty" });
      }

      updateDoc.displayName = trimmedDisplayName;
    }

    if (payslipData) {
      if (Object.prototype.hasOwnProperty.call(payslipData, "jobTitle")) {
        updateDoc["payslipData.jobTitle"] = payslipData.jobTitle;
      }
      if (Object.prototype.hasOwnProperty.call(payslipData, "location")) {
        updateDoc["payslipData.location"] = payslipData.location;
      }
      if (Object.prototype.hasOwnProperty.call(payslipData, "grossSalary")) {
        updateDoc["payslipData.grossSalary"] = payslipData.grossSalary;
      }
    }

    if (onboarding && typeof onboarding === "object") {
      const shouldReset = onboarding.reset === true;
      const completePages = Array.isArray(onboarding.completePages)
        ? onboarding.completePages.map((page) => String(page).trim()).filter(Boolean)
        : [];

      if (shouldReset) {
        updateDoc["financialOnboarding.completedPages"] = [];
      }

      if (completePages.length > 0) {
        updateDoc.$addToSet = {
          ...(updateDoc.$addToSet || {}),
          "financialOnboarding.completedPages": {
            $each: completePages,
          },
        };
      }

      if (shouldReset || completePages.length > 0) {
        updateDoc["financialOnboarding.updatedAt"] = new Date();
      }
    }

    if (typeof newsletterOptIn === "boolean") {
      updateDoc.newsletterOptIn = newsletterOptIn;

      if (newsletterOptIn) {
        const plainToken = createUnsubscribeToken();
        updateDoc.newsletterUnsubscribeTokenHash = hashToken(plainToken);
        updateDoc.newsletterUnsubscribeTokenCreatedAt = new Date();
      }
    }

    const displayNameChanged = typeof displayName === "string" && trimmedDisplayName !== user.displayName;
    const auditEntries = buildAuditEntries({
      displayNameChanged,
      auditEvent,
    });

    if (auditEntries.length > 0) {
      updateDoc.$push = {
        accountChangeLog: {
          $each: auditEntries,
        },
      };
    }

    if (Object.keys(updateDoc).length === 0) {
      return res.status(400).json({ error: "No valid profile fields provided" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      authenticatedUserId,
      updateDoc,
      { new: true }
    );

    res.json(updatedUser);
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/v1/user/newsletter/unsubscribe
// Public route used from email links.
const unsubscribeFromNewsletter = async (req, res) => {
  try {
    const userId = String(req.query.uid || "").trim();
    const token = String(req.query.token || "").trim();

    if (!userId || !token) {
      return res.status(400).send("Missing unsubscribe details.");
    }

    const user = await User.findById(userId);
    if (!user || !user.newsletterUnsubscribeTokenHash) {
      return res.status(400).send("This unsubscribe link is invalid or expired.");
    }

    const providedTokenHash = hashToken(token);
    if (providedTokenHash !== user.newsletterUnsubscribeTokenHash) {
      return res.status(400).send("This unsubscribe link is invalid or expired.");
    }

    user.newsletterOptIn = false;
    user.newsletterUnsubscribeTokenHash = null;
    user.newsletterUnsubscribeTokenCreatedAt = null;
    await user.save();

    return res.status(200).send("You have been unsubscribed from the newsletter.");
  } catch (err) {
    console.error("Error unsubscribing from newsletter:", err);
    return res.status(500).send("Could not process unsubscribe request.");
  }
};

// POST /api/v1/user/newsletter/send-test
// Sends one test newsletter email to the authenticated user.
const sendTestNewsletter = async (req, res) => {
  try {
    const userId = req.user.uid;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.newsletterOptIn) {
      return res.status(400).json({ error: "Enable newsletter opt-in before sending a test email." });
    }

    if (!user.email) {
      return res.status(400).json({ error: "No email address found for this account." });
    }

    const period = getPreviousMonthPeriod(new Date());
    const result = await sendMonthlyNewsletterToUser({
      user,
      year: period.year,
      month: period.month,
      isTest: true,
    });

    return res.json({
      message: "Test newsletter sent.",
      email: result.email,
      period: result.period,
      metrics: result.metrics,
      comparisons: result.comparisons,
      consistencyChecks: result.consistencyChecks,
    });
  } catch (err) {
    console.error("Error sending test newsletter:", err);
    return res.status(500).json({ error: err.message || "Failed to send test newsletter." });
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
  unsubscribeFromNewsletter,
  sendTestNewsletter,
};
