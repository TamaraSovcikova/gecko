// schemas/index.js - Zod schemas for runtime validation of request bodies.
//
// One source of truth for "what is a valid X". Routes use validate(schema) middleware
// to reject malformed input early; controllers can rely on req.body being well-typed.
//
// When we add a shared workspace package these will move there so the client can
// reuse them. For now they live server-side and are inferred into TS via z.infer.

const { z } = require("zod");

const id = z.string().min(1).max(128);

const expenseCategory = z.string().min(1).max(64);

const moneyAmount = z.number().finite().nonnegative();

const month = z.coerce.number().int().min(1).max(12);
const year = z.coerce.number().int().min(2000).max(2100);

const isoDate = z.coerce.date();

// ---- Expense ----

const expenseCreateSchema = z.object({
  category: expenseCategory,
  amount: moneyAmount,
  date: isoDate,
  note: z.string().max(500).optional(),
  month: month.optional(),
  year: year.optional(),
});

const expenseUpdateSchema = expenseCreateSchema.partial();

const expenseListQuerySchema = z.object({
  month: month.optional(),
  year: year.optional(),
  category: expenseCategory.optional(),
});

// ---- Payslip ----

const payslipUpsertSchema = z.object({
  grossSalary: moneyAmount,
  jobTitle: z.string().max(120).optional(),
  location: z.string().max(120).optional(),
});

// ---- Monthly budget ----

const budgetCategorySchema = z.object({
  name: z.string().min(1).max(64),
  budget: moneyAmount,
});

const monthlyBudgetUpsertSchema = z.object({
  grossSalary: moneyAmount,
  taxPaid: moneyAmount.optional(),
  niPaid: moneyAmount.optional(),
  takeHomePay: moneyAmount.optional(),
  jobTitle: z.string().max(120).optional(),
  location: z.string().max(120).optional(),
  categories: z.array(budgetCategorySchema).max(50).optional(),
  month: month.optional(),
  year: year.optional(),
});

// ---- User profile ----

const userProfilePatchSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  avatarChoice: z.enum(["initial", "photo1", "photo2", "photo3", "photo5"]).optional(),
  newsletterOptIn: z.boolean().optional(),
  payslipData: payslipUpsertSchema.partial().optional(),
});

// ---- Forecast ----

const forecastDismissSchema = z.object({
  warningId: z.string().min(1).max(128),
});

// ---- Chat ----

const chatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
});

// ---- Quiz ----

const quizCompleteSchema = z.object({
  topic: z.string().max(64).optional(),
  score: z.coerce.number().int().min(0).max(100),
  correct: z.coerce.number().int().nonnegative(),
  total: z.coerce.number().int().positive(),
});

// ---- Register ----

const registerSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
});

module.exports = {
  id,
  expenseCreateSchema,
  expenseUpdateSchema,
  expenseListQuerySchema,
  payslipUpsertSchema,
  monthlyBudgetUpsertSchema,
  userProfilePatchSchema,
  forecastDismissSchema,
  chatMessageSchema,
  quizCompleteSchema,
  registerSchema,
};
