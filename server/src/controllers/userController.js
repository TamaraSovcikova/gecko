// controllers/userController.js - User management and data export

const User = require("../models/User");
const Expense = require("../models/Expense");
const MonthlyBudget = require("../models/MonthlyBudget");
const PDFDocument = require("pdfkit");
const admin = require("../config/firebase");
const MonthlySnapshot = require("../models/MonthlySnapshot");
const NewsletterSnapshot = require("../models/NewsletterSnapshot");
const { searchJobTitles, searchLocations } = require("../services/adzunaCalculator");
const {
  hashToken,
  createUnsubscribeToken,
  getPreviousMonthPeriod,
  sendMonthlyNewsletterToUser,
} = require("../services/newsletterService");

const ALLOWED_AVATAR_CHOICES = new Set(["initial", "photo1", "photo2", "photo3", "photo5"]);

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

// GET /v1/user/profile
// Returns the current user's profile information
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.uid;
    let user = await User.findById(userId);

    // Some Google-auth users may exist in Firebase before a Mongo user is created.
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    } //this also had automatic user create so removed

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

// GET /v1/user/export-data
// Exports all user data as a PDF
const exportUserData = async (req, res) => {
  try {
    const userId = req.user.uid;

    // Fetch all user data
    const [user, expenses, budgets, snapshots, newsletterSnapshots, firebaseUser] = await Promise.all([
      User.findById(userId),
      Expense.find({ userId }).sort({ date: 1 }),
      MonthlyBudget.find({ userId }).sort({ createdAt: 1 }),
      MonthlySnapshot.find({ userId }).sort({ year: 1, month: 1 }),
      NewsletterSnapshot.find({ userId }).sort({ year: 1, month: 1, sentAt: 1 }),
      admin
        .auth()
        .getUser(userId)
        .then((record) => ({
          uid: record.uid,
          email: record.email || null,
          emailVerified: record.emailVerified,
          displayName: record.displayName || null,
          photoURL: record.photoURL || null,
          phoneNumber: record.phoneNumber || null,
          disabled: record.disabled,
          providerData: (record.providerData || []).map((provider) => ({
            uid: provider.uid,
            providerId: provider.providerId,
            email: provider.email || null,
            displayName: provider.displayName || null,
            phoneNumber: provider.phoneNumber || null,
            photoURL: provider.photoURL || null,
          })),
          metadata: record.metadata || null,
          customClaims: record.customClaims || null,
        }))
        .catch(() => null),
    ]);

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

    // ── User Information ──────────────────────────────────────────────────────
    doc.fontSize(14).font("Helvetica-Bold").text("User Information");
    doc.fontSize(11).font("Helvetica");
    doc.text(`Name: ${user.displayName}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Member Since: ${new Date(user.createdAt).toLocaleDateString()}`);
    doc.text(`Level: ${user.level}`);
    doc.text(`Total XP: ${user.xp}`);
    doc.text(`Weekly Quiz Streak: ${user.weeklyStreak}`);
    doc.text(`Quizzes Completed This Month: ${user.completedQuizzesThisMonth}`);
    doc.text(`Newsletter Opt-In: ${user.newsletterOptIn ? "Yes" : "No"}`);
    doc.text(`Onboarding Complete: ${user.hasCompletedOnboarding ? "Yes" : "No"}`);
    doc.moveDown();

    // ── Payslip Data ──────────────────────────────────────────────────────────
    if (user.payslipData && user.payslipData.grossSalary > 0) {
      doc.fontSize(14).font("Helvetica-Bold").text("Payslip Information");
      doc.fontSize(11).font("Helvetica");
      doc.text(`Gross Salary: £${user.payslipData.grossSalary.toFixed(2)}`);
      if (user.payslipData.jobTitle) doc.text(`Job Title: ${user.payslipData.jobTitle}`);
      if (user.payslipData.location) doc.text(`Location: ${user.payslipData.location}`);
      doc.moveDown();
    }

    // ── Budget Breakdown ──────────────────────────────────────────────────────
    if (budgets.length > 0) {
      const latestBudget = budgets[budgets.length - 1];
      doc.fontSize(14).font("Helvetica-Bold").text("Latest Budget Breakdown");
      doc.fontSize(11).font("Helvetica");
      doc.text(`Gross Salary: £${(latestBudget.grossSalary || 0).toFixed(2)}`);
      doc.text(`Tax Paid: £${(latestBudget.taxPaid || 0).toFixed(2)}`);
      doc.text(`National Insurance: £${(latestBudget.niPaid || 0).toFixed(2)}`);
      doc.text(`Take-Home Pay: £${(latestBudget.takeHomePay || 0).toFixed(2)}`);
      doc.moveDown();

      if (latestBudget.categories && latestBudget.categories.length > 0) {
        doc.fontSize(12).font("Helvetica-Bold").text("Category Allocations");
        doc.fontSize(11).font("Helvetica");
        latestBudget.categories.forEach((category) => {
          doc.text(`  ${category.name}: £${(category.budget || 0).toFixed(2)}`);
        });
        doc.moveDown();
      }

      if (budgets.length > 1) {
        doc.fontSize(14).font("Helvetica-Bold").text("Budget History");
        doc.fontSize(10).font("Helvetica");
        budgets.forEach((budget, index) => {
          doc.text(`\nBudget ${index + 1} (${new Date(budget.createdAt).toLocaleDateString()}):`);
          doc.text(`  Gross: £${(budget.grossSalary || 0).toFixed(2)}`);
          doc.text(`  Tax: £${(budget.taxPaid || 0).toFixed(2)}`);
          doc.text(`  NI: £${(budget.niPaid || 0).toFixed(2)}`);
          doc.text(`  Take-Home: £${(budget.takeHomePay || 0).toFixed(2)}`);
          if (budget.categories && budget.categories.length > 0) {
            doc.text(
              `  Categories: ${budget.categories.map((c) => `${c.name} (£${(c.budget || 0).toFixed(2)})`).join(", ")}`
            );
          }
        });
        doc.moveDown();
      }
    }

    // ── Monthly Snapshots ─────────────────────────────────────────────────────
    if (snapshots.length > 0) {
      doc.fontSize(14).font("Helvetica-Bold").text("Monthly Snapshots");
      doc.fontSize(10).font("Helvetica");
      snapshots.forEach((snap) => {
        const monthName = new Date(snap.year, snap.month - 1).toLocaleString("default", { month: "long" });
        doc.text(`\n${monthName} ${snap.year}:`);
        doc.text(`  Health Score: ${snap.healthScore}`);
        doc.text(`  Gross Salary: £${(snap.grossSalary || 0).toFixed(2)}`);
        doc.text(`  Take-Home Pay: £${(snap.takeHomePay || 0).toFixed(2)}`);
        doc.text(`  Total Expenses: £${(snap.totalExpenses || 0).toFixed(2)}`);
        doc.text(`  Savings: £${(snap.savings || 0).toFixed(2)}`);
        doc.text(`  XP Earned: ${snap.xpEarned || 0}`);
        if (snap.categories && snap.categories.length > 0) {
          doc.text(`  Categories:`);
          snap.categories.forEach((c) => {
            doc.text(`    ${c.name}: budget £${(c.budget || 0).toFixed(2)}, actual £${(c.actual || 0).toFixed(2)}`);
          });
        }
      });
      doc.moveDown();
    }

    // ── Newsletter Snapshots ──────────────────────────────────────────────────
    if (newsletterSnapshots.length > 0) {
      doc.fontSize(14).font("Helvetica-Bold").text("Newsletter Snapshots");
      doc.fontSize(10).font("Helvetica");

      newsletterSnapshots.forEach((snapshot) => {
        const monthName = new Date(snapshot.year, snapshot.month - 1).toLocaleString("default", { month: "long" });
        doc.text(`\n${monthName} ${snapshot.year}:`);
        doc.text(`  Sent At: ${new Date(snapshot.sentAt).toLocaleDateString()}`);
        doc.text(`  Income: £${(snapshot.metrics?.income || 0).toFixed(2)}`);
        doc.text(`  Expenses: £${(snapshot.metrics?.expenses || 0).toFixed(2)}`);
        doc.text(`  Savings: £${(snapshot.metrics?.savings || 0).toFixed(2)}`);
        doc.text(`  Budget Left: £${(snapshot.metrics?.budgetLeft || 0).toFixed(2)}`);
        doc.text(`  Quiz XP Activity: ${snapshot.metrics?.quizXpActivity || 0}`);
      });

      doc.moveDown();
    }

    // ── Expenses ──────────────────────────────────────────────────────────────
    if (expenses.length > 0) {
      doc.fontSize(14).font("Helvetica-Bold").text("All Expenses");
      doc.fontSize(10).font("Helvetica");
      expenses.forEach((expense, index) => {
        doc.text(`${index + 1}. ${expense.category.toUpperCase()} - £${(expense.amount || 0).toFixed(2)}`);
        doc.text(`   Date: ${new Date(expense.date).toLocaleDateString()}`);
        doc.text(`   Month: ${expense.month}/${expense.year}`);
        if (expense.note) doc.text(`   Note: ${expense.note}`);
      });
      doc.moveDown();

      // Expense summary by category
      const expenseSummary = {};
      expenses.forEach((expense) => {
        expenseSummary[expense.category] = (expenseSummary[expense.category] || 0) + (expense.amount || 0);
      });

      doc.fontSize(12).font("Helvetica-Bold").text("Expense Summary by Category");
      doc.fontSize(10).font("Helvetica");
      Object.entries(expenseSummary).forEach(([category, total]) => {
        doc.text(`  ${category}: £${total.toFixed(2)}`);
      });
      const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      doc.font("Helvetica-Bold").text(`  TOTAL: £${totalExpenses.toFixed(2)}`);
      doc.moveDown();
    }

    // ── Auth Record ───────────────────────────────────────────────────────────
    if (firebaseUser) {
      doc.fontSize(14).font("Helvetica-Bold").text("Authentication Record");
      doc.fontSize(10).font("Helvetica");
      doc.text(`UID: ${firebaseUser.uid}`);
      doc.text(`Auth Email: ${firebaseUser.email || "N/A"}`);
      doc.text(`Email Verified: ${firebaseUser.emailVerified ? "Yes" : "No"}`);
      doc.text(`Auth Disabled: ${firebaseUser.disabled ? "Yes" : "No"}`);
      doc.text(
        `Providers: ${(firebaseUser.providerData || []).map((provider) => provider.providerId).join(", ") || "N/A"}`
      );
      doc.moveDown();
    }

    // ── Complete Machine-readable Export ──────────────────────────────────────
    const fullExport = {
      generatedAt: new Date().toISOString(),
      user: user.toObject({ virtuals: true }),
      authRecord: firebaseUser,
      expenses: expenses.map((expense) => expense.toObject()),
      monthlyBudgets: budgets.map((budget) => budget.toObject()),
      monthlySnapshots: snapshots.map((snapshot) => snapshot.toObject()),
      newsletterSnapshots: newsletterSnapshots.map((snapshot) => snapshot.toObject()),
    };

    doc.addPage();
    doc.fontSize(14).font("Helvetica-Bold").text("Complete Data Export (JSON)");
    doc.moveDown(0.5);
    doc
      .fontSize(8)
      .font("Courier")
      .text(JSON.stringify(fullExport, null, 2), {
        align: "left",
      });

    // Footer
    doc.fontSize(9).font("Helvetica").text("This is your personal data export from Gecko.", { align: "center" });

    doc.end();
  } catch (err) {
    console.error("Error exporting data:", err);
    res.status(500).json({ error: "Failed to export data" });
  }
};

