const cron = require("node-cron");
const User = require("../models/User");
const { getPreviousMonthPeriod, sendMonthlyNewsletterToUser } = require("../services/newsletterService");

const runMonthlyNewsletterDispatch = async () => {
  const period = getPreviousMonthPeriod(new Date());
  const users = await User.find({ newsletterOptIn: true }).select("_id email displayName newsletterOptIn xpTotal");

  const summary = {
    year: period.year,
    month: period.month,
    totalOptedIn: users.length,
    sent: 0,
    skipped: 0,
    failed: 0,
    failures: [],
  };

  for (const user of users) {
    try {
      const result = await sendMonthlyNewsletterToUser({
        user,
        year: period.year,
        month: period.month,
        isTest: false,
      });

      if (result.skipped) {
        summary.skipped += 1;
      } else {
        summary.sent += 1;
      }
    } catch (error) {
      summary.failed += 1;
      summary.failures.push({
        userId: user._id,
        email: user.email,
        reason: error.message,
      });
    }
  }

  return summary;
};

const startNewsletterScheduler = () => {
  const enabled = String(process.env.NEWSLETTER_SCHEDULER_ENABLED || "true").toLowerCase() === "true";
  if (!enabled) {
    console.log("Newsletter scheduler disabled via NEWSLETTER_SCHEDULER_ENABLED");
    return null;
  }

  const cronExpression = process.env.NEWSLETTER_CRON || "0 9 1 * *";
  const timezone = process.env.NEWSLETTER_TIMEZONE || "UTC";
  let isRunning = false;

  const task = cron.schedule(cronExpression, async () => {
    if (isRunning) {
      console.warn("Newsletter scheduler skipped because a previous run is still active.");
      return;
    }

    isRunning = true;
    try {
      const summary = await runMonthlyNewsletterDispatch();
      console.log("Newsletter scheduler completed:", summary);
    } catch (error) {
      console.error("Newsletter scheduler failed:", error);
    } finally {
      isRunning = false;
    }
  }, { timezone });

  console.log(`Newsletter scheduler started with cron '${cronExpression}' in timezone '${timezone}'`);
  return task;
};

module.exports = {
  runMonthlyNewsletterDispatch,
  startNewsletterScheduler,
};
