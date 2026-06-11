export type PathModule = {
  id: string;
  title: string;
  summary: string;
  content: string[];
  actionItem: string;
  actionPath?: string;
  conceptSlugs?: string[];
};

export type LearningPath = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  emoji: string;
  color: string; // tailwind bg class
  borderColor: string;
  textColor: string;
  modules: PathModule[];
};

export const LEARNING_PATHS: LearningPath[] = [
  {
    slug: "payslip-basics",
    title: "Payslip Basics",
    subtitle: "Start here",
    description:
      "Understand every line of your payslip — gross pay, tax, NI, and why take-home is always less than your salary.",
    emoji: "📄",
    color: "bg-indigo-50",
    borderColor: "border-indigo-200",
    textColor: "text-indigo-700",
    modules: [
      {
        id: "what-is-a-payslip",
        title: "What is a payslip?",
        summary: "A legal document your employer must give you every pay period showing earnings and deductions.",
        content: [
          "Your payslip is a legal document that your employer must provide every time you're paid. It shows exactly what you've earned and exactly what has been taken before the money reaches your bank account.",
          "The key numbers are: gross pay (what you were paid before deductions), total deductions (tax + NI + any other items), and net pay — also called take-home — which is what actually lands in your account.",
          "Most payslips also show a cumulative year-to-date figure, your tax code, your National Insurance number, and your payroll number. You should keep your payslips — they're useful evidence of income for rental applications, mortgages, and tax disputes.",
        ],
        actionItem:
          "Set up your gross salary in Gecko to see your estimated take-home and start tracking your actual budget.",
        actionPath: "/payslip",
        conceptSlugs: ["gross-vs-net", "paye"],
      },
      {
        id: "income-tax-explained",
        title: "Income tax explained",
        summary: "You pay different rates on different slices of income — not one flat rate on everything.",
        content: [
          "Income tax in the UK is progressive, which means the rate you pay increases in steps ('bands') as your income rises. Crucially, only the earnings within each band are taxed at that band's rate — not your entire salary.",
          "For 2024/25: the first £12,570 is your personal allowance — completely tax-free. Earnings from £12,571 to £50,270 are taxed at 20% (basic rate). Earnings from £50,271 to £125,140 are taxed at 40% (higher rate). Anything above £125,140 is taxed at 45%.",
          "This means a £35,000 earner pays 20% only on the £22,430 between £12,570 and £35,000 — not 20% of £35,000. Their actual (effective) tax rate is about 11.5%, not 20%.",
          "Your employer deducts tax automatically through the PAYE system before you're paid. You don't need to do anything manually unless you have untaxed income from other sources.",
        ],
        actionItem:
          "Enter your gross salary in Gecko's payslip setup and expand 'Why is this different from my gross?' to see your band breakdown.",
        actionPath: "/payslip",
        conceptSlugs: ["income-tax-bands", "personal-allowance", "tax-code"],
      },
      {
        id: "national-insurance-explained",
        title: "National Insurance explained",
        summary:
          "NI is not income tax — it's a separate contribution that builds your State Pension and funds the NHS.",
        content: [
          "National Insurance (NI) appears alongside income tax on your payslip, but it's a completely separate system with different rules and a different purpose. Where income tax funds general government spending, NI specifically funds the NHS, certain benefits, and — most importantly for you — your State Pension entitlement.",
          "For 2024/25, employee NI is 8% on earnings between £12,570 and £50,270, and 2% on anything above £50,270. There's no NI on earnings below £12,570.",
          "Every tax year that you earn above the lower earnings limit counts as a 'qualifying year' toward your State Pension. You need 35 qualifying years for the full new State Pension (£221.20/week in 2024/25). At 22, you're already building toward retirement — even if it feels abstract.",
          "NI rates changed significantly in 2024: reduced from 12% to 10% in January 2024, then to 8% in April 2024. This is why take-home pay increased for many employees in 2024 without any salary change.",
        ],
        actionItem:
          "Check the NI estimate in your Gecko payslip setup to see how much you're contributing per month toward your future pension.",
        actionPath: "/payslip",
        conceptSlugs: ["national-insurance", "state-pension"],
      },
      {
        id: "take-home-and-next-steps",
        title: "Your take-home — and what to do with it",
        summary: "Net pay is the only number that matters for your budget. Here's how to allocate it.",
        content: [
          "Your take-home (net) pay is the number everything else in your financial life is built on. It's the only number you actually have to spend — not your gross salary, not your contract value.",
          "A simple rule for your first budget: allocate your take-home across needs (housing, food, essential transport), wants (eating out, entertainment, subscriptions), and savings. A common starting split is 50% needs, 30% wants, 20% savings.",
          "One of the most common mistakes young earners make is budgeting based on the gross number. If your salary is £30,000, your actual monthly take-home is closer to £2,025 — not £2,500. Always plan with net figures.",
          "The second mistake is spending before saving. Try setting up an automatic transfer to a savings account on payday, before you spend on discretionary items. Even £50/month compounds meaningfully over a decade.",
        ],
        actionItem:
          "Set up your budget categories in Gecko using the 50/30/20 preset, then track your first week of spending to see where you actually land.",
        actionPath: "/payslip",
        conceptSlugs: ["gross-vs-net", "50-30-20-rule", "pay-yourself-first"],
      },
    ],
  },
  {
    slug: "building-a-budget",
    title: "Building a Budget",
    subtitle: "The fundamentals",
    description: "Set limits that actually work — without tracking every penny or giving up after a week.",
    emoji: "📊",
    color: "bg-teal-50",
    borderColor: "border-teal-200",
    textColor: "text-teal-700",
    modules: [
      {
        id: "why-budget",
        title: "Why budget?",
        summary: "A budget is a spending plan — it gives your money direction instead of letting it disappear.",
        content: [
          "A budget isn't about restriction — it's about intention. Without a plan, money tends to flow toward immediate wants and away from future needs. A budget gives each pound a purpose before you spend it.",
          "Most people who feel like they 'never have enough money' are actually earning enough — they just have no structure for where it goes. Small amounts spent without awareness (subscriptions, impulse buys, convenience food) routinely add up to £200-400/month for people who don't track.",
          "You don't need to track every penny. You need enough structure that you know roughly where your money goes and that your savings are happening. Everything else is detail.",
        ],
        actionItem:
          "Look at your last month's bank statement. Identify the three largest categories of spending. Are they what you'd choose if you'd planned in advance?",
        conceptSlugs: ["50-30-20-rule", "pay-yourself-first"],
      },
      {
        id: "50-30-20-framework",
        title: "The 50/30/20 framework",
        summary: "A simple starting allocation: half on needs, a third on wants, a fifth on savings.",
        content: [
          "The 50/30/20 rule allocates your take-home pay: 50% to needs (things you must pay), 30% to wants (things you choose to pay), and 20% to savings and debt repayment.",
          "Needs include rent, council tax, utilities, basic food, essential transport, and minimum debt payments. Wants include restaurants, entertainment, gym memberships, streaming services, new clothes beyond basics, and holidays.",
          "The boundary between needs and wants is often blurry. A gym membership is a want in most cases. A car is a need in rural areas, a want in a city with good transport. Be honest with yourself — the goal is clarity, not judgment.",
          "In practice, many graduates can't hit 50% for needs because rent alone is 35-40% of take-home in cities. That's okay — adjust the ratios. The 20% savings target is the hardest to compromise, because it's the one with the largest long-term impact.",
        ],
        actionItem:
          "Apply the 50/30/20 preset in Gecko's budget setup to see how your categories align with this framework.",
        actionPath: "/payslip",
        conceptSlugs: ["50-30-20-rule", "pay-yourself-first"],
      },
      {
        id: "setting-category-limits",
        title: "Setting category limits",
        summary: "Specific limits per category are more useful than a single total budget.",
        content: [
          "Vague budgets fail. 'I'll spend less on food' fails. 'I'll spend under £200/month on food' is specific enough to act on and check at the end of the month.",
          "Start with the categories that matter most to your spending pattern. Housing and transport are usually fixed. Food, eating out, and entertainment are usually variable and where most overspending happens.",
          "When you set a limit, also note what behaviour change makes it achievable. £200/month on food means roughly £6.50/day — which probably means cooking most meals. Be honest about whether the limit is realistic given your actual life.",
          "Review your limits monthly for the first three months. Most people find that one or two categories are consistently over, and they need to either cut the category or raise the limit and compensate elsewhere.",
        ],
        actionItem:
          "Set up your budget categories in Gecko with specific monthly limits for each. Log your first expense of the day.",
        actionPath: "/payslip",
        conceptSlugs: ["50-30-20-rule"],
      },
      {
        id: "tracking-without-obsessing",
        title: "Tracking without obsessing",
        summary: "The goal is awareness, not a perfect spreadsheet. A brief weekly check is enough.",
        content: [
          "Detailed daily tracking works well for some people and causes others to give up entirely. Find the level of tracking that you'll actually maintain for months, not just weeks.",
          "A workable minimum: check your budget remaining once a week. If you're in the red on a category by mid-month, you have two options — consciously cut spending in that category for the rest of the month, or consciously accept the overspend and know it's coming from somewhere else.",
          "Awareness is the goal. You don't need perfect compliance — you need to know when you're drifting and make conscious decisions. Occasional overspending on a category is normal. Consistent overspending by the same amount every month is a signal that your limit is wrong.",
          "The most common mistake is abandoning tracking entirely after one bad month. One overspent month is data, not failure. The useful question is: what changed? Was it a one-off expense (fine), or a pattern (needs adjusting)?",
        ],
        actionItem:
          "Log your expenses daily for one week. At the end of the week, check which category surprised you most.",
        actionPath: "/dashboard",
        conceptSlugs: ["50-30-20-rule", "pay-yourself-first"],
      },
    ],
  },
  {
    slug: "emergency-fund",
    title: "Emergency Fund 101",
    subtitle: "Your safety net",
    description:
      "Build 3 months of living expenses in cash savings — the foundation that makes every other financial goal more stable.",
    emoji: "🛡️",
    color: "bg-emerald-50",
    borderColor: "border-emerald-200",
    textColor: "text-emerald-700",
    modules: [
      {
        id: "why-emergency-fund",
        title: "Why you need an emergency fund",
        summary: "Without one, any unexpected expense becomes a debt problem. With one, it's just an inconvenience.",
        content: [
          "An emergency fund is cash kept specifically for unexpected costs — sudden job loss, car breakdown, boiler failure, medical bills, emergency travel. It exists so these events don't force you into debt or derail your other financial goals.",
          "Without an emergency fund, a £500 car repair means: putting it on a credit card (starting a debt spiral), raiding your savings (setting back a goal), or borrowing from someone. With an emergency fund, it's just an annoying Tuesday.",
          "The difference between these two situations is not luck — it's preparation. The emergency fund is the single piece of financial infrastructure that makes everything else more stable, because it removes the downside scenario from every other financial decision you make.",
        ],
        actionItem:
          "Create an emergency fund savings goal in Gecko. The target should be 3 months of your essential monthly spending (rent + food + utilities + transport).",
        actionPath: "/savings",
        conceptSlugs: ["emergency-fund", "compound-interest"],
      },
      {
        id: "how-much-to-save",
        title: "How much to save",
        summary: "Start with £1,000. Build to 3 months of essential expenses. 6 months if your income is variable.",
        content: [
          "The classic target is 3–6 months of essential living expenses. For a single graduate in the UK, essential expenses (rent, food, utilities, transport, minimum debt payments) typically run £1,200–£2,500/month, meaning a full emergency fund is £3,600–£15,000.",
          "That can feel daunting when you're starting from zero. Don't let the full target paralyse you. A £1,000 starter fund handles 80% of common emergencies — most unexpected costs are car repairs, appliance replacements, or medical costs, not extended unemployment.",
          "Build to £1,000 first. Then work toward 1 month of essentials. Then 3 months. The first £1,000 is the most impactful — it eliminates the 'I have no choice but to use a credit card' scenario for most emergencies.",
          "Use 6 months as your target if you're self-employed, have variable income, work in a cyclical industry (hospitality, construction, media), or have dependants. The more unpredictable your income, the larger the buffer you need.",
        ],
        actionItem:
          "Calculate your monthly essential spending: rent + food + utilities + transport. Set your Gecko savings goal to 3× this figure.",
        actionPath: "/savings",
        conceptSlugs: ["emergency-fund"],
      },
      {
        id: "where-to-keep-it",
        title: "Where to keep it",
        summary: "Easy-access savings account, not invested. You need it available within 1–2 working days.",
        content: [
          "Your emergency fund needs two properties: it must be accessible quickly (within 1–2 working days), and it must not fall in value. This rules out investments — stock markets can drop 30–50% at exactly the moment you'd need the money (recessions cause job losses too).",
          "Use an easy-access savings account with a competitive interest rate. In 2024–25, many easy-access accounts pay 4–5% interest, which meaningfully outpaces inflation. Look at: Marcus by Goldman Sachs, Chip, Plum, or your existing bank's instant-access savings account.",
          "A Cash ISA works too. The interest is tax-free, which matters once you're earning meaningful interest. With the personal savings allowance (£1,000 for basic rate taxpayers), tax on savings interest isn't an issue until your fund is large or rates are high.",
          "One useful trick: keep the emergency fund at a different bank from your current account. Slightly more friction to access it = less temptation to dip into it for non-emergencies.",
        ],
        actionItem:
          "Open a separate easy-access savings account if you don't already have one. Set up a monthly standing order to it from your current account on payday.",
        conceptSlugs: ["emergency-fund", "isa-vs-savings-account"],
      },
      {
        id: "building-the-fund",
        title: "How to build it",
        summary: "Automate contributions on payday. Treat it like a non-negotiable bill.",
        content: [
          "The most effective way to build an emergency fund: set up an automatic transfer to your savings account on the day your salary arrives, before discretionary spending begins. Pay yourself first.",
          "How much to contribute depends on your situation. A rough guide: if you have no emergency fund, prioritise it over other savings goals until you reach £1,000. After that, split contributions between your emergency fund and other goals until you reach 3 months.",
          "Use found money — tax refunds, birthday money, payrise increments, bonus — to top up the fund faster. Every £100 added brings the target closer without affecting your regular budget.",
          "What about debt? The one exception: if you have high-interest debt (credit card at 20%+), paying that off earns you a guaranteed 20%+ return. A hybrid approach works well: build a £1,000 starter fund first (essential safety net), then split contributions between the debt and the rest of the emergency fund.",
        ],
        actionItem:
          "Set up a standing order of even £50/month to your savings account on your payday date. Increase it when you can.",
        actionPath: "/savings",
        conceptSlugs: ["pay-yourself-first", "compound-interest", "emergency-fund"],
      },
    ],
  },
  {
    slug: "saving-for-a-home",
    title: "Saving for Your First Home",
    subtitle: "Long-term goal",
    description:
      "Understand how deposits, mortgages, and schemes like the LISA work — and how long your timeline really is.",
    emoji: "🏠",
    color: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-700",
    modules: [
      {
        id: "the-deposit-math",
        title: "The deposit maths",
        summary: "Most first-time buyers need a 5–10% deposit. On a £250,000 property that's £12,500–£25,000.",
        content: [
          "To buy a home you need a deposit — typically 5% minimum, but 10% gets you meaningfully better mortgage rates, and 15–20% gets the best deals. The larger the deposit, the lower your loan-to-value (LTV) ratio, and the lower the interest rate lenders will offer.",
          "UK average house prices vary enormously: approximately £190,000 in the North East, £270,000 in the Midlands, £310,000 in Scotland, £440,000 in the South East, and £700,000+ in London. A 10% deposit on a £250,000 property is £25,000.",
          "Stamp Duty Land Tax (SDLT) is another upfront cost: first-time buyers pay no SDLT on properties up to £425,000 (until March 2025), then 5% on the portion between £425,001 and £625,000. Solicitor fees add approximately £1,500–£3,000. Budget for all upfront costs, not just the deposit.",
          "The honest timeline: saving £25,000 on a graduate salary while renting takes 3–7 years for most people. That's not a reason to give up — it's a reason to start early and use the right vehicles.",
        ],
        actionItem:
          "Create a 'Home deposit' savings goal in Gecko. Set the target to your estimated 10% deposit plus estimated buying costs.",
        actionPath: "/savings",
        conceptSlugs: ["compound-interest", "isa-vs-savings-account"],
      },
      {
        id: "lifetime-isa",
        title: "The Lifetime ISA (LISA)",
        summary: "Save toward a first home and the government adds a 25% bonus — up to £1,000/year free.",
        content: [
          "The Lifetime ISA is the most valuable savings vehicle available to first-time buyers. You save up to £4,000 per tax year, and the government adds a 25% bonus — a maximum of £1,000 free money per year.",
          "Rules: you must be aged 18–39 to open a LISA. The money can only be used for a first home purchase (property must cost £450,000 or less) or for retirement after age 60. If you withdraw for any other reason, you pay a 25% withdrawal penalty — which claws back more than just the bonus, so treat this as locked-in money.",
          "A cash LISA (available from providers like Moneybox, Starling, Beehive) holds your savings in cash and pays interest plus the bonus. A Stocks and Shares LISA invests the money for potentially higher long-term growth but with more risk.",
          "If you're saving for a house and don't already have a LISA, open one now. Even if you only contribute a small amount this tax year, the bonus arrives quickly and the clock on the 12-month rule starts immediately. You must have held a LISA for 12 months before using it for a property purchase.",
        ],
        actionItem:
          "Open a Lifetime ISA with £1 if you haven't already, to start the 12-month eligibility clock. Consider Moneybox or Beehive for competitive cash rates.",
        conceptSlugs: ["isa-vs-savings-account", "compound-interest"],
      },
      {
        id: "mortgage-basics",
        title: "Mortgage basics",
        summary:
          "A mortgage is a loan secured on the property. Your rate, term, and deposit determine your monthly cost.",
        content: [
          "A mortgage is a long-term loan secured against the property you're buying. If you stop making payments, the lender can repossess the home. This is why lenders scrutinise affordability carefully — they want confidence you can sustain payments over 25–35 years.",
          "Key mortgage terms: LTV (loan-to-value) — the percentage of the property price you're borrowing. Lower LTV = better rates. Fixed rate — your interest rate is locked for a set period (typically 2, 3, or 5 years). Variable rate — the rate can change. For most first-time buyers, a 2 or 5-year fixed rate offers predictability during the initial years of ownership.",
          "Affordability: most lenders will offer you 4–4.5× your annual income. On a £35,000 salary that's a maximum mortgage of £140,000–£157,500. On a joint £60,000 household income, it's £240,000–£270,000. This is why many first-time buyers buy outside major cities or buy together.",
          "Monthly payments: a £200,000 mortgage at 4.5% over 25 years costs approximately £1,100/month. Compare this to what you pay in rent — this is often the deciding factor in timing a purchase.",
        ],
        actionItem:
          "Use the Gecko Scenarios tool to model what a salary increase would do to your mortgage affordability.",
        actionPath: "/scenarios",
        conceptSlugs: ["compound-interest"],
      },
      {
        id: "home-buying-timeline",
        title: "Planning your timeline",
        summary: "Work backwards from your target purchase date to know exactly how much to save each month.",
        content: [
          "Work backwards from your goal. If you want to buy in 5 years and need £30,000 (deposit + costs), you need to save £500/month. Can your current budget support that, or do you need to reduce other spending or increase income first?",
          "Use the LISA for up to £4,000/year of your target (getting the £1,000/year bonus). Put the rest in a high-interest easy-access account or a Stocks and Shares ISA if your timeline is 5+ years.",
          "Key milestones on your timeline: 18 months before purchase — start getting mortgage agreements in principle to understand your borrowing capacity and identify any credit issues to fix. 6 months before — finalise your deposit amount and stop investing it in equities (move to cash). 3 months before — instruct a solicitor and start the legal process.",
          "The timeline might feel long. The key insight is that the right preparation now (emergency fund, LISA opened, credit score managed, savings rate set) makes the eventual process straightforward — rather than scrambling to fix things at the last minute.",
        ],
        actionItem:
          "Set a target purchase year in your Gecko savings goal. Work out the monthly savings amount needed and set up a standing order.",
        actionPath: "/savings",
        conceptSlugs: ["compound-interest", "isa-vs-savings-account", "pay-yourself-first"],
      },
    ],
  },
  {
    slug: "pensions-101",
    title: "Pensions 101",
    subtitle: "Your future self",
    description:
      "Understand auto-enrolment, employer matching, and why starting young is the most powerful financial decision you can make.",
    emoji: "🌱",
    color: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-700",
    modules: [
      {
        id: "what-is-a-pension",
        title: "What is a pension?",
        summary: "A tax-efficient long-term investment account for retirement — different from savings.",
        content: [
          "A pension is a tax-efficient savings account specifically for retirement. Unlike a regular savings account, contributions get tax relief (the government tops up your contributions) and the money is invested, so it grows significantly over decades.",
          "The tax relief works like this: if you're a basic rate taxpayer, contributing £80 of your take-home pay costs you only £80, but £100 lands in your pension — the government adds £20 tax relief automatically. For higher rate taxpayers, the relief is even more generous.",
          "The trade-off: you can't access a workplace pension until age 57 (rising to 58 in 2028). This is by design — it's retirement money. The inaccessibility is actually what makes it powerful: it prevents you from spending the compounding growth.",
          "There are two main types: Defined Contribution (most common for younger workers) — your pension pot is whatever you and your employer have contributed plus investment growth. Defined Benefit (rarer, often in public sector) — pays a guaranteed income based on your salary and years of service.",
        ],
        actionItem:
          "Check your payslip or HR portal to confirm whether you're enrolled in a workplace pension and what the current contribution rates are.",
        conceptSlugs: ["auto-enrolment", "compound-interest"],
      },
      {
        id: "auto-enrolment",
        title: "Auto-enrolment and employer matching",
        summary: "Your employer must contribute to your pension. Opting out means leaving free money behind.",
        content: [
          "Since 2012, employers must automatically enrol eligible employees (aged 22–66, earning over £10,000/year) into a workplace pension and make minimum contributions. You're enrolled by default — you have to actively opt out.",
          "Minimum contributions: at least 8% of qualifying earnings total, with your employer paying at least 3% and you paying 5%. Your 5% benefits from tax relief, so it only costs 4% of your gross pay. Your employer's 3% is essentially free money on top of your salary.",
          "Many employers match beyond the minimum. A common arrangement: the employer matches your contribution up to 5% of salary. If you contribute 5%, they contribute 5% — total 10% into your pension. Opting out doesn't keep that employer 5% in your pocket — it disappears. It's a pay cut.",
          "The only situation where opting out might make sense: you have very high-interest debt (25%+ credit card) and a tiny employer match. In that case, paying off the debt first can make sense mathematically. But you should re-enrol as soon as the debt is gone.",
        ],
        actionItem:
          "Check if your employer matches more than the minimum 3%. If they do, and you're not contributing up to the match limit, increase your contribution — it's an immediate 100% return.",
        conceptSlugs: ["auto-enrolment", "compound-interest", "state-pension"],
      },
      {
        id: "state-pension",
        title: "State Pension and NI qualifying years",
        summary: "35 qualifying NI years gets you £221/week from age 66. You're building it now.",
        content: [
          "The State Pension is a government-funded pension paid from age 66 (rising to 67 by 2028). The full new State Pension is £221.20/week (2024/25) — approximately £11,500/year. It's not enough to retire on comfortably, but it's a guaranteed income floor regardless of what happens to your other savings.",
          "To get the full amount you need 35 qualifying National Insurance years. A qualifying year is any tax year in which you earn above the lower earnings limit (£6,396 in 2024/25) and pay NI contributions. At 22, starting work now, you'll have roughly 44 years until 66 — more than enough to get the full pension even with gaps for travel, study, or career breaks.",
          "You need at least 10 qualifying years to receive anything at all. Gaps in your record can sometimes be filled by paying voluntary NI contributions — often very cost-effective. Check your State Pension forecast at gov.uk/check-state-pension.",
          "The State Pension has a triple lock guarantee: it increases each year by the highest of inflation (CPI), average earnings growth, or 2.5%. This makes it one of the most reliable inflation-linked income sources available.",
        ],
        actionItem:
          "Check your State Pension forecast at gov.uk/check-state-pension to see your current qualifying years and projected pension.",
        conceptSlugs: ["state-pension", "national-insurance"],
      },
      {
        id: "how-much-to-contribute",
        title: "How much to contribute",
        summary: "A rough rule: contribute half your age as a percentage of salary. Start at 22, contribute 11%.",
        content: [
          "A common rule of thumb for pension contributions: half your age at the time you start saving, as a percentage of your gross salary. Starting at 22: contribute 11%. Starting at 30: contribute 15%. The later you start, the larger percentage you need to compensate.",
          "The minimum 5% contribution (with 3% employer minimum) is a floor, not a target. The total 8% is unlikely to fund a comfortable retirement. Most financial planners suggest a total contribution of 12–15% of salary (combined employee + employer) as a reasonable target for a UK graduate entering work.",
          "The power of compound growth means that £100/month contributed at 22 is worth roughly £25,000 more at 67 than the same £100/month starting at 32 — assuming 6% annual growth. This is not abstract. Starting now, even at a low salary, matters more than starting later at a higher salary.",
          "You can usually adjust your pension contribution through your employer's HR portal. Start at whatever the employer match limit is (often 5%), then increase by 1% whenever you get a pay rise — you'll never notice the pay rise went partly to your pension, but the compounding effect is significant.",
        ],
        actionItem:
          "Log into your employer's pension portal and check your current contribution rate. Is it at least enough to get the full employer match?",
        conceptSlugs: ["compound-interest", "auto-enrolment", "isa-vs-savings-account"],
      },
    ],
  },
];