// DELETE /v1/user/profile
// Deletes the user account and all associated data
const deleteUserProfile = async (req, res) => {
  try {
    const userId = req.user.uid;

    // Delete database data first
    const [deletedExpenses, deletedBudgets, deletedSnapshots, deletedNewsletterSnapshots, deletedUser] =
      await Promise.all([
        Expense.deleteMany({ userId }),
        MonthlyBudget.deleteMany({ userId }),
        MonthlySnapshot.deleteMany({ userId }),
        NewsletterSnapshot.deleteMany({ userId }),
        User.findByIdAndDelete(userId),
      ]);

    // Delete Firebase auth account last
    try {
      await admin.auth().deleteUser(userId);
    } catch (firebaseError) {
      console.error("Error deleting Firebase auth user:", firebaseError);
      return res.status(500).json({ error: "Failed to delete authentication account" });
    }

    res.json({
      message: "Profile deleted successfully",
      deleted: {
        expenses: deletedExpenses.deletedCount || 0,
        monthlyBudgets: deletedBudgets.deletedCount || 0,
        monthlySnapshots: deletedSnapshots.deletedCount || 0,
        newsletterSnapshots: deletedNewsletterSnapshots.deletedCount || 0,
        userRecord: deletedUser ? 1 : 0,
        firebaseAuthUser: 1,
      },
    });
  } catch (err) {
    console.error("Error deleting profile:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// PATCH /v1/user/profile
// Updates user profile fields (e.g., payslipData, username, metadata)
const updateUserProfile = async (req, res) => {
  try {
    const authenticatedUserId = req.user.uid;
    const requestedUserId = req.params.userId || authenticatedUserId;
    const { payslipData, displayName, auditEvent, onboarding, newsletterOptIn, avatarChoice } = req.body;

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

    if (typeof avatarChoice === "string") {
      const normalizedAvatarChoice = avatarChoice.trim().toLowerCase();

      if (!ALLOWED_AVATAR_CHOICES.has(normalizedAvatarChoice)) {
        return res.status(400).json({
          error: "Invalid avatar choice. Use one of: initial, photo1, photo2, photo3, photo5",
        });
      }

      updateDoc.avatarChoice = normalizedAvatarChoice;
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

    const updatedUser = await User.findByIdAndUpdate(authenticatedUserId, updateDoc, { new: true });

    res.json(updatedUser);
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /v1/user/newsletter/unsubscribe
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

// POST /v1/user/newsletter/send-test
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

// GET /v1/user/job-search
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

// GET /v1/user/location-search
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

// PATCH /v1/user/path-progress
// Body: { pathSlug: string, completedModules: string[] }
const syncPathProgress = async (req, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { pathSlug, completedModules } = req.body;
  if (!pathSlug || !Array.isArray(completedModules)) {
    return res.status(400).json({ error: "pathSlug and completedModules required" });
  }
  try {
    await User.findByIdAndUpdate(userId, {
      $set: { [`pathProgress.${pathSlug}`]: completedModules },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("syncPathProgress error:", err);
    res.status(500).json({ error: "Failed to sync path progress" });
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
  syncPathProgress,
};
