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
} = require("../controllers/userController");

// GET /api/v1/user/profile
router.get("/profile", getUserProfile);

// GET /api/v1/user/export-data
router.get("/export-data", exportUserData);

// GET /api/v1/user/job-search - Search for job titles from Adzuna
router.get("/job-search", getJobTitleOptions);

// GET /api/v1/user/location-search - Search for locations from Adzuna
router.get("/location-search", getLocationOptions);

// DELETE /api/v1/user/profile
router.delete("/profile", deleteUserProfile);

// PATCH /api/v1/user/profile
router.patch("/profile", updateUserProfile);
router.patch("/:userId/profile", updateUserProfile);

// POST /api/v1/user/newsletter/send-test
router.post("/newsletter/send-test", sendTestNewsletter);

module.exports = router;
