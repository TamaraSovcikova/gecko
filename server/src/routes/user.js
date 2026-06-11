// routes/user.js - User profile and data management routes

const express = require("express");
const router = express.Router();
const {
  getUserProfile,
  exportUserData,
  deleteUserProfile,
  updateUserProfile,
  getJobTitleOptions,
  getLocationOptions,
  sendTestNewsletter,
  syncPathProgress,
  saveFinancialProfile,
} = require("../controllers/userController");

// GET /v1/user/profile
router.get("/profile", getUserProfile);

// GET /v1/user/export-data
router.get("/export-data", exportUserData);

// GET /v1/user/job-search - Search for job titles from Adzuna
router.get("/job-search", getJobTitleOptions);

// GET /v1/user/location-search - Search for locations from Adzuna
router.get("/location-search", getLocationOptions);

// DELETE /v1/user/profile
router.delete("/profile", deleteUserProfile);

// PATCH /v1/user/profile
router.patch("/profile", updateUserProfile);
router.patch("/:userId/profile", updateUserProfile);

// PATCH /v1/user/path-progress  — sync learning path completions
router.patch("/path-progress", syncPathProgress);

// PATCH /v1/user/financial-profile  — save loan, pension, readiness data
router.patch("/financial-profile", saveFinancialProfile);

// POST /v1/user/newsletter/send-test
router.post("/newsletter/send-test", sendTestNewsletter);

module.exports = router;
