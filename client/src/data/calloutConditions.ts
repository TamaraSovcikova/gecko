export type CalloutVariant = "warning" | "tip" | "insight";

export type Callout = {
  id: string;
  variant: CalloutVariant;
  title: string;
  body: string;
  learnSlug?: string;
};

type DashInput = {
  healthScore: number;
  takeHome: number;
  budgetLeft: number;
  totalBudget: number;
  actualSpending: { name: string; value: number }[];
  budgetAllocation: { name: string; value: number }[];
};

export function evaluateCallouts(d: DashInput): Callout[] {
  if (!d.takeHome) return [];

  const callouts: Callout[] = [];
  const actualMap = new Map(d.actualSpending.map((s) => [s.name.toLowerCase(), s.value]));

  // Category overspend warnings (top 2 only)
  const overspends = d.budgetAllocation
    .map((b) => ({
      name: b.name,
      over: (actualMap.get(b.name.toLowerCase()) ?? 0) - b.value,
      budget: b.value,
    }))
    .filter((b) => b.over > 30)
    .sort((a, b) => b.over - a.over)
    .slice(0, 2);

  for (const o of overspends) {
    const annual = Math.round(o.over * 12);
    callouts.push({
      id: `overspend-${o.name.toLowerCase()}`,
      variant: "warning",
      title: `${o.name} over budget by £${o.over.toFixed(0)}`,
      body: `At this rate you'd overspend £${annual.toLocaleString()} on ${o.name} this year. Small cuts now have outsized annual impact.`,
      learnSlug: "50-30-20-rule",
    });
  }

  // Housing > 30% of take-home
  const housingKeys = ["housing", "rent", "mortgage"];
  let housingSpend = 0;
  for (const [k, v] of actualMap) {
    if (housingKeys.some((h) => k.includes(h))) housingSpend += v;
  }
  const housingPct = d.takeHome > 0 ? (housingSpend / d.takeHome) * 100 : 0;
  if (housingPct > 33 && overspends.length < 2) {
    callouts.push({
      id: "housing-pct",
      variant: "insight",
      title: `Housing is ${housingPct.toFixed(0)}% of take-home`,
      body: `The widely-cited guideline is 30% or under. Above that, it becomes harder to build savings or handle unexpected costs.`,
      learnSlug: "50-30-20-rule",
    });
  }

  // Zero savings
  const savingKeys = ["savings", "saving", "pension"];
  const hasSavingsCategory = d.budgetAllocation.some((b) => savingKeys.some((k) => b.name.toLowerCase().includes(k)));
  if (!hasSavingsCategory && d.takeHome > 0 && d.budgetLeft > 50) {
    callouts.push({
      id: "no-savings-category",
      variant: "tip",
      title: "No savings budget set",
      body: `You have £${d.budgetLeft.toFixed(0)} unallocated this month. Even £50/month invested at 5% grows to over £7,700 in 10 years.`,
      learnSlug: "compound-interest",
    });
  }

  // Large unspent budget
  const budgetLeftPct = d.takeHome > 0 ? (d.budgetLeft / d.takeHome) * 100 : 0;
  if (budgetLeftPct > 20 && overspends.length === 0 && hasSavingsCategory) {
    callouts.push({
      id: "large-surplus",
      variant: "insight",
      title: `£${d.budgetLeft.toFixed(0)} unspent this month`,
      body: `You're tracking well. Consider topping up your emergency fund or putting the surplus into a savings goal.`,
      learnSlug: "emergency-fund",
    });
  }

  // Return at most 2 most relevant callouts
  return callouts.slice(0, 2);
}
