export type TakeHomeResult = {
  grossAnnual: number;
  takeHome: number;
  monthly: number;
  tax: number;
  ni: number;
  effectiveRate: number;
};

export function estimateUKTakeHome(grossAnnual: number): TakeHomeResult | null {
  if (!grossAnnual || grossAnnual <= 0) return null;
  const pa = 12570;
  const basicTop = 50270;
  const higherTop = 125140;
  const taxable = Math.max(0, grossAnnual - pa);
  const basic = Math.min(taxable, basicTop - pa) * 0.2;
  const higher = Math.min(Math.max(0, taxable - (basicTop - pa)), higherTop - basicTop) * 0.4;
  const additional = Math.max(0, taxable - (higherTop - pa)) * 0.45;
  const tax = basic + higher + additional;
  const niPrimary = Math.max(0, Math.min(grossAnnual, basicTop) - pa) * 0.08;
  const niSecondary = Math.max(0, grossAnnual - basicTop) * 0.02;
  const ni = niPrimary + niSecondary;
  const takeHome = grossAnnual - tax - ni;
  return {
    grossAnnual,
    monthly: takeHome / 12,
    tax,
    ni,
    takeHome,
    effectiveRate: ((tax + ni) / grossAnnual) * 100,
  };
}

export function fmt(n: number, decimals = 0): string {
  return n.toLocaleString("en-GB", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
