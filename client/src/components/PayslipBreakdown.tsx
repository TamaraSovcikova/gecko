import React from "react";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";

export type PayslipCategory = {
  name?: string;
  amount?: number;
  budget?: number;
};

export type PayslipResult = {
  grossSalary?: number;
  taxPaid?: number;
  niPaid?: number;
  takeHomePay?: number;
  categories?: PayslipCategory[];
};

type Props = {
  result: PayslipResult | null;
  onContinue: () => void;
};

const PayslipBreakdown: React.FC<Props> = ({ result, onContinue }) => {
  if (!result) return null;

  const gross = Number(result.grossSalary || 0);
  const tax = Number(result.taxPaid || 0);
  const ni = Number(result.niPaid || 0);
  const takeHome = Number(result.takeHomePay || 0);
  const monthlyTakeHome = takeHome / 12;

  const fmt = (n: number) => "£" + n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-4" data-onboarding="payslip-breakdown">
      {/* Monthly take-home highlight */}
      <div className="flex items-center gap-3 p-4 bg-purple-600 rounded-xl">
        <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-xs text-purple-200 font-semibold uppercase tracking-wider">Monthly take-home</p>
          <p className="text-xl font-bold text-white">{fmt(monthlyTakeHome)}</p>
        </div>
      </div>

      {/* KPI breakdown */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Gross (annual)", value: fmt(gross), sub: null },
          { label: "Take home (annual)", value: fmt(takeHome), sub: null, accent: true },
          { label: "Income Tax", value: fmt(tax), sub: null },
          { label: "National Insurance", value: fmt(ni), sub: null },
        ].map(({ label, value, accent }) => (
          <div
            key={label}
            className={
              accent ? "p-3 rounded-lg bg-gray-900 text-white" : "p-3 rounded-lg bg-gray-50 border border-gray-100"
            }
          >
            <p className={`text-xs font-medium mb-0.5 ${accent ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
            <p className={`text-sm font-bold ${accent ? "text-white" : "text-gray-900"}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Category allocation */}
      {Array.isArray(result.categories) && result.categories.length > 0 && (
        <div data-onboarding="breakdown-categories">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Category allocation</p>
          <div className="space-y-2">
            {result.categories.map((category, index) => {
              const amount = Number(category.amount ?? category.budget ?? 0);
              const pct = takeHome > 0 ? Math.min((amount / takeHome) * 100, 100) : 0;
              return (
                <div key={`${category.name || "cat"}-${index}`} className="flex items-center gap-3">
                  <span className="w-28 text-xs text-gray-600 font-medium truncate shrink-0">{category.name}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 tabular-nums w-16 text-right shrink-0">
                    {fmt(amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Button variant="primary" className="w-full" onClick={onContinue}>
        Continue to dashboard
        <ArrowRight className="w-4 h-4 ml-1.5" />
      </Button>
    </div>
  );
};

export default PayslipBreakdown;
