// server/src/controllers/quizController.js

const User = require("../models/User");
const { getQuiz, getTestQuiz } = require("../services/quizService");

const BASE_XP = 100;
const GROWTH_RATE = 1.2;

const getXpForLevel = (level) =>
  Math.floor(BASE_XP * Math.pow(GROWTH_RATE, level));

const calculateLevel = (xp) => {
  let level = 0;
  let remainingXp = xp;

  while (remainingXp >= getXpForLevel(level)) {
    remainingXp -= getXpForLevel(level);
    level++;
  }

  return level;
};

const calculateGamification = (user) => {
  const xp = user.xp || 0;
  const level = user.level || 0;

  let xpAtLevelStart = 0;

  for (let i = 0; i < level; i++) {
    xpAtLevelStart += getXpForLevel(i);
  }

  return {
    xp,
    level,
    weeklyStreak: user.weeklyStreak || 0,
    xpIntoLevel: xp - xpAtLevelStart,
    xpNeeded: getXpForLevel(level),
    streakAtRisk: user.streakAtRisk ?? false,
    highestSeenBadgeLevel: user.highestSeenBadgeLevel || 0,
    badgeResetToken: user.badgeResetToken || "",
  };
};

const getWeekKey = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;

  d.setUTCDate(d.getUTCDate() + 4 - day);

  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);

  return `${d.getUTCFullYear()}-W${weekNo}`;
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
    const { score = 0 } = req.body;

    console.log("COMPLETE QUIZ UID:", userId);

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const now = new Date();

    // XP
    const earnedXp = Math.floor(score * 2 + 10);
    user.xp = (user.xp || 0) + earnedXp;

    // Level
    user.level = calculateLevel(user.xp);

    // Weekly streak
    const currentWeek = getWeekKey(now);

    if (!user.lastQuizCompletedAt) {
      user.weeklyStreak = 1;
    } else {
      const lastWeek = getWeekKey(new Date(user.lastQuizCompletedAt));

      if (currentWeek !== lastWeek) {
        user.weeklyStreak = (user.weeklyStreak || 0) + 1;
      }
    }

    user.lastQuizCompletedAt = now;

    user.streakAtRisk = false;

    // Monthly counter
    user.completedQuizzesThisMonth =
      (user.completedQuizzesThisMonth || 0) + 1;

    await user.save();

    return res.status(200).json({
      message: "Quiz completed successfully",
      earnedXp,
      gamification: calculateGamification(user),
    });

  } catch (error) {
    console.error("Quiz completion error:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/quiz?topic=xyz
 */
const fetchQuiz = async (req, res) => {
  try {   

    // 1. Primary: query param (ideal case)
    let topic = req.query.topic;

    // 2. Fallback: try parsing from referer URL (because frontend uses navigate)
    if (!topic && req.headers.referer) {
      try {
        const url = new URL(req.headers.referer);
        topic = url.searchParams.get("topic");
      } catch (e) {
        console.warn("Could not parse referer:", e.message);
      }
    }

    // 3. Normalize
    topic = topic ? String(topic).trim() : null;

    const quiz = await getQuiz(topic);

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

/**
 * POST /api/quiz/badge/seen
 */
const markBadgeSeen = async (req, res) => {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const level = Number(req.body?.level);
    if (!Number.isFinite(level) || level < 1) {
      return res.status(400).json({ message: "Invalid badge level" });
    }

    const user = await User.findById(req.user.uid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentSeen = Number(user.highestSeenBadgeLevel || 0);
    user.highestSeenBadgeLevel = Math.max(currentSeen, Math.floor(level));
    await user.save();

    return res.status(200).json({
      highestSeenBadgeLevel: user.highestSeenBadgeLevel,
    });
  } catch (err) {
    console.error("Badge seen update error:", err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  fetchQuiz,
  fetchTestQuiz,
  completeQuiz,
  getGamification,
  markBadgeSeen,
};