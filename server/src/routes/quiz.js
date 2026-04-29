// server/src/routes/quiz.js
const express = require("express");

const authMiddleware = require("../middleware/auth");
const {
  fetchQuiz,
  fetchTestQuiz,
  completeQuiz,
  getGamification,
} = require("../controllers/quizController");

// Main quiz endpoint (supports ?topic=...)
router.get("/", authMiddleware, fetchQuiz);

// Test quiz endpoint (no auth-dependent logic assumed beyond middleware)
router.get("/test", authMiddleware, fetchTestQuiz);

// Quiz completion (XP, level, streaks)
router.post("/complete", authMiddleware, completeQuiz);

// Gamification state (XP, level, streak UI)
router.get("/gamification", authMiddleware, getGamification);

module.exports = router;


// server/src/routes/quiz.js
// DEBUGGING
console.log("QUIZ ROUTES FILE LOADED");

const router = express.Router();
const authMiddleware = require("../middleware/auth");

// trying to merge gamificationController into quizController
const {
  fetchQuiz,
  fetchTestQuiz,
  completeQuiz,
  getGamification,
} = require("../controllers/quizController");

router.get("/", authMiddleware, fetchQuiz);
router.post("/complete", authMiddleware, completeQuiz);
router.get("/gamification", authMiddleware, getGamification);



module.exports = router;