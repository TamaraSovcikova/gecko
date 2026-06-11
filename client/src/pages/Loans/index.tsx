import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, ArrowRight, Info, TrendingDown, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ConceptLink } from "../../components/ConceptLink";
import { cn } from "../../lib/utils";
import { fmt } from "../../lib/ukTaxCalc";
import { LOAN_PLANS, type LoanPlan, monthlyRepayment, projectLoan } from "../../lib/studentLoan";
import { saveFinancialProfile } from "../../api/financialProfileApi";
import axios from "axios";

const PLAN_OPTIONS: { value: LoanPlan; label: string; description: string }[] = [
  { value: "plan2", label: "Plan 2", description: "Started uni 2012-2023 (England and Wales)" },
  { value: "plan5", label: "Plan 5", description: "Started uni from 2023 (England and Wales)" },
  { value: "plan1", label: "Plan 1", description: "Started uni before 2012" },
  { value: "plan4", label: "Plan 4", description: "Scotland" },
  { value: "postgrad", label: "Postgraduate", description: "Masters or PhD loan" },
  { value: "none", label: "No loan", description: "Loan fully paid or never had one" },
];

export default function LoansPage() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<LoanPlan>("none");
  const [balance, setBalance] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    currentUser.getIdToken().then((token) => {
      axios
        .get(`${import.meta.env.VITE_API_URL}/api/v1/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const p = res.data;
          setProfile(p);
          if (p.studentLoan?.plan) setPlan(p.studentLoan.plan);
          if (p.studentLoan?.balance) setBalance(String(p.studentLoan.balance));
        })
        .finally(() => setLoading(false));
    });
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const token = await currentUser.getIdToken();
      await saveFinancialProfile(
        {
          studentLoan: {
            plan,
            balance: balance ? Number(balance) : null,
          },
        },
        token
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // silent - data still shown locally
    } finally {
      setSaving(false);
    }
  };

  const grossAnnual = profile?.payslipData?.grossSalary ?? 0;
  const balanceNum = balance ? Number(balance) : null;
  const projection = plan !== "none" ? projectLoan(grossAnnual, plan, balanceNum) : null;
  const monthly = plan !== "none" ? monthlyRepayment(grossAnnual, plan) : 0;
  const planConfig = plan !== "none" ? LOAN_PLANS[plan] : null;
  const hasPayslip = grossAnnual > 0;

  if (loading) {
    return (
      <div className="app-page">
        <div className="max-w-2xl mx-auto space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="app-page">
      <div className="max-w-2xl mx-auto pb-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Student Loan</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your student loan</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Your repayments are collected automatically through{" "}
            <ConceptLink slug="payslip-basics">the payroll system</ConceptLink>, like tax and NI — you never choose to
            make a payment. This tool shows you how much is leaving your pay and whether you'll ever clear the balance.
          </p>
        </motion.div>

        {/* Teaching banner */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex gap-3"
        >
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-blue-800">Student loans are not like other debt</p>
            <p className="text-xs text-blue-700 leading-relaxed">
              You only repay what you earn above your plan's threshold. If you earn below it, you repay nothing. After
              30 or 40 years, any remaining balance is written off — so many graduates never fully clear their loan, and
              that's intentional design, not failure.
            </p>
          </div>
        </motion.div>

        {/* No payslip warning */}
        {!hasPayslip && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-800 mb-1">Set up your payslip first</p>
              <p className="text-xs text-amber-700">
                Repayment calculations depend on your salary.{" "}
                <Link to="/payslip" className="font-semibold underline">
                  Set up your payslip
                </Link>{" "}
                to see accurate projections.
              </p>
            </div>
          </div>
        )}

        {/* Plan selector */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white border border-gray-200 rounded-xl p-5 mb-4"
        >
          <h2 className="text-sm font-bold text-gray-900 mb-1">Which plan are you on?</h2>
          <p className="text-xs text-gray-400 mb-4">
            Check your student finance or payslip — it shows as "Student Loan Plan 2" etc.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PLAN_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPlan(opt.value)}
                className={cn(
                  "text-left px-3 py-2.5 rounded-lg border text-xs transition-all",
                  plan === opt.value
                    ? "border-purple-400 bg-purple-50 text-purple-900"
                    : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                <p className="font-semibold">{opt.label}</p>
                <p className="text-gray-400 mt-0.5">{opt.description}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Balance input */}
        <AnimatePresence>
          {plan !== "none" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
                <h2 className="text-sm font-bold text-gray-900 mb-1">Approximate balance (optional)</h2>
                <p className="text-xs text-gray-400 mb-3">
                  Check the Student Loans Company portal or your P60. Leave blank for a threshold-only calculation.
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                    £
                  </span>
                  <input
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    placeholder="e.g. 45000"
                    className="w-full pl-7 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                  />
                </div>
                {planConfig && (
                  <p className="text-[11px] text-gray-400 mt-2">
                    Interest: {planConfig.interestNote}. Written off after {planConfig.writeOffYears} years.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save button */}
        {plan !== "none" && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl mb-6 transition-colors flex items-center justify-center gap-2"
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Saved
              </>
            ) : saving ? (
              "Saving..."
            ) : (
              "Save loan settings"
            )}
          </button>
        )}

        {/* Projection */}
        <AnimatePresence>
          {plan !== "none" && hasPayslip && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Monthly repayment highlight */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Your repayments (at £{grossAnnual.toLocaleString()} gross)
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{fmt(monthly)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">per month</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{fmt(monthly * 12)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">per year</p>
                  </div>
                </div>
                {monthly === 0 && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mt-3">
                    Your salary is below the {planConfig?.label} threshold of {fmt(planConfig?.threshold ?? 0, 0)}/year
                    — no repayments until you earn above this.
                  </p>
                )}
              </div>

              {/* Projection (needs balance) */}
              {projection && balanceNum ? (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingDown className="w-4 h-4 text-gray-500" />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">30/40-year outlook</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-600">Starting balance</p>
                      <p className="text-xs font-semibold text-gray-900">{fmt(balanceNum, 0)}</p>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-600">Total you'll repay</p>
                      <p className="text-xs font-semibold text-gray-900">{fmt(projection.totalRepaid, 0)}</p>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <p className="text-xs text-gray-600">Outcome</p>
                      <p
                        className={cn(
                          "text-xs font-bold",
                          projection.willWriteOff ? "text-blue-600" : "text-emerald-600"
                        )}
                      >
                        {projection.willWriteOff
                          ? `Written off after ${planConfig?.writeOffYears} years`
                          : `Cleared in ${projection.yearsToPayOff} years`}
                      </p>
                    </div>
                  </div>
                  {projection.willWriteOff && projection.writeOffBalance && (
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
                      <p className="text-[11px] text-blue-700 leading-relaxed">
                        At your current salary, roughly <strong>{fmt(projection.writeOffBalance, 0)}</strong> would be
                        written off when the loan expires. This is not unusual — the write-off is part of how the system
                        was designed for lower-earning graduates.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                balanceNum === null && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500">Enter your balance above to see a full payoff projection.</p>
                  </div>
                )
              )}

              {/* Threshold context */}
              {planConfig && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <p className="text-xs font-bold text-gray-700 mb-2">How the threshold works</p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    You repay {(planConfig.rate * 100).toFixed(0)}% of everything you earn above{" "}
                    {fmt(planConfig.threshold, 0)}/year. If your salary rises to {fmt(grossAnnual * 1.2, 0)}, your
                    repayments rise proportionally — but so does your take-home. The loan never feels more affordable
                    than when you're earning well.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ConceptLink slug="income-tax" className="text-[11px]" />
                    <ConceptLink slug="national-insurance" className="text-[11px]" />
                  </div>
                </div>
              )}

              {/* Cross-link to scenarios */}
              <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
                <div>
                  <p className="text-xs font-bold text-purple-900">See how a salary change affects this</p>
                  <p className="text-xs text-purple-600">Model different salaries in Scenarios</p>
                </div>
                <Link
                  to="/scenarios"
                  className="flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 shrink-0"
                >
                  Scenarios <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {plan === "none" && !loading && (
          <div className="text-center py-10">
            <GraduationCap className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Select your loan plan above to see your repayments.</p>
          </div>
        )}
      </div>
    </div>
  );
}
