const calculatePayslip = require('../../src/services/hmrcCalculator');

describe('HMRC tax calculator (2024/25)', () => {
  it('returns the correct shape', () => {
    const result = calculatePayslip(30000);
    expect(result).toHaveProperty('taxPaid');
    expect(result).toHaveProperty('niPaid');
    expect(result).toHaveProperty('takeHomePay');
  });

  it('returns zero tax for income at personal allowance', () => {
    const { taxPaid } = calculatePayslip(12570);
    expect(taxPaid).toBe(0);
  });

  it('taxes income above personal allowance at 20%', () => {
    // taxable = 20000 - 12570 = 7430 @ 20% = 1486
    const { taxPaid } = calculatePayslip(20000);
    expect(taxPaid).toBeCloseTo(1486, 0);
  });

  it('returns zero NI for income at NI threshold', () => {
    const { niPaid } = calculatePayslip(12570);
    expect(niPaid).toBe(0);
  });

  it('charges NI at 8% above the threshold', () => {
    // NI = (30000 - 12570) * 0.08 = 1394.4
    const { niPaid } = calculatePayslip(30000);
    expect(niPaid).toBeCloseTo(1394.4, 1);
  });

  it('takeHomePay is always less than gross (for positive income)', () => {
    const { takeHomePay } = calculatePayslip(35000);
    expect(takeHomePay).toBeGreaterThan(0);
    expect(takeHomePay).toBeLessThan(35000);
  });

  it('takeHomePay for £30,000 is in a realistic range (£23k–£26k)', () => {
    const { takeHomePay } = calculatePayslip(30000);
    expect(takeHomePay).toBeGreaterThan(23000);
    expect(takeHomePay).toBeLessThan(26000);
  });

  it('handles zero gross salary', () => {
    const { taxPaid, niPaid, takeHomePay } = calculatePayslip(0);
    expect(taxPaid).toBe(0);
    expect(niPaid).toBe(0);
    expect(takeHomePay).toBe(0);
  });
});
