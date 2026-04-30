const crypto = require("crypto");
const nodemailer = require("nodemailer");
const Expense = require("../models/Expense");
const MonthlyBudget = require("../models/MonthlyBudget");
const NewsletterSnapshot = require("../models/NewsletterSnapshot");
const User = require("../models/User");

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const createUnsubscribeToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const getPreviousMonthPeriod = (date = new Date()) => {
  const previous = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return {
    year: previous.getFullYear(),
    month: previous.getMonth() + 1,
  };
};

const getMonthRange = ({ year, month }) => {
  const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { monthStart, monthEnd };
};

const currency = (value) => Number((value || 0).toFixed(2));

const percentChange = (currentValue, previousValue) => {
  const current = Number(currentValue || 0);
  const previous = Number(previousValue || 0);

  if (previous === 0) {
    return null;
  }

  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
};

const monthLabel = ({ year, month }) => {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
  });
};

const aggregateCategoryTotals = async ({ userId, year, month }) => {
  const rows = await Expense.aggregate([
    {
      $match: {
        userId,
        year,
        month,
      },
    },
    {
      $group: {
        _id: "$category",
        total: { $sum: "$amount" },
      },
    },
  ]);

  return rows
    .map((row) => ({ category: row._id, total: currency(row.total) }))
    .sort((a, b) => b.total - a.total);
};

const buildTrendLines = ({ currentCategoryTotals, previousCategoryTotals, comparisons }) => {
  const lines = [];

  if (typeof comparisons.expensesPercent === "number") {
    if (comparisons.expensesPercent < 0) {
      lines.push(`You spent ${Math.abs(comparisons.expensesPercent)}% less overall than last month.`);
    } else if (comparisons.expensesPercent > 0) {
      lines.push(`You spent ${comparisons.expensesPercent}% more overall than last month.`);
    } else {
      lines.push("Your overall spending stayed the same month-to-month.");
    }
  }

  if (typeof comparisons.savingsPercent === "number") {
    if (comparisons.savingsPercent > 0) {
      lines.push(`Your savings improved by ${comparisons.savingsPercent}% compared with last month.`);
    } else if (comparisons.savingsPercent < 0) {
      lines.push(`Your savings dropped by ${Math.abs(comparisons.savingsPercent)}% compared with last month.`);
    }
  }

  const previousMap = new Map(previousCategoryTotals.map((item) => [item.category, item.total]));
  const categoryChanges = currentCategoryTotals
    .map((item) => {
      const previous = previousMap.get(item.category);
      if (!previous) {
        return null;
      }

      return {
        category: item.category,
        percent: percentChange(item.total, previous),
      };
    })
    .filter(Boolean)
    .filter((item) => typeof item.percent === "number")
    .sort((a, b) => Math.abs(b.percent) - Math.abs(a.percent));

  if (categoryChanges.length > 0) {
    const top = categoryChanges[0];
    if (top.percent < 0) {
      lines.push(`You spent ${Math.abs(top.percent)}% less on ${top.category} this month.`);
    } else if (top.percent > 0) {
      lines.push(`You spent ${top.percent}% more on ${top.category} this month.`);
    }
  }

  return lines.slice(0, 3);
};

const runConsistencyChecks = ({ metrics, categoryTotals, budget, user }) => {
  const checks = [];
  const categorySum = currency(categoryTotals.reduce((sum, item) => sum + item.total, 0));

  if (Math.abs(categorySum - metrics.expenses) <= 0.01) {
    checks.push("Expense totals are internally consistent.");
  } else {
    checks.push("Warning: category totals did not match expense total.");
  }

  const recomputedSavings = currency(metrics.income - metrics.expenses);
  if (Math.abs(recomputedSavings - metrics.savings) <= 0.01) {
    checks.push("Savings calculation matches income minus expenses.");
  } else {
    checks.push("Warning: savings calculation mismatch.");
  }

  const recomputedBudgetLeft = currency(metrics.totalBudget - metrics.expenses);
  if (Math.abs(recomputedBudgetLeft - metrics.budgetLeft) <= 0.01) {
    checks.push("Budget-left calculation matches dashboard formula.");
  } else {
    checks.push("Warning: budget-left calculation mismatch.");
  }

  if (budget) {
    const dashboardIncome = currency(budget.takeHomePay || 0);
    if (Math.abs(dashboardIncome - metrics.income) <= 0.01) {
      checks.push("Income matches dashboard take-home source.");
    } else {
      checks.push("Warning: income did not match dashboard take-home source.");
    }
  } else {
    checks.push("Warning: no payslip budget found for this period.");
  }

  if (user?.email) {
    checks.push("Profile email present for newsletter delivery.");
  } else {
    checks.push("Warning: profile email missing.");
  }

  return checks;
};

