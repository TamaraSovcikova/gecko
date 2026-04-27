const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const express = require("express");

const User = require("../src/models/User");

const {
  buildMonthlyNewsletterData,
  buildMonthlyNewsletterHtml,
} = require("../src/services/newsletterService");

// ---------- CLI args ----------
const userId = process.argv[2];
const year = Number(process.argv[3]);
const month = Number(process.argv[4]);

if (!userId || !year || !month) {
  console.log(
    "Usage: node server/scripts/previewNewsletter.js <userId> <year> <month>"
  );
  process.exit(1);
}

// ---------- DB connect ----------
async function connectDB() {
  if (mongoose.connection.readyState === 1) return;

  await mongoose.connect(process.env.MONGODB_URI);
}

// ---------- Preview server ----------
async function run() {
  try {
    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      console.error("User not found");
      process.exit(1);
    }

    const data = await buildMonthlyNewsletterData({
      user,
      year,
      month,
    });

    const unsubscribeUrl = "http://localhost:3001/unsubscribe-test";

    const html = buildMonthlyNewsletterHtml({
      user,
      unsubscribeUrl,
      data,
    });

    const app = express();

    app.get("/", (req, res) => {
      res.send(html);
    });

    const PORT = 5050;

    app.listen(PORT, () => {
      console.log(`Newsletter preview running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Preview script failed:", err);
  } finally {
    // optional cleanup safety
    // await mongoose.disconnect();
  }
}

run();