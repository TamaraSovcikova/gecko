/**
 * Canonical TypeScript types for all Gecko API response shapes.
 *
 * These types document the contract between the Express server and the React
 * client. When a server response shape changes, update the corresponding type
 * here — TypeScript will surface every call site that needs to be updated.
 */

// ─── Shared primitives ───────────────────────────────────────────────────────

export type CategoryValue = {
  name: string;
  value: number;
};

export type CategoryBudget = {
  name: string;
  budget: number;
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

export type HealthFactor = {
  key: string;
  title: string;
  weight: number;
  score: number;
  contribution: number;
  impact: "helping" | "neutral" | "lowering";
  valueLabel: string;
  explanation: string;
};

export type HealthBreakdown = {
  healthScore: number;
  hasEnoughData: boolean;
  summary: string;
  factors: HealthFactor[];
};

export type Expense = {
  _id: string;
  userId: string;
  amount: number;
  category: string;
  date: string;
  month: number;
  year: number;
  note?: string;
  source?: "manual" | "ocr";
  createdAt: string;
};

export type DashboardResponse = {
  healthScore: number;
  takeHome: number;
  budgetLeft: number;
  totalBudget: number;
  actualSpending: CategoryValue[];
  budgetAllocation: CategoryValue[];
  healthBreakdown: HealthBreakdown;
  averageSalary: number | null;
  adzunaTips: BudgetTip[];
  expenses: Expense[];
};

export type BudgetTip = {
  type: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
};

// ─── Forecast ────────────────────────────────────────────────────────────────

export type CategoryForecast = {
  category: string;
  currentSpend: number;
  currentTrendMean: number;
  linearPrediction: number;
  seasonalPrediction: number | null;
  rollingMedian: number | null;
  finalForecast: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
  trend: "up" | "down" | "stable";
  anomaly: boolean;
  budget: number;
  salaryClamped: boolean;
};

export type ForecastWarning = {
  id: string;
  type: "overspend" | "anomaly";
  category: string;
  budget?: number;
  projectedSpend?: number;
  overspendAmount?: number;
  message: string;
};

export type ForecastResponse =
  | {
      forecastingActive: false;
      reason: "NO_BUDGET_FOUND" | "INSUFFICIENT_HISTORY";
      monthsOfHistory?: number;
      projections: Record<string, never>;
      warnings: never[];
    }
  | {
      forecastingActive: true;
      reason: null;
      monthKey: string;
      monthsOfHistory: number;
      projections: Record<string, CategoryForecast>;
      totals: { totalProjectedSpend: number; grossSalaryUpperBound: number };
      warnings: ForecastWarning[];
    };

// ─── User / Profile ──────────────────────────────────────────────────────────

export type StudentLoan = {
  plan: "plan1" | "plan2" | "plan4" | "plan5" | "postgrad" | "none";
  balance: number | null;
  startYear: number | null;
};

export type PensionSettings = {
  employerMatchPct: number | null;
  employeeContributionPct: number | null;
};

export type ReadinessCheck = {
  completedAt: string | null;
  score: number | null;
  priorities: string[];
  answers: Record<string, string>;
};

export type UserProfile = {
  _id: string;
  email: string;
  displayName: string;
  avatarChoice: string;
  xp: number;
  level: number;
  xpLevel: number;
  weeklyStreak: number;
  hasCompletedOnboarding: boolean;
  newsletterOptIn: boolean;
  payslipData: {
    grossSalary: number;
    jobTitle: string;
    location: string;
  };
  studentLoan: StudentLoan;
  pensionSettings: PensionSettings;
  readinessCheck: ReadinessCheck;
  pathProgress: Record<string, string[]>;
};

// ─── Savings ─────────────────────────────────────────────────────────────────

export type SavingsContribution = {
  amount: number;
  note: string;
  date: string;
};

export type SavingsGoal = {
  _id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  category: "emergency" | "travel" | "purchase" | "education" | "home" | "retirement" | "other";
  emoji: string;
  color: string;
  contributions: SavingsContribution[];
  isCompleted: boolean;
  completedAt: string | null;
  progressPct: number;
  remainingAmount: number;
  monthsToTarget: number | null;
  createdAt: string;
};

// ─── Chat ────────────────────────────────────────────────────────────────────

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

export type ChatHistoryResponse = {
  messages: ChatMessage[];
};

// ─── Monthly snapshots ───────────────────────────────────────────────────────

export type MonthlySnapshot = {
  _id: string;
  userId: string;
  monthKey: string;
  grossSalary: number;
  takeHomePay: number;
  totalExpenses: number;
  savings: number;
  xpEarned: number;
  categories: Record<string, number>;
  createdAt: string;
};

// ─── Payslip / Budget ────────────────────────────────────────────────────────

export type PayslipCategory = {
  name: string;
  budget: number;
};

export type PayslipResult = {
  grossSalary: number;
  taxPaid: number;
  niPaid: number;
  takeHomePay: number;
  categories: PayslipCategory[];
};

// ─── Quiz ────────────────────────────────────────────────────────────────────

export type QuizQuestion = {
  id: string | number;
  question: string;
  answers: { answer: string; correct_answer: boolean }[];
  category?: string;
  difficulty?: string;
};

export type QuizState = {
  questions: QuizQuestion[];
  currentIndex: number;
  score: number;
  xpEarned: number;
  completed: boolean;
};
