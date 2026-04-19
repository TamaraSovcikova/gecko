const express = require("express");
const router = express.Router();

const { getGamification } = require("../controllers/gamificationController");

// middleware assumed (auth required)
const authMiddleware = require("../middleware/auth");

router.get("/gamification", authMiddleware, getGamification);

module.exports = router;