const express = require("express");
const router = express.Router();
const { getQuiz , getTestQuiz} = require("../services/quizAPI");
const authMiddleware = require("../middleware/auth");

router.get("/", authMiddleware, async (req, res) => {
    try {const quiz = await getQuiz(process.env.QUIZ_ID);
        res.json(quiz);
    } catch (error) {console.error("Failed to load quiz:", error.message);
        res.status(500).json({ questions: [] });
    }});

module.exports = router;