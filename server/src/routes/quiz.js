const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

const { getTestQuiz } = require("../services/quizAPI");

//removing authMiddleware for now as just wanting to test forntend mplementation
router.get("/", (req, res) => {
    res.json(getTestQuiz());
});

module.exports = router;