const buildUnsubscribeUrl = ({ uid, token }) => {
  const port = process.env.PORT || 3001;
  const apiBaseUrl = process.env.API_URL || process.env.SERVER_URL || `http://localhost:${port}`;
  const normalizedBase = String(apiBaseUrl).replace(/\/$/, "");
  return `${normalizedBase}/v1/user/newsletter/unsubscribe?uid=${encodeURIComponent(uid)}&token=${encodeURIComponent(token)}`;
};

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("Newsletter SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and NEWSLETTER_FROM_EMAIL.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

const sendNewsletterEmail = async ({ to, subject, html }) => {
  const from = process.env.NEWSLETTER_FROM_EMAIL || process.env.SMTP_USER;

  if (!from) {
    throw new Error("Newsletter sender is not configured. Set NEWSLETTER_FROM_EMAIL.");
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text: html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
  });
};

const buildMonthlyNewsletterPlaceholder = ({ user, unsubscribeUrl }) => {
  return {
    subject: `Your Zoar monthly snapshot (placeholder)`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #2d2d2d;">
        <h2>Hi ${user.displayName || "there"},</h2>
        <p>Monthly newsletter generation is not enabled yet.</p>
        <p>Your data is ready to support:</p>
        <ul>
          <li>Monthly income and spending summary</li>
          <li>Savings overview</li>
          <li>Month-to-month comparison indicators</li>
          <li>Quiz XP/activity trends</li>
        </ul>
        <p>This placeholder confirms newsletter preference and unsubscribe flow are wired.</p>
        ${unsubscribeUrl ? `<p style="margin-top: 20px; font-size: 12px; color: #5d5d5d;">To stop receiving these emails, <a href="${unsubscribeUrl}">unsubscribe here</a>.</p>` : ""}
      </div>
    `,
    metrics: {
      totalIncome: null,
      totalExpenses: null,
      totalSavings: null,
      quizXp: null,
    },
    comparisons: {
      // Placeholder only. Previous-month comparison will be implemented
      // when monthly snapshots/history are available.
      incomeDeltaPercent: null,
      expensesDeltaPercent: null,
      savingsDeltaPercent: null,
      quizXpDeltaPercent: null,
    },
    notes: [
      "Monthly aggregation and history comparison are pending implementation.",
      "No scheduled monthly send is active yet.",
    ],
  };
};

const buildMonthlyNewsletterData = async ({ user, year, month }) => {
  const { monthEnd } = getMonthRange({ year, month });
  const previousPeriod = getPreviousMonthPeriod(new Date(Date.UTC(year, month - 1, 1)));

  const [budgetForMonth, latestBudgetBeforeMonthEnd, currentCategoryTotals, previousCategoryTotals, previousSnapshot, currentMonthSnapshot] = await Promise.all([
    MonthlyBudget.findOne({
      userId: user._id,
      createdAt: {
        $gte: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)),
        $lte: monthEnd,
      },
    }).sort({ createdAt: -1 }),
    MonthlyBudget.findOne({ userId: user._id, createdAt: { $lte: monthEnd } }).sort({ createdAt: -1 }),
    aggregateCategoryTotals({ userId: user._id, year, month }),
    aggregateCategoryTotals({ userId: user._id, year: previousPeriod.year, month: previousPeriod.month }),
    NewsletterSnapshot.findOne({ userId: user._id, year: previousPeriod.year, month: previousPeriod.month }).sort({ sentAt: -1 }),
    NewsletterSnapshot.findOne({ userId: user._id, year, month }).sort({ sentAt: -1 }),
  ]);

  const budget = budgetForMonth || latestBudgetBeforeMonthEnd;
  const income = currency(budget?.takeHomePay || 0);
  const totalBudget = currency((budget?.categories || []).reduce((sum, item) => sum + Number(item.budget || 0), 0));
  const expenses = currency(currentCategoryTotals.reduce((sum, item) => sum + item.total, 0));
  const savings = currency(income - expenses);
  const budgetLeft = currency(totalBudget - expenses);

  const previousXpTotal = Number(previousSnapshot?.endingXpTotal || 0);
  const currentXpTotal = Number(user.xpTotal || 0);
  const quizXpActivity = Math.max(0, currentXpTotal - previousXpTotal);

  const metrics = {
    income,
    expenses,
    savings,
    totalBudget,
    budgetLeft,
    quizXpActivity,
    quizXpTotal: currentXpTotal,
  };

  const isFirstMonth = !previousSnapshot;
  const previousMetrics = previousSnapshot?.metrics || null;

  const comparisons = isFirstMonth
    ? {
        incomePercent: null,
        expensesPercent: null,
        savingsPercent: null,
        quizXpPercent: null,
      }
    : {
        incomePercent: percentChange(metrics.income, previousMetrics.income),
        expensesPercent: percentChange(metrics.expenses, previousMetrics.expenses),
        savingsPercent: percentChange(metrics.savings, previousMetrics.savings),
        quizXpPercent: percentChange(metrics.quizXpActivity, previousMetrics.quizXpActivity),
      };

  const trends = isFirstMonth
    ? [
        "This is your first monthly snapshot, so comparison trends will begin next month.",
      ]
    : buildTrendLines({
        currentCategoryTotals,
        previousCategoryTotals,
        comparisons,
      });

  const consistencyChecks = runConsistencyChecks({
    metrics,
    categoryTotals: currentCategoryTotals,
    budget,
    user,
  });

  return {
    period: { year, month, label: monthLabel({ year, month }) },
    isFirstMonth,
    metrics,
    previousMetrics,
    comparisons,
    trends,
    categoryTotals: currentCategoryTotals,
    consistencyChecks,
    endingXpTotal: currentXpTotal,
    existingSnapshot: currentMonthSnapshot,
  };
};

const renderComparisonValue = (value) => {
  if (typeof value !== "number") {
    return "-";
  }

  if (value > 0) {
    return `+${value}%`;
  }

  return `${value}%`;
};

const buildMonthlyNewsletterHtml = ({ user, unsubscribeUrl, data }) => {
  const rows = [
    { label: "Income", value: `GBP ${data.metrics.income.toFixed(2)}`, compare: renderComparisonValue(data.comparisons.incomePercent) },
    { label: "Expenses", value: `GBP ${data.metrics.expenses.toFixed(2)}`, compare: renderComparisonValue(data.comparisons.expensesPercent) },
    { label: "Savings", value: `GBP ${data.metrics.savings.toFixed(2)}`, compare: renderComparisonValue(data.comparisons.savingsPercent) },
    { label: "Quiz XP activity", value: `${data.metrics.quizXpActivity}`, compare: renderComparisonValue(data.comparisons.quizXpPercent) },
  ];

  const rowHtml = rows
    .map(
      (row) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ece8de;">${row.label}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ece8de; text-align: right; font-weight: 700;">${row.value}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ece8de; text-align: right; color: #59615a;">${data.isFirstMonth ? "n/a" : row.compare}</td>
        </tr>
      `
    )
    .join("");

  const trendItems = (data.trends.length > 0 ? data.trends : ["No notable trend changes detected this month."])
    .map((line) => `<li style="margin-bottom: 6px;">${line}</li>`)
    .join("");

  return `
    <html>
      <body style="margin: 0; padding: 0; background-color: #f5f6f3; font-family: Arial, sans-serif; color: #2b332c;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f6f3; padding: 24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; background-color: #ffffff; border: 1px solid #e2ddd3; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 24px; background-color: #edf4ea; border-bottom: 1px solid #dce5d8;">
                    <p style="margin: 0; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #5f6f61;">Bank Tree Budgeting</p>
                    <h1 style="margin: 8px 0 0; font-size: 26px; color: #2c5b3f; font-weight: 400;">Monthly snapshot: ${data.period.label}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 16px;">Hi ${user.displayName || "there"}, here is your financial summary for ${data.period.label}.</p>
                    ${data.isFirstMonth ? "<p style=\"margin: 0 0 18px; color: #5c645e;\">This is your first monthly summary, so comparisons will appear from next month.</p>" : ""}

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #ece8de; border-radius: 10px; overflow: hidden; margin-bottom: 18px;">
                      <tr style="background-color: #faf9f6;">
                        <th style="text-align: left; padding: 10px; font-size: 12px; text-transform: uppercase; color: #6f736f;">Metric</th>
                        <th style="text-align: right; padding: 10px; font-size: 12px; text-transform: uppercase; color: #6f736f;">This month</th>
                        <th style="text-align: right; padding: 10px; font-size: 12px; text-transform: uppercase; color: #6f736f;">vs last month</th>
                      </tr>
                      ${rowHtml}
                    </table>

                    <h2 style="font-size: 17px; margin: 0 0 8px; color: #335740;">Trend highlights</h2>
                    <ul style="margin: 0 0 18px 18px; padding: 0; color: #424c44;">${trendItems}</ul>

                    <p style="margin: 0 0 8px; color: #4d564f;">Budget left in app terms: <strong>GBP ${data.metrics.budgetLeft.toFixed(2)}</strong></p>
                    <p style="margin: 0; color: #727971; font-size: 12px;">Values are generated from your stored monthly budget, expenses, and account XP data.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 18px 24px; border-top: 1px solid #ece8de; background-color: #faf9f6; font-size: 12px; color: #616a62;">
                    To unsubscribe, <a href="${unsubscribeUrl}" style="color: #2f6a4b;">click here</a>.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

const sendMonthlyNewsletterToUser = async ({ user, year, month, isTest = false }) => {
  const latestUser = await User.findById(user?._id || user?.id);
  if (!latestUser) {
    return { skipped: true, reason: "missing_user" };
  }

  if (!latestUser.newsletterOptIn) {
    return { skipped: true, reason: "not_opted_in" };
  }

  if (!latestUser.email) {
    return { skipped: true, reason: "no_email" };
  }

  if (!isTest) {
    const existing = await NewsletterSnapshot.findOne({ userId: latestUser._id, year, month }).select("sentAt");
    if (existing?.sentAt) {
      return { skipped: true, reason: "already_sent" };
    }
  }

  const plainToken = createUnsubscribeToken();
  latestUser.newsletterUnsubscribeTokenHash = hashToken(plainToken);
  latestUser.newsletterUnsubscribeTokenCreatedAt = new Date();
  await latestUser.save();

  const unsubscribeUrl = buildUnsubscribeUrl({ uid: latestUser._id, token: plainToken });
  const data = await buildMonthlyNewsletterData({ user: latestUser, year, month });
  const html = buildMonthlyNewsletterHtml({ user: latestUser, unsubscribeUrl, data });

  await sendNewsletterEmail({
    to: latestUser.email,
    subject: `${isTest ? "[Test] " : ""}Your Zoar monthly snapshot - ${data.period.label}`,
    html,
  });

  if (!isTest) {
    await NewsletterSnapshot.findOneAndUpdate(
      { userId: latestUser._id, year, month },
      {
        $set: {
          userId: latestUser._id,
          year,
          month,
          metrics: data.metrics,
          comparisons: data.comparisons,
          trends: data.trends,
          categoryTotals: data.categoryTotals,
          consistencyChecks: data.consistencyChecks,
          isFirstMonth: data.isFirstMonth,
          endingXpTotal: data.endingXpTotal,
          sentAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  return {
    skipped: false,
    email: latestUser.email,
    period: data.period,
    metrics: data.metrics,
    comparisons: data.comparisons,
    consistencyChecks: data.consistencyChecks,
  };
};

module.exports = {
  hashToken,
  createUnsubscribeToken,
  getPreviousMonthPeriod,
  buildUnsubscribeUrl,
  sendNewsletterEmail,
  buildMonthlyNewsletterData,
  buildMonthlyNewsletterHtml,
  sendMonthlyNewsletterToUser,
  buildMonthlyNewsletterPlaceholder,
};
