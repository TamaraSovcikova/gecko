import { describe, it, expect } from 'vitest';
import { monthlyRepayment, annualRepayment, projectLoan, compoundFutureValue } from './studentLoan';

describe('monthlyRepayment', () => {
  it('returns 0 for plan=none', () => {
    expect(monthlyRepayment(40000, 'none')).toBe(0);
  });

  it('returns 0 when gross is below the plan threshold', () => {
    expect(monthlyRepayment(20000, 'plan2')).toBe(0); // plan2 threshold = £27,295
  });

  it('returns a positive monthly repayment above threshold', () => {
    const r = monthlyRepayment(35000, 'plan2');
    expect(r).toBeGreaterThan(0);
  });

  it('Plan 2 repayment = 9% of income above £27,295 / 12', () => {
    const gross = 40000;
    const expected = ((gross - 27295) * 0.09) / 12;
    expect(monthlyRepayment(gross, 'plan2')).toBeCloseTo(expected, 1);
  });

  it('postgrad uses 6% rate', () => {
    const gross = 30000;
    const expected = ((gross - 21000) * 0.06) / 12;
    expect(monthlyRepayment(gross, 'postgrad')).toBeCloseTo(expected, 1);
  });
});

describe('annualRepayment', () => {
  it('equals monthlyRepayment * 12', () => {
    const gross = 45000;
    expect(annualRepayment(gross, 'plan1')).toBeCloseTo(monthlyRepayment(gross, 'plan1') * 12, 1);
  });
});

describe('projectLoan', () => {
  it('returns a projection object with the expected shape', () => {
    const result = projectLoan(35000, 'plan2', 30000);
    expect(result).toHaveProperty('monthlyRepayment');
    expect(result).toHaveProperty('yearsToPayOff');
  });

  it('clears a small balance faster than a large one', () => {
    const small = projectLoan(35000, 'plan2', 5000);
    const large = projectLoan(35000, 'plan2', 50000);
    expect(small.yearsToPayOff).toBeLessThan(large.yearsToPayOff ?? Infinity);
  });
});

describe('compoundFutureValue', () => {
  it('returns 0 for zero contributions', () => {
    expect(compoundFutureValue(0, 10)).toBe(0);
  });

  it('grows over time with a positive return rate', () => {
    const shortTerm = compoundFutureValue(200, 5);
    const longTerm = compoundFutureValue(200, 20);
    expect(longTerm).toBeGreaterThan(shortTerm);
  });
});
