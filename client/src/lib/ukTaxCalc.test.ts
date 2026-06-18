import { describe, it, expect } from 'vitest';
import { estimateUKTakeHome, fmt } from './ukTaxCalc';

describe('estimateUKTakeHome', () => {
  it('returns null for zero or negative income', () => {
    expect(estimateUKTakeHome(0)).toBeNull();
    expect(estimateUKTakeHome(-10000)).toBeNull();
  });

  it('returns the correct shape', () => {
    const result = estimateUKTakeHome(30000);
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('grossAnnual');
    expect(result).toHaveProperty('takeHome');
    expect(result).toHaveProperty('monthly');
    expect(result).toHaveProperty('tax');
    expect(result).toHaveProperty('ni');
    expect(result).toHaveProperty('effectiveRate');
  });

  it('charges no income tax at or below the personal allowance', () => {
    const result = estimateUKTakeHome(12570)!;
    expect(result.tax).toBe(0);
  });

  it('charges 20% on income in the basic rate band', () => {
    // £20,000: taxable = 7430 @ 20% = 1486
    const result = estimateUKTakeHome(20000)!;
    expect(result.tax).toBeCloseTo(1486, 0);
  });

  it('charges 40% on income above £50,270', () => {
    const result = estimateUKTakeHome(60000)!;
    expect(result.tax).toBeGreaterThan(7540);
  });

  it('takeHome is gross minus tax minus NI', () => {
    const r = estimateUKTakeHome(35000)!;
    expect(r.takeHome).toBeCloseTo(r.grossAnnual - r.tax - r.ni, 1);
  });

  it('monthly is takeHome / 12', () => {
    const r = estimateUKTakeHome(35000)!;
    expect(r.monthly).toBeCloseTo(r.takeHome / 12, 2);
  });

  it('effectiveRate is (tax + ni) / gross * 100', () => {
    const r = estimateUKTakeHome(35000)!;
    expect(r.effectiveRate).toBeCloseTo(((r.tax + r.ni) / r.grossAnnual) * 100, 2);
  });

  it('returns realistic take-home for £30,000 (£23k–£26k)', () => {
    const r = estimateUKTakeHome(30000)!;
    expect(r.takeHome).toBeGreaterThan(23000);
    expect(r.takeHome).toBeLessThan(26000);
  });
});

describe('fmt', () => {
  it('formats numbers with GB locale separators', () => {
    expect(fmt(1000)).toBe('1,000');
    expect(fmt(1234567)).toBe('1,234,567');
  });

  it('respects the decimals argument', () => {
    expect(fmt(1234.5, 2)).toBe('1,234.50');
  });
});
