const express = require("express");
const router = express.Router();
const { getQuiz } = require("../services/quizService");
const authMiddleware = require("../middleware/auth");

router.get("/", authMiddleware, async (req, res) => {
  try {
    const topic = req.query.topic || req.query.category; // Support both param names for flexibility
    const quiz = await getQuiz(topic);
    return res.json(quiz);
  } catch (error) {
    console.error("Failed to load quiz:", error.message);
    res.status(500).json({
      error: "Failed to load quiz",
      questions: [],
    });
  }
});

module.exports = router;