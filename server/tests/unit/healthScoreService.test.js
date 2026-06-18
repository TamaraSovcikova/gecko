const { computeHealthScoreBreakdown } = require('../../src/services/healthScoreService');

describe('computeHealthScoreBreakdown', () => {
  it('returns hasEnoughData=false with no input', () => {
    const result = computeHealthScoreBreakdown({});
    expect(result.hasEnoughData).toBe(false);
    expect(result.healthScore).toBe(0);
    expect(result.factors).toHaveLength(0);
  });

  it('scores 100 when spending is zero and income > 0', () => {
    const result = computeHealthScoreBreakdown({
      takeHome: 24000,
      totalBudget: 2000,
      totalExpenses: 0,
      budgetAllocation: [{ name: 'Food', value: 400 }],
      actualSpending: [],
    });
    expect(result.hasEnoughData).toBe(true);
    expect(result.healthScore).toBeGreaterThan(80);
  });

  it('penalises heavy overspending against income', () => {
    const result = computeHealthScoreBreakdown({
      takeHome: 12000,
      totalBudget: 1000,
      totalExpenses: 2500,
      budgetAllocation: [{ name: 'Food', value: 1000 }],
      actualSpending: [{ name: 'Food', value: 2500 }],
    });
    expect(result.hasEnoughData).toBe(true);
    expect(result.healthScore).toBeLessThan(50);
  });

  it('returns three factors with correct keys', () => {
    const result = computeHealthScoreBreakdown({
      takeHome: 24000,
      totalBudget: 1500,
      totalExpenses: 1200,
      budgetAllocation: [{ name: 'Rent', value: 800 }, { name: 'Food', value: 400 }],
      actualSpending: [{ name: 'Rent', value: 800 }, { name: 'Food', value: 350 }],
    });
    const keys = result.factors.map((f) => f.key);
    expect(keys).toContain('spendingVsIncome');
    expect(keys).toContain('budgetAdherence');
    expect(keys).toContain('planAlignment');
  });

  it('clamps health score between 0 and 100', () => {
    const good = computeHealthScoreBreakdown({
      takeHome: 60000,
      totalBudget: 2000,
      totalExpenses: 500,
      budgetAllocation: [{ name: 'Food', value: 2000 }],
      actualSpending: [{ name: 'Food', value: 500 }],
    });
    expect(good.healthScore).toBeGreaterThanOrEqual(0);
    expect(good.healthScore).toBeLessThanOrEqual(100);
  });

  it('handles unplanned spending outside budget categories', () => {
    const result = computeHealthScoreBreakdown({
      takeHome: 24000,
      totalBudget: 1000,
      totalExpenses: 800,
      budgetAllocation: [{ name: 'Rent', value: 1000 }],
      actualSpending: [{ name: 'Gambling', value: 800 }],
    });
    const alignment = result.factors.find((f) => f.key === 'planAlignment');
    expect(alignment.score).toBeLessThan(30);
  });
});
