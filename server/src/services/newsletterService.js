const crypto = require("crypto");
const nodemailer = require("nodemailer");
const Expense = require("../models/Expense");
const MonthlyBudget = require("../models/MonthlyBudget");
const MonthlySnapshot = require("../models/MonthlySnapshot");
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

const formatGbp = (value) => {
  return `GBP ${Number(value || 0).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

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
    const dashboardIncome = currency((budget.takeHomePay || 0) / 12);
    if (Math.abs(dashboardIncome - metrics.income) <= 0.01) {
      checks.push("Income matches monthly take-home source.");
    } else {
      checks.push("Warning: income did not match monthly take-home source.");
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
  const unsubscribeBase = /\/api$/.test(normalizedBase) ? normalizedBase : `${normalizedBase}/api`;

  return `${unsubscribeBase}/v1/user/newsletter/unsubscribe?uid=${encodeURIComponent(uid)}&token=${encodeURIComponent(token)}`;
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

// monthly snapshot html
const buildSnapshotHtml = (data) => {
  if (!data.categoryTotals || data.categoryTotals.length === 0) {
    return `
      <div style="margin-top: 20px; border: 1px solid #d9cbed; border-radius: 14px; background: #f8f3ff; padding: 14px 16px; color: #665b86;">
        <p style="margin: 0; font-size: 14px;">No category expenses were recorded for this month.</p>
      </div>
    `;
  }

  const categoriesHtml = data.categoryTotals
    .map(
      (cat) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #ece2ff; color: #3b335d;">${cat.category}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #ece2ff; text-align: right; color: #5f537f; font-weight: 600;">${formatGbp(cat.total)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <h2 style="font-size: 20px; margin: 28px 0 12px; color: #2d1f5f; font-weight: 700;">
      Monthly Spending Breakdown
    </h2>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
      style="border: 1px solid #d9cbed; border-radius: 14px; overflow: hidden; margin-bottom: 8px; background: #ffffff;">
      <tr style="background-color: #f3ecff;">
        <th style="text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #665b86;">
          Category
        </th>
        <th style="text-align: right; padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #665b86;">
          Total Spent
        </th>
      </tr>
      ${categoriesHtml}
    </table>
  `;
};
// monthly snapshot html

/*
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
*/