export function getPathBySlug(slug: string): LearningPath | undefined {
  return LEARNING_PATHS.find((p) => p.slug === slug);
}

// localStorage helpers
const storageKey = (userId: string, pathSlug: string) => `zoar.pathProgress.${userId}.${pathSlug}`;

export function getCompletedModules(userId: string, pathSlug: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(userId, pathSlug));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr.filter((x: unknown) => typeof x === "string")) : new Set();
  } catch {
    return new Set();
  }
}

export function markModuleComplete(
  userId: string,
  pathSlug: string,
  moduleId: string,
  authToken?: string
): Set<string> {
  const current = getCompletedModules(userId, pathSlug);
  current.add(moduleId);
  const arr = [...current];
  try {
    localStorage.setItem(storageKey(userId, pathSlug), JSON.stringify(arr));
  } catch {}
  // Fire-and-forget server sync; localStorage is source of truth on the client
  if (userId && userId !== "anon" && authToken) {
    fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/v1/user/path-progress`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ pathSlug, completedModules: arr }),
    }).catch(() => {
      /* offline — localStorage already updated */
    });
  }
  return current;
}

export function getPathProgress(userId: string): Record<string, number> {
  const result: Record<string, number> = {};
  for (const path of LEARNING_PATHS) {
    const completed = getCompletedModules(userId, path.slug);
    result[path.slug] = path.modules.length > 0 ? (completed.size / path.modules.length) * 100 : 0;
  }
  return result;
}
