// server/src/routes/quiz.js
/*
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
*/

// server/src/routes/quiz.js
// DEBUGGING
console.log("QUIZ ROUTES FILE LOADED");

const express = require("express");
const router = express.Router();
const QuizController = require("../controllers/quizController");
const authMiddleware = require("../middleware/auth");

router.get("/", authMiddleware, QuizController.fetchQuiz);
router.post("/complete", authMiddleware, QuizController.completeQuiz);


module.exports = router;