const buildMonthlyNewsletterData = async ({ user, year, month }) => {
  const { monthEnd } = getMonthRange({ year, month });
  const previousPeriod = getPreviousMonthPeriod(new Date(Date.UTC(year, month - 1, 1)));
  const { monthEnd: previousMonthEnd } = getMonthRange(previousPeriod);

  const [
    budgetForMonth,
    latestBudgetBeforeMonthEnd,
    previousBudgetForMonth,
    latestBudgetBeforePreviousMonthEnd,
    currentCategoryTotals,
    previousCategoryTotals,
    previousNewsletterSnapshot,
    currentMonthNewsletterSnapshot,
    currentMonthlySnapshot,
    previousMonthlySnapshot,
  ] = await Promise.all([
    MonthlyBudget.findOne({
      userId: user._id,
      createdAt: {
        $gte: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)),
        $lte: monthEnd,
      },
    }).sort({ createdAt: -1 }),
    MonthlyBudget.findOne({ userId: user._id, createdAt: { $lte: monthEnd } }).sort({ createdAt: -1 }),
    MonthlyBudget.findOne({
      userId: user._id,
      createdAt: {
        $gte: new Date(Date.UTC(previousPeriod.year, previousPeriod.month - 1, 1, 0, 0, 0, 0)),
        $lte: previousMonthEnd,
      },
    }).sort({ createdAt: -1 }),
    MonthlyBudget.findOne({ userId: user._id, createdAt: { $lte: previousMonthEnd } }).sort({ createdAt: -1 }),
    aggregateCategoryTotals({ userId: user._id, year, month }),
    aggregateCategoryTotals({ userId: user._id, year: previousPeriod.year, month: previousPeriod.month }),
    NewsletterSnapshot.findOne({ userId: user._id, year: previousPeriod.year, month: previousPeriod.month }).sort({ sentAt: -1 }),
    NewsletterSnapshot.findOne({ userId: user._id, year, month }).sort({ sentAt: -1 }),
    MonthlySnapshot.findOne({ userId: user._id, year, month }).sort({ createdAt: -1 }),
    MonthlySnapshot.findOne({ userId: user._id, year: previousPeriod.year, month: previousPeriod.month }).sort({ createdAt: -1 }),
  ]);

  const budget = budgetForMonth || latestBudgetBeforeMonthEnd;
  const previousBudget = previousBudgetForMonth || latestBudgetBeforePreviousMonthEnd;
  const income = currency((budget?.takeHomePay || 0) / 12);
  const totalBudget = currency((budget?.categories || []).reduce((sum, item) => sum + Number(item.budget || 0), 0));
  const expenses = currency(currentCategoryTotals.reduce((sum, item) => sum + item.total, 0));
  const savings = currency(income - expenses);
  const budgetLeft = currency(totalBudget - expenses);

  const previousXpTotal = Number(previousNewsletterSnapshot?.endingXpTotal || 0);
  const currentXpTotal = Number(user.xp || 0);
  const quizXpActivity = Number.isFinite(currentMonthlySnapshot?.xpEarned)
    ? Number(currentMonthlySnapshot.xpEarned)
    : Math.max(0, currentXpTotal - previousXpTotal);

  const metrics = {
    income,
    expenses,
    savings,
    totalBudget,
    budgetLeft,
    quizXpActivity,
    quizXpTotal: currentXpTotal,
  };

  const previousIncome = currency((previousBudget?.takeHomePay || 0) / 12);
  const previousTotalBudget = currency((previousBudget?.categories || []).reduce((sum, item) => sum + Number(item.budget || 0), 0));
  const previousExpenses = currency(previousCategoryTotals.reduce((sum, item) => sum + item.total, 0));
  const previousSavings = currency(previousIncome - previousExpenses);
  const previousBudgetLeft = currency(previousTotalBudget - previousExpenses);
  const previousQuizXpActivity = Number.isFinite(previousNewsletterSnapshot?.metrics?.quizXpActivity)
    ? Number(previousNewsletterSnapshot.metrics.quizXpActivity)
    : Number.isFinite(previousMonthlySnapshot?.xpEarned)
      ? Number(previousMonthlySnapshot.xpEarned)
      : null;

  const hasPreviousFinancialData = Boolean(
    previousBudget ||
    previousCategoryTotals.length > 0 ||
    previousMonthlySnapshot
  );

  const previousMetrics = hasPreviousFinancialData
    ? {
        income: previousIncome,
        expenses: previousExpenses,
        savings: previousSavings,
        totalBudget: previousTotalBudget,
        budgetLeft: previousBudgetLeft,
        quizXpActivity: previousQuizXpActivity,
        quizXpTotal: Number.isFinite(previousNewsletterSnapshot?.endingXpTotal)
          ? Number(previousNewsletterSnapshot.endingXpTotal)
          : null,
      }
    : null;

  const isFirstMonth = !hasPreviousFinancialData;

  const comparisons = isFirstMonth
    ? {
        incomePercent: null,
        expensesPercent: null,
        savingsPercent: null,
        quizXpPercent: null,
      }
    : {
        incomePercent: percentChange(metrics.income, previousMetrics?.income),
        expensesPercent: percentChange(metrics.expenses, previousMetrics?.expenses),
        savingsPercent: percentChange(metrics.savings, previousMetrics?.savings),
        quizXpPercent: percentChange(metrics.quizXpActivity, previousMetrics?.quizXpActivity),
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
    existingSnapshot: currentMonthNewsletterSnapshot,
  };
};

const renderLastMonthValue = (value, kind = "currency") => {
  if (typeof value !== "number") {
    return "n/a";
  }

  if (kind === "xp") {
    return `${value}`;
  }

  return formatGbp(value);
};

