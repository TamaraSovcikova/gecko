// server/src/controllers/quizController.js

const User = require("../models/User");
// const { getQuiz, getTestQuiz } = require("../services/quizAPI");
const { getQuiz } = require("../services/quizAPI");

const BASE_XP_FOR_LEVEL = 100;
const XP_GROWTH_RATE = 1.2;

/**
 * XP required per level
 */
const getXpForLevel = (level) => {
  return Math.floor(BASE_XP_FOR_LEVEL * Math.pow(XP_GROWTH_RATE, level));
};

/**
 * Convert XP → level
 */
const calculateLevel = (xp) => {
  let level = 0;
  let remainingXp = xp;

  while (remainingXp >= getXpForLevel(level)) {
    remainingXp -= getXpForLevel(level);
    level++;
  }

  return level;
};

/**
 * ISO week key (Mon–Sun calendar week safe)
 * e.g. 2026-W16
 */
const getWeekKey = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

  const day = d.getUTCDay() || 7; // Sunday = 7
  d.setUTCDate(d.getUTCDate() + 4 - day);

  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);

  return `${d.getUTCFullYear()}-W${weekNo}`;
};

/**
 * Month key helper (YYYY-MM)
 */
const getMonthKey = (date) => {
  return `${date.getFullYear()}-${date.getMonth() + 1}`;
};

/**
 * POST /api/quiz/complete
 */
const completeQuiz = async (req, res) => {
  // DEBUGGING
  console.log("COMPLETE QUIZ UID:", req.user.uid);
  try {
    const userId = req.user.uid;
    const { score, difficulty } = req.body;

    //const user = await User.findById(userId);
    // will this fix XP live update?
    // DEBUGGING
    console.log("LOOKING FOR USER:", userId);
    // const user = await User.findOne({ firebaseUid: userId });
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const now = new Date();

    // -----------------------------------
    // 1. XP CALCULATION
    // -----------------------------------
    const baseXp = 10;
    const difficultyMultiplier =
      difficulty === "hard" ? 2 : difficulty === "medium" ? 1.5 : 1;

    const earnedXp = Math.floor(baseXp * difficultyMultiplier * (score / 100));

    user.xp += earnedXp;

    // -----------------------------------
    // 2. LEVEL UPDATE
    // -----------------------------------
    user.level = calculateLevel(user.xp);

    // -----------------------------------
    // 3. WEEKLY STREAK (CALENDAR WEEK BASED)
    // -----------------------------------
    const currentWeek = getWeekKey(now);

    if (!user.lastQuizCompletedAt) {
      user.weeklyStreak = 1;
    } else {
      const lastWeek = getWeekKey(user.lastQuizCompletedAt);

      if (currentWeek !== lastWeek) {
        user.weeklyStreak += 1;
      }
      // same week → no change
    }

    user.lastQuizCompletedAt = now;

    // -----------------------------------
    // 4. MONTHLY QUIZ COUNT
    // -----------------------------------

    
    const currentMonth = getMonthKey(now);

    /*
    if (!user.completedQuizzesThisMonth) {
      user.completedQuizzesThisMonth = {};
    }

    const existingCount =
      user.completedQuizzesThisMonth[currentMonth] || 0;

    user.completedQuizzesThisMonth[currentMonth] = existingCount + 1;
    */

    user.completedQuizzesThisMonth = (user.completedQuizzesThisMonth || 0) + 1;

    // -----------------------------------
    // SAVE USER
    // -----------------------------------
    await user.save();

    return res.status(200).json({
      message: "Quiz completed successfully",
      gamification: {
        xpEarned: earnedXp,
        totalXp: user.xp,
        level: user.level,
        weeklyStreak: user.weeklyStreak,
        completedThisMonth: user.completedQuizzesThisMonth[currentMonth],
      },
    });
  } catch (error) {
    console.error("Quiz completion error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/*
const fetchQuiz = async (req, res) => {
  try {
    const quiz = await getQuiz();
    res.status(200).json(quiz);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch quiz" });
  }
};
*/

const fetchQuiz = async (req, res) => {
  try {
    const quiz = await getQuiz(process.env.QUIZ_ID);

    return res.status(200).json(quiz);
  } catch (err) {
    console.error("Failed to fetch quiz:", err.message);
    return res.status(500).json({ questions: [] });
  }
};

const fetchTestQuiz = async (req, res) => {
  try {
    const quiz = await getTestQuiz();
    res.status(200).json(quiz);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch test quiz" });
  }
};

module.exports = {
  fetchQuiz,
  fetchTestQuiz,
  completeQuiz,
};