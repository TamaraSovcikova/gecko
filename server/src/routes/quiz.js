const express = require("express");
const router = express.Router();
const { getQuiz , getTestQuiz} = require("../services/quizAPI");

//removing authMiddleware for now as just wanting to test forntend mplementation
router.get("/", async (req, res) => {
    try {const quiz = await getQuiz(process.env.QUIZ_ID);
        res.json(quiz);
    } catch (error) {console.error("Failed to load quiz:", error.message);
        res.status(500).json({ questions: [] });
    }});

module.exports = router;