const buildMonthlyNewsletterHtml = ({ user, unsubscribeUrl, data }) => {
  const rows = [
    {
      label: "Income",
      value: formatGbp(data.metrics.income),
      lastMonth: renderLastMonthValue(data.previousMetrics?.income),
    },
    {
      label: "Expenses",
      value: formatGbp(data.metrics.expenses),
      lastMonth: renderLastMonthValue(data.previousMetrics?.expenses),
    },
    {
      label: "Savings",
      value: formatGbp(data.metrics.savings),
      lastMonth: renderLastMonthValue(data.previousMetrics?.savings),
    },
    {
      label: "Quiz XP activity",
      value: `${data.metrics.quizXpActivity}`,
      lastMonth: renderLastMonthValue(data.previousMetrics?.quizXpActivity, "xp"),
    },
  ];

  const rowHtml = rows
    .map(
      (row) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #ece2ff; color: #3b335d;">${row.label}</td>
          <td style="padding: 12px; border-bottom: 1px solid #ece2ff; text-align: right; font-weight: 600; color: #5f537f;">${row.value}</td>
          <td style="padding: 12px; border-bottom: 1px solid #ece2ff; text-align: right; color: #8f84ad; font-weight: 600;">${data.isFirstMonth ? "n/a" : row.lastMonth}</td>
        </tr>
      `
    )
    .join("");

  const trendItems = (data.trends.length > 0 ? data.trends : ["No notable trend changes detected this month."])
    .map((line) => `<li style="margin-bottom: 7px; color: #4a3f6b;">${line}</li>`)
    .join("");

  const summaryCards = [
    {
      label: "Budget Left",
      value: formatGbp(data.metrics.budgetLeft),
      tone: data.metrics.budgetLeft >= 0 ? "#2e7d5a" : "#8c2f5f",
      bg: data.metrics.budgetLeft >= 0 ? "#eaf8f0" : "#fdeff5",
    },
    {
      label: "Total Budget",
      value: formatGbp(data.metrics.totalBudget),
      tone: "#4e358f",
      bg: "#f1e9ff",
    },
    {
      label: "Total XP",
      value: `${data.metrics.quizXpTotal}`,
      tone: "#7c5a00",
      bg: "#fff4dc",
    },
  ]
    .map(
      (card) => `
      <td style="width: 33.33%; padding: 6px;">
        <div style="border-radius: 12px; padding: 12px; background: ${card.bg}; border: 1px solid #e4d7fb;">
          <p style="margin: 0 0 6px; font-size: 11px; color: #665b86; text-transform: uppercase; letter-spacing: 0.06em;">${card.label}</p>
          <p style="margin: 0; font-size: 17px; font-weight: 650; color: ${card.tone};">${card.value}</p>
        </div>
      </td>
    `
    )
    .join("");

  return `
    <html>
      <body style="margin: 0; padding: 0; background-color: #f4f0ff; font-family: 'Segoe UI', Arial, sans-serif; color: #2b2450;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f0ff; padding: 28px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 680px; background-color: #ffffff; border: 1px solid #d9cbed; border-radius: 18px; overflow: hidden; box-shadow: 0 12px 32px rgba(55, 36, 120, 0.14);">
                <tr>
                  <td style="padding: 24px; background-color: #5c3fa3; border-bottom: 1px solid #4e358f;">
                    <p style="margin: 0; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #efe6ff;">G.E.C.K.O</p>
                    <h1 style="margin: 8px 0 0; font-size: 30px; color: #ffffff; font-weight: 700;">Monthly Snapshot: ${data.period.label}</h1>
                    <p style="margin: 10px 0 0; color: #e8dbff; font-size: 14px;">Your financial progress update from Team Zoar</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 14px; color: #3b335d;">Hi ${user.displayName || "there"}, here is your financial summary for ${data.period.label}.</p>
                    ${data.isFirstMonth ? "<p style=\"margin: 0 0 18px; color: #665b86;\">This is your first monthly summary, so comparisons will appear from next month.</p>" : ""}

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 18px;">
                      <tr>
                        ${summaryCards}
                      </tr>
                    </table>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #d9cbed; border-radius: 14px; overflow: hidden; margin-bottom: 18px; background: #ffffff;">
                      <tr style="background-color: #f3ecff;">
                        <th style="text-align: left; padding: 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #665b86;">Metric</th>
                        <th style="text-align: right; padding: 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #665b86;">This month</th>
                        <th style="text-align: right; padding: 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #665b86;">Last month</th>
                      </tr>
                      ${rowHtml}
                    </table>

                    <h2 style="font-size: 20px; margin: 0 0 8px; color: #2d1f5f; font-weight: 700;">Trend Highlights</h2>
                    <ul style="margin: 0 0 18px 20px; padding: 0;">${trendItems}</ul>

                    <p style="margin: 0 0 8px; color: #4a3f6b;">Budget left in app terms: <span style="font-weight: 600; color: #5f537f;">${formatGbp(data.metrics.budgetLeft)}</span></p>
                    <p style="margin: 0; color: #8f84ad; font-size: 12px;">Values are generated from your stored monthly budget, expenses, and account XP data.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 18px 24px; border-top: 1px solid #e6dbfa; background-color: #fbf8ff; font-size: 12px; color: #665b86;">
                    ${buildSnapshotHtml(data)}
                    <p style="margin: 16px 0 0;">To unsubscribe, <a href="${unsubscribeUrl}" style="color: #5c3fa3; font-weight: 700;">click here</a>.</p>
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
  /* buildMonthlyNewsletterPlaceholder, */
  buildSnapshotHtml,
};
