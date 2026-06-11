export type Concept = {
  slug: string;
  title: string;
  summary: string; // one-liner for inline tooltips
  sections: { heading: string; body: string }[];
  relatedSlugs: string[];
  seeInApp?: { label: string; path: string };
};

export const CONCEPTS: Concept[] = [
  {
    slug: "gross-vs-net",
    title: "Gross vs net pay",
    summary: "Gross is what you're contracted for. Net is what lands in your bank.",
    sections: [
      {
        heading: "What is gross pay?",
        body: "Your gross salary is the amount your employer agreed to pay you — the number on your offer letter and contract. It's the starting point before any deductions.",
      },
      {
        heading: "What is net pay?",
        body: "Net pay (also called take-home pay) is what actually arrives in your bank account after income tax and National Insurance have been deducted. For most UK employees, net pay is 70–85% of gross depending on earnings.",
      },
      {
        heading: "Why the gap?",
        body: "The difference between your gross and net salary is made up of income tax (which funds public services) and National Insurance (which builds your pension entitlement and funds the NHS). Both are deducted automatically by your employer under the PAYE system — you never see the money.",
      },
      {
        heading: "Why it matters",
        body: "Always plan your budget using your net figure, not your gross. A £30,000 salary is roughly £2,025/month take-home, not £2,500. Many people get surprised by their first payslip because they budgeted against the gross number.",
      },
    ],
    relatedSlugs: ["income-tax-bands", "national-insurance", "paye", "personal-allowance"],
    seeInApp: { label: "Set up your payslip", path: "/payslip" },
  },
  {
    slug: "income-tax-bands",
    title: "UK income tax bands",
    summary: "You pay different rates on different slices of income — not one rate on everything.",
    sections: [
      {
        heading: "How bands work",
        body: "UK income tax is progressive — you pay different rates on different portions of your income, not a flat rate on the whole lot. Earning more doesn't mean you suddenly pay the higher rate on everything.",
      },
      {
        heading: "The 2024/25 bands",
        body: "Personal allowance: £0–£12,570 taxed at 0%. Basic rate: £12,571–£50,270 taxed at 20%. Higher rate: £50,271–£125,140 taxed at 40%. Additional rate: over £125,140 taxed at 45%. If you earn £35,000, you pay 0% on the first £12,570, then 20% on the remaining £22,430. Your average (effective) rate ends up well below 20%.",
      },
      {
        heading: "Effective rate vs marginal rate",
        body: "Your marginal rate is the rate you pay on the next pound you earn. Your effective rate is the total tax divided by total income — always lower than the marginal rate. A £40,000 earner pays roughly 13% effective rate, not 20%.",
      },
    ],
    relatedSlugs: ["personal-allowance", "gross-vs-net", "national-insurance", "tax-code"],
    seeInApp: { label: "See your tax estimate", path: "/payslip" },
  },
  {
    slug: "personal-allowance",
    title: "Personal allowance",
    summary: "The first £12,570 of your income is completely tax-free each year.",
    sections: [
      {
        heading: "What it is",
        body: "The personal allowance is the amount of income you can earn in a tax year without paying any income tax. For 2024/25 it is £12,570. Tax is only calculated on your earnings above this threshold.",
      },
      {
        heading: "What reduces it",
        body: "Your allowance is reduced by £1 for every £2 you earn over £100,000. By £125,140 it has been reduced to zero, which is why the effective tax rate spikes sharply at that level.",
      },
      {
        heading: "Why it matters for your payslip",
        body: "Your tax code (usually 1257L) tells your employer how much allowance you get. The number 1257 × 10 = £12,570 personal allowance. If your tax code is wrong, you could be overpaying tax each month.",
      },
    ],
    relatedSlugs: ["income-tax-bands", "tax-code", "gross-vs-net"],
    seeInApp: { label: "See your tax estimate", path: "/payslip" },
  },
  {
    slug: "national-insurance",
    title: "National Insurance (NI)",
    summary: "A separate deduction from tax that builds your State Pension entitlement.",
    sections: [
      {
        heading: "What it is",
        body: "National Insurance is a separate deduction from income tax — both appear on your payslip but they're distinct systems with different rules and purposes.",
      },
      {
        heading: "What you pay",
        body: "Employee NI rates for 2024/25: 8% on weekly earnings between £242–£967 (annual: £12,570–£50,270). 2% on earnings above £967/week (annual: above £50,270). There's no NI on earnings below the lower earnings limit.",
      },
      {
        heading: "What you get for it",
        body: "Every year you pay sufficient NI counts as a 'qualifying year' toward your State Pension. You need 35 qualifying years for the full new State Pension (£221.20/week in 2024/25). NI contributions also fund NHS access and entitlement to contributory benefits like Statutory Sick Pay.",
      },
      {
        heading: "Why the rate recently changed",
        body: "Employee NI was cut from 12% to 10% in January 2024, then to 8% in April 2024. This is why take-home pay increased for most employees in 2024 without any change in salary.",
      },
    ],
    relatedSlugs: ["gross-vs-net", "state-pension", "income-tax-bands", "paye"],
    seeInApp: { label: "See your NI estimate", path: "/payslip" },
  },
  {
    slug: "tax-code",
    title: "Tax codes",
    summary: "Your tax code tells HMRC how much of your income is tax-free. 1257L is most common.",
    sections: [
      {
        heading: "How to read your tax code",
        body: "The number in your tax code × 10 = your tax-free income. 1257L means £12,570 personal allowance. The letter tells HMRC how to apply the allowance: L = standard, M = married couple's allowance transferred in, N = transferred out, T = other adjustments needed.",
      },
      {
        heading: "Emergency tax codes",
        body: "If you start a new job and your employer doesn't have a P45 from your previous employer, you may be put on an emergency code (ending in W1 or M1). This means tax is calculated month-by-month rather than cumulatively, which can lead to overpaying. Contact HMRC or check your Personal Tax Account to fix it.",
      },
      {
        heading: "Underpaying or overpaying?",
        body: "At the end of each tax year HMRC reconciles your actual tax against what was deducted. If you overpaid you get a refund. If you underpaid you'll be asked to pay the difference — often by adjusting the following year's tax code. Check your personal tax account at gov.uk if you think your code is wrong.",
      },
    ],
    relatedSlugs: ["personal-allowance", "income-tax-bands", "paye"],
  },
  {
    slug: "paye",
    title: "PAYE (Pay As You Earn)",
    summary: "The system that deducts your tax and NI automatically before you're paid.",
    sections: [
      {
        heading: "How it works",
        body: "Under PAYE, your employer calculates your income tax and NI and deducts them from your salary before paying you. The deductions are sent directly to HMRC on your behalf. Most UK employees never need to file a Self Assessment tax return because PAYE handles it automatically.",
      },
      {
        heading: "When you'd need Self Assessment",
        body: "You'll need to file a Self Assessment tax return if you're self-employed, you earn over £100,000, you have income from renting property, you have significant investment income, or you're a company director with untaxed income.",
      },
      {
        heading: "Your P60 and P45",
        body: "Your employer gives you a P60 at the end of each tax year showing total earnings and deductions — keep this for your records. A P45 is issued when you leave a job, and should be given to your next employer so they can set the right tax code from day one.",
      },
    ],
    relatedSlugs: ["tax-code", "income-tax-bands", "national-insurance"],
  },
  {
    slug: "emergency-fund",
    title: "Emergency fund",
    summary: "3 months of living expenses saved somewhere accessible. Your financial safety net.",
    sections: [
      {
        heading: "What it is",
        body: "An emergency fund is cash set aside specifically for unexpected costs — job loss, car breakdown, medical bill, boiler failure. It's kept in an easy-access savings account, not invested, because you need to access it quickly without penalties.",
      },
      {
        heading: "How much to save",
        body: "The standard target is 3–6 months of essential living expenses (rent/mortgage, food, utilities, transport). For a single person in the UK this is typically £3,000–£8,000. Start with a £1,000 starter emergency fund to cover most minor emergencies, then build to 3 months.",
      },
      {
        heading: "Why it changes everything",
        body: "Without an emergency fund, one unexpected bill becomes a debt problem. With one, the same event is just an inconvenience. It's the foundation that makes every other financial goal more stable — you won't have to raid your savings or take out a loan when something goes wrong.",
      },
      {
        heading: "Where to keep it",
        body: "Use an easy-access savings account (not a fixed-term). Look for a competitive rate — Cash ISAs and Marcus-style instant-access accounts often beat high street banks. The money needs to be available within 1–2 working days.",
      },
    ],
    relatedSlugs: ["compound-interest", "isa-vs-savings-account", "50-30-20-rule"],
    seeInApp: { label: "Set a savings goal", path: "/savings" },
  },
  {
    slug: "compound-interest",
    title: "Compound interest",
    summary: "Earning interest on your interest. The most powerful force in personal finance.",
    sections: [
      {
        heading: "How it works",
        body: "When you earn interest on savings, that interest is added to your balance. Next period, you earn interest on the original amount plus the interest you already earned. This compounding effect accelerates over time — slowly at first, then dramatically.",
      },
      {
        heading: "The numbers",
        body: "£100/month invested at 7% average annual return: after 10 years = £17,300 (you put in £12,000). After 20 years = £52,400 (you put in £24,000). After 30 years = £122,000 (you put in £36,000). The last decade adds more than the first two combined.",
      },
      {
        heading: "Why starting early matters more than amount",
        body: "Starting 10 years earlier matters more than investing 50% more per month. A 22-year-old investing £100/month until retirement will end up with more than a 32-year-old investing £200/month for the same period. Time is the input you can never buy back.",
      },
      {
        heading: "Compounding works against you too",
        body: "The same maths applies to debt. A £3,000 credit card balance at 25% APR costs £750 in interest in year one, £938 in year two (on the now-larger balance). High-interest debt compounds faster than savings grow — paying it off first is usually the best guaranteed return available.",
      },
    ],
    relatedSlugs: ["isa-vs-savings-account", "emergency-fund", "state-pension", "pound-cost-averaging"],
    seeInApp: { label: "See your savings goals", path: "/savings" },
  },
  {
    slug: "isa-vs-savings-account",
    title: "ISA vs savings account",
    summary: "ISAs are tax-free wrappers. If you're earning interest on savings, an ISA usually wins.",
    sections: [
      {
        heading: "What is an ISA?",
        body: "An Individual Savings Account (ISA) is a tax-free wrapper for savings or investments. Interest, dividends, and gains inside an ISA are completely free from UK tax. You can put up to £20,000 per tax year into ISAs.",
      },
      {
        heading: "Types of ISA",
        body: "Cash ISA: like a savings account but interest is tax-free. Stocks and Shares ISA: invest in funds or shares tax-free. Lifetime ISA (LISA): save toward a first home or retirement — government adds a 25% bonus on contributions up to £4,000/year (maximum £1,000 bonus/year). You must be 18–39 to open a LISA.",
      },
      {
        heading: "When a regular savings account is fine",
        body: "Basic rate taxpayers have a £1,000 Personal Savings Allowance — the first £1,000 of savings interest is tax-free anyway. If your interest is below this threshold, a high-rate easy-access account might offer a better rate than a Cash ISA. Compare actual rates, not just the tax wrapper.",
      },
      {
        heading: "LISA for first-time buyers",
        body: "The Lifetime ISA bonus is worth using if you're planning to buy your first home. Put in £4,000, get £1,000 free from the government. The property must cost £450,000 or less. If you withdraw for any other reason before 60, you pay a 25% penalty (which claws back more than just the bonus).",
      },
    ],
    relatedSlugs: ["compound-interest", "emergency-fund", "state-pension"],
  },
  {
    slug: "50-30-20-rule",
    title: "The 50/30/20 rule",
    summary: "Spend 50% on needs, 30% on wants, save 20%. A starting framework, not a strict law.",
    sections: [
      {
        heading: "The framework",
        body: "Popularised by Elizabeth Warren: allocate 50% of net income to needs (rent, food, utilities, transport, minimum debt payments), 30% to wants (eating out, entertainment, subscriptions, holidays), and 20% to savings and extra debt repayment.",
      },
      {
        heading: "Needs vs wants",
        body: "Needs are things you genuinely can't function without: housing, basic food, essential transport to work, utilities, insurance. Wants are upgrades: eating out instead of cooking, a gym membership, streaming services, new clothes beyond basics. The line is blurrier than it sounds — a car might be a need in a rural area and a want in London.",
      },
      {
        heading: "Adjusting for reality",
        body: "In cities with high rent, 50% for needs is often impossible — housing alone can hit 35–40% of take-home. That's fine; the rule is a starting framework. If needs take 60%, compress wants to 15% and keep savings at 25%. The savings percentage is the hardest number to compromise on.",
      },
      {
        heading: "The real insight",
        body: "The 50/30/20 rule isn't about perfect tracking — it's about making a deliberate allocation at the start of the month rather than spending freely and hoping there's something left. Even an imperfect plan beats no plan.",
      },
    ],
    relatedSlugs: ["emergency-fund", "pay-yourself-first", "compound-interest"],
    seeInApp: { label: "Apply a preset to your budget", path: "/payslip" },
  },
  {
    slug: "pay-yourself-first",
    title: "Pay yourself first",
    summary: "Move money to savings the day you're paid, before you spend anything.",
    sections: [
      {
        heading: "The idea",
        body: "Most people save whatever is left at the end of the month — which is usually nothing. Pay yourself first flips this: set up an automatic transfer to savings on the day your salary arrives, before you pay any discretionary spending. You budget with what remains.",
      },
      {
        heading: "How to implement it",
        body: "Set up a standing order or automatic savings rule on your salary date. Even £50–£100/month matters. Direct debit to a separate savings account (ideally one you can't easily see in your main banking app) works well — out of sight reduces the temptation to spend it.",
      },
      {
        heading: "Why it works",
        body: "Willpower is unreliable. Automatic saving removes the decision entirely. You adapt your spending to what's available — humans are remarkably good at living within their means when there's a hard limit. The opposite (manual saving at month end) almost always loses to unexpected expenses and lifestyle creep.",
      },
    ],
    relatedSlugs: ["50-30-20-rule", "compound-interest", "emergency-fund"],
    seeInApp: { label: "Set a savings goal", path: "/savings" },
  },
  {
    slug: "state-pension",
    title: "State Pension",
    summary: "A government pension you build through National Insurance contributions. Needs 35 years.",
    sections: [
      {
        heading: "How you earn it",
        body: "You build State Pension entitlement through National Insurance qualifying years. A qualifying year is any tax year in which you pay (or are credited with) NI contributions above the lower earnings limit. You need 35 qualifying years for the full new State Pension.",
      },
      {
        heading: "How much you get",
        body: "The full new State Pension is £221.20/week (2024/25) — roughly £11,500/year. This increases each year by at least 2.5% under the triple lock guarantee (the higher of inflation, average earnings growth, or 2.5%).",
      },
      {
        heading: "When you can claim it",
        body: "State Pension age is currently 66 for both men and women, rising to 67 between 2026–2028 and to 68 between 2044–2046. You can check your forecast at gov.uk/check-state-pension.",
      },
      {
        heading: "Gaps in your record",
        body: "If you have gaps (years unemployed, studying, or working abroad), you can usually fill them by paying voluntary NI contributions — sometimes very cost-effectively. Check your NI record at gov.uk to see your current qualifying years.",
      },
    ],
    relatedSlugs: ["national-insurance", "compound-interest", "isa-vs-savings-account"],
  },
  {
    slug: "auto-enrolment",
    title: "Workplace pension auto-enrolment",
    summary: "Your employer must enrol you and contribute to a pension on your behalf.",
    sections: [
      {
        heading: "What it is",
        body: "Since 2012, employers must automatically enrol eligible workers into a workplace pension scheme and make contributions. You're enrolled automatically — you have to actively opt out if you don't want to participate (which is almost always a mistake).",
      },
      {
        heading: "Minimum contributions",
        body: "Current minimum total contribution is 8% of qualifying earnings: at least 3% from your employer and 5% from you. Your 5% is effectively reduced by basic rate tax relief, so a 5% contribution only costs you 4% of your gross pay.",
      },
      {
        heading: "Employer match is free money",
        body: "If you opt out you lose your employer's contribution — that's an immediate 3% pay cut. Some employers match more than the minimum. Check your employer's scheme rules: if they match up to 5%, contributing 5% yourself doubles the rate of return before any investment growth.",
      },
      {
        heading: "What happens to the money",
        body: "Contributions are invested (typically in a diversified fund) and grow over time. On retirement you can take 25% as a tax-free lump sum; the rest is used to fund income in retirement, either through drawdown or an annuity.",
      },
    ],
    relatedSlugs: ["state-pension", "compound-interest", "isa-vs-savings-account"],
  },
  {
    slug: "credit-score",
    title: "Credit score",
    summary: "A number that tells lenders how likely you are to repay. Affects mortgages, loans, and some rentals.",
    sections: [
      {
        heading: "What affects your score",
        body: "Payment history is the biggest factor — even one missed payment stays on your record for six years. Credit utilisation (how much of your available credit you're using) is second — keep it under 30% if possible. Length of credit history, types of credit, and recent applications also matter.",
      },
      {
        heading: "Building credit from scratch",
        body: "Register to vote (electoral roll improves scores). Get a credit builder card or a SIM-only contract, pay it in full every month, never miss a payment. Having no credit history is almost as problematic as bad history — lenders can't assess risk.",
      },
      {
        heading: "UK credit reference agencies",
        body: "Experian, Equifax, and TransUnion each hold a file on you. Lenders may check one or more. Check your reports free via Experian, ClearScore (Equifax), or Credit Karma (TransUnion). Dispute any errors — incorrect defaults or wrong addresses can tank your score unfairly.",
      },
      {
        heading: "What it affects",
        body: "Mortgage eligibility and interest rate, rental applications (some landlords and letting agents check), car finance, personal loans, and some utilities. A good score saves meaningful money over a lifetime — the difference between a 2% and 4% mortgage on a £200,000 property is around £200/month.",
      },
    ],
    relatedSlugs: ["emergency-fund", "50-30-20-rule"],
  },
  {
    slug: "pound-cost-averaging",
    title: "Pound-cost averaging",
    summary: "Investing a fixed amount regularly smooths out market volatility over time.",
    sections: [
      {
        heading: "What it is",
        body: "Pound-cost averaging (PCA) means investing a fixed amount at regular intervals regardless of market conditions — e.g. £100 every month into an index fund. When prices are high you buy fewer units; when prices are low you buy more. Over time the average cost per unit is lower than the average price.",
      },
      {
        heading: "Why it reduces risk",
        body: "Trying to time the market — waiting for a crash to invest — fails for most investors because crashes are impossible to predict precisely. PCA removes the decision: you invest every month no matter what. Historically this has produced better outcomes than waiting for the 'right time'.",
      },
      {
        heading: "Practical application",
        body: "A Stocks and Shares ISA with a monthly direct debit into a low-cost global index fund is the most common UK implementation. Platforms like Vanguard, Fidelity, and InvestEngine offer low fees. Annual platform costs under 0.5% and fund charges under 0.2% are achievable.",
      },
      {
        heading: "It's not for emergency funds",
        body: "PCA is for money you won't need for at least 5 years. Don't invest your emergency fund — markets can fall 30–50% and stay down for years. Keep short-term money in cash savings; invest long-term money in diversified funds.",
      },
    ],
    relatedSlugs: ["compound-interest", "isa-vs-savings-account", "emergency-fund"],
  },
];

export function getConceptBySlug(slug: string): Concept | undefined {
  return CONCEPTS.find((c) => c.slug === slug);
}

export function getRelatedConcepts(slug: string): Concept[] {
  const concept = getConceptBySlug(slug);
  if (!concept) return [];
  return concept.relatedSlugs.map((s) => getConceptBySlug(s)).filter((c): c is Concept => c !== undefined);
}
