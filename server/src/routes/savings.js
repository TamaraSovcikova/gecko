const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const SavingsGoal = require("../models/SavingsGoal");
const { validate } = require("../middleware/validate");
const { z } = require("zod");

router.use(authMiddleware);

const savingsGoalCreateSchema = z.object({
  name: z.string().min(1).max(120),
  targetAmount: z.number().positive(),
  targetDate: z
    .string()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), { message: "Invalid date" })
    .nullable()
    .optional(),
  category: z.enum(["emergency", "travel", "purchase", "education", "home", "retirement", "other"]).default("other"),
  emoji: z.string().max(8).default("🎯"),
  color: z.string().max(20).default("#8b6fd4"),
});

const contributionSchema = z.object({
  amount: z.number().positive(),
  note: z.string().max(200).default(""),
});

// GET /api/v1/savings - list all goals
router.get("/", async (req, res) => {
  try {
    const goals = await SavingsGoal.find({ userId: req.user.uid }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch savings goals" });
  }
});

// POST /api/v1/savings - create goal
router.post("/", validate({ body: savingsGoalCreateSchema }), async (req, res) => {
  try {
    const goal = await SavingsGoal.create({
      userId: req.user.uid,
      ...req.body,
    });
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ error: "Failed to create savings goal" });
  }
});

// PATCH /api/v1/savings/:id - update goal metadata
router.patch("/:id", async (req, res) => {
  try {
    const allowed = ["name", "targetAmount", "targetDate", "category", "emoji", "color"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const goal = await SavingsGoal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.uid },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!goal) return res.status(404).json({ error: "Goal not found" });
    res.json(goal);
  } catch (err) {
    res.status(500).json({ error: "Failed to update savings goal" });
  }
});

// POST /api/v1/savings/:id/contribute - add a contribution
router.post("/:id/contribute", validate({ body: contributionSchema }), async (req, res) => {
  try {
    const { amount, note } = req.body;
    const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.user.uid });
    if (!goal) return res.status(404).json({ error: "Goal not found" });

    goal.contributions.push({ amount, note });
    goal.currentAmount = Math.min(goal.targetAmount, goal.currentAmount + amount);

    if (goal.currentAmount >= goal.targetAmount && !goal.isCompleted) {
      goal.isCompleted = true;
      goal.completedAt = new Date();
    }

    await goal.save();
    res.json(goal);
  } catch (err) {
    res.status(500).json({ error: "Failed to add contribution" });
  }
});

// DELETE /api/v1/savings/:id
router.delete("/:id", async (req, res) => {
  try {
    const result = await SavingsGoal.findOneAndDelete({ _id: req.params.id, userId: req.user.uid });
    if (!result) return res.status(404).json({ error: "Goal not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete savings goal" });
  }
});

module.exports = router;
