export type OnboardingPageKey =
  | "/dashboard"
  | "/payslip"
  | "/expenses"
  | "/profile"
  | "/settings"
  | "/change-password"
  | "/terms"
  | "/data-policy";

export type OnboardingStep = {
  number: number;
  route: OnboardingPageKey;
  target: string;
  title: string;
  body: string;
};

export const ONBOARDING_PAGES: OnboardingPageKey[] = [
  "/dashboard",
  "/payslip",
  "/expenses",
  "/profile",
  "/settings",
  "/change-password",
  "/terms",
  "/data-policy",
];

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    number: 1,
    route: "/dashboard",
    target: '[data-onboarding="nav-brand"]',
    title: "Home shortcut",
    body: "The app title always takes you back to your dashboard. Use it as a quick home button when moving around.",
  },
  {
    number: 2,
    route: "/dashboard",
    target: '[data-onboarding="nav-primary-links"]',
    title: "Main navigation",
    body: "These links are your top-level sections. Dashboard is your money summary, while other links take you to learning and account tools.",
  },
  {
    number: 3,
    route: "/dashboard",
    target: '[data-onboarding="nav-account-menu"]',
    title: "Account dropdown",
    body: "Your profile avatar opens account pages like Profile, Settings, Change Password, Terms, and Data Policy.",
  },
  {
    number: 4,
    route: "/dashboard",
    target: '[data-onboarding="dashboard-takehome"]',
    title: "Take-home pay",
    body: "Take-home pay is what reaches your bank after deductions. This is the figure to plan monthly spending around.",
  },
  {
    number: 5,
    route: "/dashboard",
    target: '[data-onboarding="dashboard-allocation"]',
    title: "Budget allocation",
    body: "This pie chart shows where you planned your money to go. It is your intended budget split.",
  },
  {
    number: 6,
    route: "/dashboard",
    target: '[data-onboarding="dashboard-actual-spending"]',
    title: "Actual spending",
    body: "This chart shows where money was actually spent. Comparing it with your plan helps spot overspending quickly.",
  },
  {
    number: 7,
    route: "/dashboard",
    target: '[data-onboarding="dashboard-embedded-expenses"]',
    title: "Expense logging",
    body: "Log spending here to keep your dashboard accurate. Each entry updates your real spending picture.",
  },
  {
    number: 8,
    route: "/dashboard",
    target: '[data-onboarding="dashboard-budget-vs-actual"]',
    title: "Budget vs actual",
    body: "This section tells you if you are under or over budget. It is a simple check on monthly money control.",
  },
  {
    number: 9,
    route: "/dashboard",
    target: '[data-onboarding="dashboard-adzuna-tips"]',
    title: "Adzuna tips",
    body: "These are market-based suggestions from your role and location data. Use them as guidance, not strict financial advice.",
  },
  {
    number: 10,
    route: "/payslip",
    target: '[data-onboarding="payslip-gross"]',
    title: "Gross salary",
    body: "Gross salary is your full pay before tax and National Insurance are taken out.",
  },
  {
    number: 11,
    route: "/payslip",
    target: '[data-onboarding="payslip-categories"]',
    title: "Category setup",
    body: "Set practical category amounts so your budget is realistic. These values drive your dashboard planning charts.",
  },
  {
    number: 12,
    route: "/payslip",
    target: '[data-onboarding="payslip-profile-tip"]',
    title: "Market personalization",
    body: "Adding job title and location unlocks richer salary comparisons and better contextual tips.",
  },
  {
    number: 13,
    route: "/payslip",
    target: '[data-onboarding="breakdown-tax"]',
    title: "Tax",
    body: "Tax is money paid to the government based on your earnings. Higher earnings are taxed at higher rates in bands.",
  },
  {
    number: 14,
    route: "/payslip",
    target: '[data-onboarding="breakdown-ni"]',
    title: "National Insurance",
    body: "National Insurance contributes to public services and benefits. It is separate from income tax and deducted from pay.",
  },
  {
    number: 15,
    route: "/payslip",
    target: '[data-onboarding="breakdown-takehome"]',
    title: "Take-home result",
    body: "Take-home pay is what remains after tax and NI. This is your spendable amount for budgeting.",
  },
  {
    number: 16,
    route: "/expenses",
    target: '[data-onboarding="expenses-log-form"]',
    title: "Standalone expense form",
    body: "Use this full editor when you want detailed expense updates outside the dashboard.",
  },
  {
    number: 17,
    route: "/expenses",
    target: '[data-onboarding="expenses-filter"]',
    title: "Category filter",
    body: "Filter by category to inspect one spending bucket at a time.",
  },
  {
    number: 18,
    route: "/expenses",
    target: '[data-onboarding="expenses-list"]',
    title: "Expense history",
    body: "Your logged entries are listed here with edit and delete controls.",
  },
  {
    number: 19,
    route: "/profile",
    target: '[data-onboarding="profile-heading"]',
    title: "Profile page",
    body: "Profile shows your account details, saved payslip context, and progress information in one place.",
  },
  {
    number: 20,
    route: "/settings",
    target: '[data-onboarding="settings-heading"]',
    title: "Settings page",
    body: "Settings lets you update account details and replay onboarding whenever needed.",
  },
  {
    number: 21,
    route: "/change-password",
    target: '[data-onboarding="change-password-heading"]',
    title: "Change password page",
    body: "Use this page to update your password securely after confirming your current one.",
  },
  {
    number: 22,
    route: "/terms",
    target: '[data-onboarding="terms-heading"]',
    title: "Terms page",
    body: "Terms explain service responsibilities, usage rules, and project limitations.",
  },
  {
    number: 23,
    route: "/data-policy",
    target: '[data-onboarding="data-policy-heading"]',
    title: "Data policy page",
    body: "Data policy outlines what data is collected, why it is used, and how account deletion works.",
  },
  {
    number: 24,
    route: "/settings",
    target: '[data-onboarding="settings-newsletter-card"]',
    title: "Newsletter settings",
    body: "This section controls your monthly newsletter preference and test-send tools.",
  },
  {
    number: 25,
    route: "/settings",
    target: '[data-onboarding="settings-newsletter-toggle"]',
    title: "Newsletter opt-in",
    body: "Turn this on to receive monthly summary emails. Turn it off to stop future sends.",
  },
  {
    number: 26,
    route: "/settings",
    target: '[data-onboarding="settings-newsletter-save"]',
    title: "Save preference",
    body: "Save after changing your opt-in choice so your account setting is updated server-side.",
  },
  {
    number: 27,
    route: "/settings",
    target: '[data-onboarding="settings-newsletter-test-send"]',
    title: "Get Last Month's Newsletter",
    body: "Use this button to get last month's newsletter in your inbox and verify formatting and values.",
  },
  {
    number: 28,
    route: "/dashboard",
    target: '[data-onboarding="dashboard-health-score"]',
    title: "Health score",
    body: "This is your overall score based on spending vs income, budget adherence, and plan alignment.",
  },
  {
    number: 29,
    route: "/dashboard",
    target: '[data-onboarding="dashboard-health-breakdown-trigger"]',
    title: "See breakdown",
    body: "Open the breakdown panel to see exactly what is helping or lowering your score.",
  },
  {
    number: 30,
    route: "/dashboard",
    target: '[data-onboarding="dashboard-health-breakdown-panel"]',
    title: "Breakdown panel",
    body: "After opening the panel, review the factor cards for weighted score contributions.",
  },
  {
    number: 31,
    route: "/dashboard",
    target: '[data-onboarding="dashboard-health-breakdown-factors"]',
    title: "Factor cards",
    body: "Each card shows one factor, its impact label, and its contribution to your total score.",
  },
  {
    number: 32,
    route: "/dashboard",
    target: '[data-onboarding="dashboard-health-breakdown-close"]',
    title: "Close breakdown",
    body: "Close here, click outside, or press Escape to dismiss the panel any time.",
  },
];

export const getStepByNumber = (stepNumber: number) => {
  return ONBOARDING_STEPS.find((step) => step.number === stepNumber) || null;
};

export const getStepsForRoute = (route: OnboardingPageKey): OnboardingStep[] => {
  return ONBOARDING_STEPS.filter((step) => step.route === route);
};
