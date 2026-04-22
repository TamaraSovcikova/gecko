export type HealthFactor = {
  key: string;
  title: string;
  weight: number;
  score: number;
  contribution: number;
  impact: "helping" | "lowering" | "neutral";
  valueLabel: string;
  explanation: string;
};

export type HealthBreakdown = {
  healthScore: number;
  hasEnoughData: boolean;
  summary: string;
  factors: HealthFactor[];
};

export type AdzunaTip = {
  type: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
};

export type Expense = {
  _id: string;
  category: string;
  amount: number;
  day: number;
  month: number;
  year: number;
  date: string;
  note?: string;
  createdAt: string;
};

export type DashboardData = {
  healthScore: number;
  takeHome: number;
  budgetLeft: number;
  totalBudget: number;
  actualSpending: { name: string; value: number }[];
  budgetAllocation: { name: string; value: number }[];
  averageSalary?: number;

  // IMPORTANT: backend may omit these, but frontend NEVER should
  adzunaTips: AdzunaTip[];
  expenses: Expense[];
  healthBreakdown?: HealthBreakdown;
};
