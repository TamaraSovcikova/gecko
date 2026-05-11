const clamp = (value, min = 0, max = 100) => {
  return Math.max(min, Math.min(max, value));
};

const toCurrency = (value) => Number((value || 0).toFixed(2));

const FACTOR_DEFINITIONS = {
  spendingVsIncome: {
    key: "spendingVsIncome",
    title: "Spending vs income",
    weight: 40,
    positiveText: "Your spending is under control compared with your monthly take-home pay.",
    negativeText: "Your spending is high compared with your monthly take-home pay.",
    neutralText: "Spending and income are currently balanced.",
  },
  budgetAdherence: {
    key: "budgetAdherence",
    title: "Budget adherence",
    weight: 35,
    positiveText: "Most categories are staying within their planned limits.",
    negativeText: "Several categories are running over their planned limits.",
    neutralText: "Some categories are close to their limits.",
  },
  planAlignment: {
    key: "planAlignment",
    title: "Plan alignment",
    weight: 25,
    positiveText: "Most of your spending is in categories you planned for.",
    negativeText: "A lot of spending is happening outside your planned categories.",
    neutralText: "Some spending is in planned categories, some is outside your plan.",
  },
};

const getImpactLabel = (normalizedScore) => {
  if (normalizedScore >= 67) return "helping";
  if (normalizedScore <= 33) return "lowering";
  return "neutral";
};

const getImpactExplanation = (factor, normalizedScore) => {
  if (normalizedScore >= 67) return factor.positiveText;
  if (normalizedScore <= 33) return factor.negativeText;
  return factor.neutralText;
};

const buildFactor = ({ definition, normalizedScore, valueLabel }) => {
  const impact = getImpactLabel(normalizedScore);
  return {
    key: definition.key,
    title: definition.title,
    weight: definition.weight,
    score: Math.round(normalizedScore),
    contribution: Number(((normalizedScore * definition.weight) / 100).toFixed(1)),
    impact,
    valueLabel,
    explanation: getImpactExplanation(definition, normalizedScore),
  };
};

const computeHealthScoreBreakdown = ({
  takeHome,
  totalBudget,
  totalExpenses,
  budgetAllocation,
  actualSpending,
}) => {
  const annualIncome = Math.max(0, Number(takeHome || 0));
  const monthlyIncome = annualIncome > 0 ? annualIncome / 12 : 0;
  const budget = Math.max(0, Number(totalBudget || 0));
  const expenses = Math.max(0, Number(totalExpenses || 0));
  const plannedCategories = Array.isArray(budgetAllocation) ? budgetAllocation : [];
  const actualCategories = Array.isArray(actualSpending) ? actualSpending : [];

  const hasEnoughData = monthlyIncome > 0 || budget > 0 || expenses > 0;
  if (!hasEnoughData) {
    return {
      healthScore: 0,
      hasEnoughData: false,
      summary: "Not enough data yet to generate a detailed health score breakdown.",
      factors: [],
    };
  }

  const spendingRatio = monthlyIncome > 0 ? expenses / monthlyIncome : null;
  const spendingScore = spendingRatio === null
    ? 50
    : spendingRatio <= 1
      ? 100
      : clamp(100 - (spendingRatio - 1) * 100);

  const plannedMap = new Map(
    plannedCategories.map((item) => [String(item.name || "").toLowerCase(), Number(item.value || 0)])
  );
  const actualMap = new Map(
    actualCategories.map((item) => [String(item.name || "").toLowerCase(), Number(item.value || 0)])
  );

  const categoryKeys = new Set([...plannedMap.keys(), ...actualMap.keys()]);
  let adherencePenalty = 0;

  categoryKeys.forEach((key) => {
    const planned = Math.max(0, plannedMap.get(key) || 0);
    const actual = Math.max(0, actualMap.get(key) || 0);

    if (planned > 0 && actual > planned) {
      adherencePenalty += (actual - planned) / planned;
    } else if (planned === 0 && actual > 0) {
      adherencePenalty += 1;
    }
  });

  const budgetAdherenceScore = clamp(100 - adherencePenalty * 25);

  const alignedSpend = actualCategories.reduce((sum, item) => {
    const key = String(item.name || "").toLowerCase();
    if (plannedMap.has(key)) {
      return sum + Math.max(0, Number(item.value || 0));
    }
    return sum;
  }, 0);
  const alignmentRatio = expenses > 0 ? alignedSpend / expenses : 0;
  const planAlignmentScore = expenses > 0 ? clamp(alignmentRatio * 100) : 50;

  const factors = [
    buildFactor({
      definition: FACTOR_DEFINITIONS.spendingVsIncome,
      normalizedScore: spendingScore,
      valueLabel: monthlyIncome > 0
        ? `Spent GBP ${toCurrency(expenses)} of GBP ${toCurrency(monthlyIncome)} income`
        : `Spent GBP ${toCurrency(expenses)} this month`,
    }),
    buildFactor({
      definition: FACTOR_DEFINITIONS.budgetAdherence,
      normalizedScore: budgetAdherenceScore,
      valueLabel: `${categoryKeys.size} tracked categories compared against your plan`,
    }),
    buildFactor({
      definition: FACTOR_DEFINITIONS.planAlignment,
      normalizedScore: planAlignmentScore,
      valueLabel: expenses > 0
        ? `${Math.round(alignmentRatio * 100)}% of spending is in planned categories`
        : "No spending yet to assess plan alignment",
    }),
  ];

  const weightedScore = factors.reduce((sum, factor) => sum + factor.contribution, 0);
  const healthScore = Math.round(clamp(weightedScore));

  return {
    healthScore,
    hasEnoughData: true,
    summary: "Your health score combines spending vs income, budget adherence, and plan alignment.",
    factors,
  };
};

module.exports = {
  computeHealthScoreBreakdown,
};
