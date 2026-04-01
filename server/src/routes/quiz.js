const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

const { getQuiz , getTestQuiz} = require("../services/quizAPI");

//removing authMiddleware for now as just wanting to test forntend mplementation
router.get("/", (req, res) => {
    res.json(getQuiz("cmmdjgdzb004autgrtn29hcbk")); //Add quiz id in parameter -- Currently testing using random Python quiz published on QuizAPI site
});

module.exports = router;