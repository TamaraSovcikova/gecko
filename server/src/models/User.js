// models/User.js - Mongoose schema for the User document.

const mongoose = require("mongoose");

const ForecastWarningStateSchema = new mongoose.Schema(
  {
    monthKey: {
      type: String,
      default: "",
    },
    dismissedWarningIds: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    // Firebase UID used as the primary key instead of MongoDB ObjectId
    _id: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    displayName: {
      type: String,
      required: true,
      trim: true,
    },

    avatarChoice: {
      type: String,
      enum: ["initial", "photo1", "photo2", "photo3", "photo5"],
      default: "initial",
    },

    // Payslip data - nested so we can add taxCode, payFrequency etc. later
    // without changing the top-level schema
    payslipData: {
      grossSalary: {
        type: Number,
        default: 0,
      },
      jobTitle: {
        type: String,
        default: "",
      },
      location: {
        type: String,
        default: "",
      },
      // Future fields (add in later sprints):
      // taxCode: { type: String, default: '1257L' },
      // payFrequency: { type: String, enum: ['weekly', 'monthly'], default: 'monthly' },
    },

    // XP system and gamification
    // 1. compiling xp total per user
    // 2. user's level based on their total xp
    // 3. their weekly quiz streak
    // 4. date of last time they completed quiz (to calcualte 3.)
    // 5. # of completed quizzes for the given month
    xp: {
      type: Number,
      default: 0,
    },

    level: {
      type: Number,
      default: 0,
    },

    weeklyStreak: {
      type: Number,
      default: 0,
    },

    lastQuizCompletedAt: {
      type: Date,
      default: null,
    },

    completedQuizzesThisMonth: {
      type: Number,
      default: 0,
    },

    streakAtRisk: {
      type: Boolean,
      default: false,
    },

    highestSeenBadgeLevel: {
      type: Number,
      default: 0,
    },

    badgeResetToken: {
      type: String,
      default: "",
    },

    seenSnapshotPopupKeys: {
      type: [String],
      default: [],
    },

    // Drives post-login redirect:
    //   false → send to /payslip-setup (onboarding not done)
    //   true  → send to /dashboard
    // Flipped to true on successful POST /v1/payslip
    hasCompletedOnboarding: {
      type: Boolean,
      default: false,
    },

    financialOnboarding: {
      completedPages: {
        type: [String],
        default: [],
      },
      updatedAt: {
        type: Date,
      },
    },

    newsletterOptIn: {
      type: Boolean,
      default: false,
    },

    newsletterUnsubscribeTokenHash: {
      type: String,
      default: null,
    },

    newsletterUnsubscribeTokenCreatedAt: {
      type: Date,
      default: null,
    },

    forecastWarningState: {
      type: ForecastWarningStateSchema,
      default: () => ({
        monthKey: "",
        dismissedWarningIds: [],
      }),
    },

    // Learning path progress: { "payslip-basics": ["mod-1", "mod-2"], ... }
    pathProgress: {
      type: Map,
      of: [String],
      default: {},
    },

    studentLoan: {
      plan: {
        type: String,
        enum: ["plan1", "plan2", "plan4", "plan5", "postgrad", "none"],
        default: "none",
      },
      balance: { type: Number, default: null },
      startYear: { type: Number, default: null },
    },

    pensionSettings: {
      employerMatchPct: { type: Number, default: null },
      employeeContributionPct: { type: Number, default: null },
    },

    readinessCheck: {
      completedAt: { type: Date, default: null },
      answers: { type: Map, of: String, default: {} },
      score: { type: Number, default: null },
      priorities: { type: [String], default: [] },
    },

    accountChangeLog: [
      {
        action: {
          type: String,
          required: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    // createdAt and updatedAt timestamps added automatically by Mongoose
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

// Virtual: xpLevel is calculated from xpTotal, never stored in the database.
// Formula: every 100 XP = 1 level, starting at level 1.
// e.g. 0 XP = level 1, 100 XP = level 2, 250 XP = level 3
// virtuals are included when calling user.toJSON() or user.toObject()
UserSchema.virtual("xpLevel").get(function () {
  return Math.floor(this.xp / 100) + 1;
});

// Ensure virtuals like xpLevel are included when the document is
// converted to JSON (e.g. when sending it in an API response)
UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("User", UserSchema);
