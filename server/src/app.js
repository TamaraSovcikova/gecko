const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const authMiddleware = require("./middleware/auth");

const router = require("./routes/index");
const dashboardRouter = require("./routes/dashboard");
const authRouter = require("./routes/auth");
const payslipRouter = require("./routes/payslip");
const userRouter = require("./routes/user");
const expenseRoutes = require("./routes/expense");
const quizRoutes = require("./routes/quiz");
const forecastRoutes = require("./routes/forecast");
const snapshotRoutes = require("./routes/snapshot");

const app = express();

app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

require("./jobs/monthlySnapshotJob");

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/dashboard", authMiddleware, dashboardRouter);
app.use("/api/v1/expenses", authMiddleware, expenseRoutes);
app.use("/api/v1/snapshots", authMiddleware, snapshotRoutes);
app.use("/api/v1/quiz", authMiddleware, quizRoutes);
app.use("/api/v1/payslip", authMiddleware, payslipRouter);
app.use("/api/v1/user", authMiddleware, userRouter);
app.use("/api/v1/forecast", authMiddleware, forecastRoutes);

app.use("/", router);

module.exports = app;
