const User = require("../models/User");

/**
 * GET /api/v1/user/gamification
 * Returns XP, level, streak for XP bar
 */
const getGamification = async (req, res) => {
  try {
    const userId = req.user.uid;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      xp: user.xp,
      level: user.level,
      weeklyStreak: user.weeklyStreak,
    });
  } catch (err) {
    console.error("Gamification fetch error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getGamification,
};