type NarrativeInput = {
  healthScore: number;
  takeHome: number;
  budgetLeft: number;
  totalBudget: number;
  actualSpending: { name: string; value: number }[];
  budgetAllocation: { name: string; value: number }[];
};

export function buildHealthNarrative(d: NarrativeInput): string | null {
  if (!d.takeHome || !d.budgetAllocation.length) return null;

  const sentences: string[] = [];
  const actualMap = new Map(d.actualSpending.map((s) => [s.name.toLowerCase(), s.value]));

  // Opening sentence
  if (d.healthScore >= 80) sentences.push("Your finances look strong this month.");
  else if (d.healthScore >= 60) sentences.push("Your finances are in reasonable shape.");
  else if (d.healthScore >= 40) sentences.push("A few areas need attention this month.");
  else sentences.push("This month's finances need some work.");

  // Biggest overspend
  const overspends = d.budgetAllocation
    .map((b) => ({ name: b.name, over: (actualMap.get(b.name.toLowerCase()) ?? 0) - b.value }))
    .filter((b) => b.over > 20)
    .sort((a, b) => b.over - a.over);

  if (overspends.length > 0) {
    const worst = overspends[0];
    const annual = Math.round(worst.over * 12);
    sentences.push(
      `You're £${worst.over.toFixed(0)} over on ${worst.name} - that compounds to £${annual.toLocaleString()} over a year if it continues.`
    );
  }

  // Housing as % of take-home (check all housing-like categories)
  const housingKeys = ["housing", "rent", "mortgage"];
  let housingSpend = 0;
  for (const [k, v] of actualMap) {
    if (housingKeys.some((h) => k.includes(h))) housingSpend += v;
  }
  const housingPct = d.takeHome > 0 ? (housingSpend / d.takeHome) * 100 : 0;
  if (housingPct > 33 && !overspends.find((o) => housingKeys.some((h) => o.name.toLowerCase().includes(h)))) {
    sentences.push(
      `Housing is ${housingPct.toFixed(0)}% of your take-home - above the 30% guideline most advisors recommend.`
    );
  }

  // Surplus
  const budgetLeftPct = d.takeHome > 0 ? (d.budgetLeft / d.takeHome) * 100 : 0;
  if (budgetLeftPct > 15 && overspends.length === 0) {
    sentences.push(
      `You have £${d.budgetLeft.toFixed(0)} unspent - worth putting toward savings or your emergency fund.`
    );
  } else if (d.budgetLeft < -50) {
    sentences.push(`Overall you're £${Math.abs(d.budgetLeft).toFixed(0)} over budget.`);
  }

  return sentences.slice(0, 3).join(" ");
}
