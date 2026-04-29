const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const router = require("./routes/index");
const dashboardRouter = require("./routes/dashboard");
const expenseRoutes = require("./routes/expense");
const quizRoutes = require("./routes/quiz");

const snapshotRoutes = require("./routes/snapshot");

const app = express();

// Security + middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

// Routes
app.use("/api/v1/quiz", quizRoutes);
app.use("/api/v1/expenses", expenseRoutes);
app.use("/api/snapshots", snapshotRoutes);
app.use("/", router);

// Optional cron job (safer control)
if (process.env.ENABLE_CRON === "true") {
  require("./jobs/monthlySnapshotJob");
}

module.exports = app;