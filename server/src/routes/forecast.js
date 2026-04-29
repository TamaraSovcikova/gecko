const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { computeForecastForUser } = require("../services/forecastService");

function getAuthenticatedUserId(req) {
  return req.user?._id || req.user?.uid || req.userId;
}

//GET /api/v1/forecast
// Fetch the latest computed forecast for dashboard page load.
router.get("/", async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    console.log("[forecastRoutes] GET /forecast for userId =", userId);

    const forecastPayload = await computeForecastForUser(userId);

    return res.status(200).json({
      success: true,
      forecast: forecastPayload,
    });
  } catch (error) {
    console.error("[forecastRoutes] GET /forecast failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load forecast",
      error: error.message,
    });
  }
});

//POST /api/v1/forecast/dismiss
//Body: { warningId: string }
 
router.post("/dismiss", async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { warningId } = req.body;

    console.log("[forecastRoutes] POST /forecast/dismiss");
    console.log("[forecastRoutes] userId =", userId);
    console.log("[forecastRoutes] warningId =", warningId);

    if (!warningId) {
      return res.status(400).json({
        success: false,
        message: "warningId is required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    if (
      !user.forecastWarningState ||
      user.forecastWarningState.monthKey !== monthKey
    ) {
      user.forecastWarningState = {
        monthKey,
        dismissedWarningIds: [],
      };
    }

    if (!user.forecastWarningState.dismissedWarningIds.includes(warningId)) {
      user.forecastWarningState.dismissedWarningIds.push(warningId);
    }

    await user.save();

    console.log("[forecastRoutes] Warning dismissed successfully.");

    return res.status(200).json({
      success: true,
      dismissedWarningIds: user.forecastWarningState.dismissedWarningIds,
    });
  } catch (error) {
    console.error("[forecastRoutes] POST /forecast/dismiss failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to dismiss warning",
      error: error.message,
    });
  }
});

module.exports = router;