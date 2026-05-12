// server/src/routes/quiz.js
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth");
const {
  fetchQuiz,
  fetchTestQuiz,
  completeQuiz,
  getGamification,
  markBadgeSeen,
} = require("../controllers/quizController");

// Main quiz endpoint (supports ?topic=...)
router.get("/", authMiddleware, fetchQuiz);

// Test quiz endpoint (no auth-dependent logic assumed beyond middleware)
router.get("/test", authMiddleware, fetchTestQuiz);

// Quiz completion (XP, level, streaks)
router.post("/complete", authMiddleware, completeQuiz);

// Gamification state (XP, level, streak UI)
router.get("/gamification", authMiddleware, getGamification);

// Persist highest badge level the user has dismissed
router.post("/badge/seen", authMiddleware, markBadgeSeen);

module.exports = router;
