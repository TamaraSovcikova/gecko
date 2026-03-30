// On the first day of each month create a MonthlySnapshot
// SIMPLE TEST
// --> Read from MonthlyBudget
// --> Create MonthlySnapshot
// --> Display MonthlySnapshot as read only
//
// TODO:
// Logic for more detailed snapshot to be added soon
// server/jobs/snapshot.js
// Cron job to generate MonthlyBudget snapshots (idempotent)


//
// TEST CRON JOB
//
const cron = require("node-cron");
const DailyMessage = require("../models/DailyMessage");

function getDateKey(date = new Date()) {
  return date.toISOString().split("T")[0];
}

function buildMessage(date = new Date()) {
  const day = date.toLocaleDateString("en-US", { weekday: "long" });
  const formattedDate = date.toLocaleDateString("en-US");
  const time = date.toLocaleTimeString("en-US");

  return `Hello World + ${formattedDate}, ${day}, ${time}`;
}

function startDailyHelloJob() {
  cron.schedule("0 10 * * *", async () => {
    try {
      const now = new Date();
      const dateKey = getDateKey(now);
      const message = buildMessage(now);

      await DailyMessage.findOneAndUpdate(
        { dateKey },
        { dateKey, message },
        { upsert: true, new: true }
      );

      console.log(`[CRON] Daily message saved: ${message}`);
    } catch (err) {
      console.error("[CRON] Failed to save daily message:", err);
    }
  });

  console.log("[CRON] Scheduled daily job at 10:00 AM.");
}

module.exports = startDailyHelloJob;

//
// TEST CRON JOB
//