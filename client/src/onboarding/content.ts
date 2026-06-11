export type OnboardingPageKey =
  | "/dashboard"
  | "/payslip"
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
  "/profile",
  "/settings",
  "/change-password",
  "/terms",
  "/data-policy",
];

export const ONBOARDING_STEPS: OnboardingStep[] = [
  // --- Dashboard ---
  {
    number: 1,
    route: "/dashboard",
    target: '[data-onboarding="nav-brand"]',
    title: "Home button",
    body: "The Gecko logo always takes you back to your dashboard. Use it as a shortcut from any page in the app.",
  },
  {
    number: 2,
    route: "/dashboard",
    target: '[data-onboarding="nav-primary-links"]',
    title: "Main navigation",
    body: "Dashboard, Savings, Bills, Forecast, and Learn are your five core sections. Switch between them here at any time.",
  },
  {
    number: 3,
    route: "/dashboard",
    target: '[data-onboarding="nav-account-menu"]',
    title: "Settings & Profile",
    body: "Opens your account pages: Profile, Settings, and Change Password. Your payslip data and notifications live here.",
  },
  {
    number: 4,
    route: "/dashboard",
    target: '[data-onboarding="dashboard-health-score"]',
    title: "Financial health score",
    body: "Your overall money score out of 100. It measures spending habits, budget adherence, and savings discipline. Click it to see the full breakdown.",
  },
  {
    number: 5,
    route: "/dashboard",
    target: '[data-onboarding="dashboard-takehome"]',
    title: "Monthly snapshot",
    body: "These four cards show take-home pay, total spent, budget remaining, and budget used. They update as you log expenses.",
  },
  {
    number: 6,
    route: "/dashboard",
    target: '[data-onboarding="dashboard-budget-vs-actual"]',
    title: "Budget bars",
    body: "Each bar shows one budget category: how much you planned to spend versus how much you have spent. Red means over budget.",
  },
  {
    number: 7,
    route: "/dashboard",
    target: '[data-onboarding="dashboard-allocation"]',
    title: "Add an expense",
    body: "Log a purchase here to keep your budget bars accurate. Pick the category, enter the amount, and hit Add. Your totals update instantly.",
  },
  {
    number: 8,
    route: "/dashboard",
    target: '[data-onboarding="dashboard-embedded-expenses"]',
    title: "Expense history",
    body: "All logged expenses for the month are listed here. You can edit amounts and categories or delete entries if you made a mistake.",
  },
  {
    number: 9,
    route: "/dashboard",
    target: '[data-onboarding="dashboard-adzuna-tips"]',
    title: "Market tips",
    body: "Personalised suggestions based on your job title and location. Use them as guidance - they are not financial advice.",
  },

  // --- Payslip ---
  {
    number: 10,
    route: "/payslip",
    target: '[data-onboarding="payslip-gross"]',
    title: "Annual gross salary",
    body: "Enter your salary before tax. The app immediately estimates your monthly take-home using UK 2024/25 tax and NI rates.",
  },
  {
    number: 11,
    route: "/payslip",
    target: '[data-onboarding="payslip-categories"]',
    title: "Budget categories",
    body: "Set a monthly spending limit for each category. Use the quick presets to auto-fill from your estimated take-home, or enter custom amounts.",
  },
  {
    number: 12,
    route: "/payslip",
    target: '[data-onboarding="payslip-profile-tip"]',
    title: "Optional: job and location",
    body: "Adding your job title and location unlocks salary benchmarks and personalised market tips on your dashboard.",
  },
  {
    number: 13,
    route: "/payslip",
    target: '[data-onboarding="breakdown-tax"]',
    title: "Income tax",
    body: "Income tax is deducted at 20%, 40%, or 45% depending on which band your earnings fall into. Your effective rate is shown below the salary field.",
  },
  {
    number: 14,
    route: "/payslip",
    target: '[data-onboarding="breakdown-ni"]',
    title: "National Insurance",
    body: "National Insurance is separate from income tax and contributes to state benefits. It is deducted at 8% on earnings between £12,570 and £50,270.",
  },
  {
    number: 15,
    route: "/payslip",
    target: '[data-onboarding="breakdown-takehome"]',
    title: "Monthly take-home",
    body: "This is what reaches your bank account each month after all deductions. Budget your categories to stay within this figure.",
  },

  // --- Other pages ---
  {
    number: 16,
    route: "/profile",
    target: '[data-onboarding="profile-heading"]',
    title: "Your profile",
    body: "Profile shows your account details, gamification level, and saved payslip context in one place.",
  },
  {
    number: 17,
    route: "/settings",
    target: '[data-onboarding="settings-heading"]',
    title: "Settings",
    body: "Update your account details and control newsletter preferences here. You can also replay onboarding if needed.",
  },
  {
    number: 18,
    route: "/settings",
    target: '[data-onboarding="settings-newsletter-card"]',
    title: "Monthly newsletter",
    body: "Gecko sends a monthly email summarising your finances. Toggle the opt-in, then save. Use the test button to preview last month's email.",
  },
  {
    number: 19,
    route: "/change-password",
    target: '[data-onboarding="change-password-heading"]',
    title: "Change password",
    body: "Update your password by confirming the current one first. This keeps your account secure.",
  },
  {
    number: 20,
    route: "/terms",
    target: '[data-onboarding="terms-heading"]',
    title: "Terms & Conditions",
    body: "These cover your responsibilities as a user and the limitations of the service.",
  },
  {
    number: 21,
    route: "/data-policy",
    target: '[data-onboarding="data-policy-heading"]',
    title: "Data Policy",
    body: "Explains what data the app collects, why it is stored, and how to request account deletion.",
  },
];

export const getStepByNumber = (stepNumber: number) => {
  return ONBOARDING_STEPS.find((step) => step.number === stepNumber) || null;
};

export const getStepsForRoute = (route: OnboardingPageKey): OnboardingStep[] => {
  return ONBOARDING_STEPS.filter((step) => step.route === route);
};
