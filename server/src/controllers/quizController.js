// server/src/controllers/quizController.js

const User = require("../models/User");
const { getQuiz } = require("../services/quizAPI");

const BASE_XP = 100;
const GROWTH_RATE = 1.2;

const getXpForLevel = (level) =>
  Math.floor(BASE_XP * Math.pow(GROWTH_RATE, level));

const calculateGamification = (user) => {
  const xp = user.xp || 0;
  const level = user.level || 0;

  let xpAtLevelStart = 0;

  for (let i = 0; i < level; i++) {
    xpAtLevelStart += getXpForLevel(i);
  }

  const xpIntoLevel = xp - xpAtLevelStart;
  const xpNeeded = getXpForLevel(level);

  return {
    xp,
    level,
    weeklyStreak: user.weeklyStreak || 0,
    xpIntoLevel,
    xpNeeded,
    streakAtRisk: user.streakAtRisk ?? false,
  };
};

/**
 * ISO week key (Mon–Sun)
 */
const getWeekKey = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;

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
 * Calculate level from XP
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
 * POST /api/quiz/complete
 */
const completeQuiz = async (req, res) => {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.uid;
    const { score } = req.body;

    console.log("COMPLETE QUIZ UID:", userId);

    // User model uses _id as the Firebase UID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const now = new Date();

    // 1. XP CALCULATION
    const baseXp = 10;
    const earnedXp = Math.floor(score * 2 + baseXp);
    user.xp = (user.xp || 0) + earnedXp;

    // 2. LEVEL UPDATE
    user.level = calculateLevel(user.xp);

    // 3. WEEKLY STREAK
    const currentWeek = getWeekKey(now);

    if (!user.lastQuizCompletedAt) {
      user.weeklyStreak = 1;
    } else {
      const lastWeek = getWeekKey(user.lastQuizCompletedAt);
      if (currentWeek !== lastWeek) {
        user.weeklyStreak = (user.weeklyStreak || 0) + 1;
      }
    }

    user.lastQuizCompletedAt = now;

    // 4. STREAK AT RISK
    user.streakAtRisk =
      !user.lastQuizCompletedAt ||
      getWeekKey(user.lastQuizCompletedAt) !== currentWeek;

    // 5. MONTHLY QUIZ COUNT
    user.completedQuizzesThisMonth =
      (user.completedQuizzesThisMonth || 0) + 1;

    // SAVE USER
    await user.save();

    return res.status(200).json({
      message: "Quiz completed successfully",
      gamification: calculateGamification(user),
      earnedXp,
    });

  } catch (error) {
    console.error("Quiz completion error:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/quiz
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

/**
 * GET /api/quiz/test
 */
const fetchTestQuiz = async (req, res) => {
  try {
    const quiz = await getTestQuiz();
    return res.status(200).json(quiz);
  } catch (err) {
    console.error("Failed to fetch test quiz:", err);
    return res.status(500).json({ message: "Failed to fetch test quiz" });
  }
};

/**
 * GET /api/gamification
 */
const getGamification = async (req, res) => {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // User model uses _id as the Firebase UID
    const user = await User.findById(req.user.uid);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(calculateGamification(user));

  } catch (err) {
    console.error("Gamification error:", err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  fetchQuiz,
  fetchTestQuiz,
  completeQuiz,
  getGamification,
};