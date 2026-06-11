import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Info, CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ConceptLink } from "../../components/ConceptLink";
import { fmt } from "../../lib/ukTaxCalc";
import { pensionGapMonthly, compoundFutureValue } from "../../lib/studentLoan";
import { saveFinancialProfile } from "../../api/financialProfileApi";
import axios from "axios";

const YEARS_TO_RETIREMENT = 40;

function SliderInput({
  label,
  value,
  onChange,
  min = 0,
  max = 20,
  step = 0.5,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs font-semibold text-gray-700">{label}</label>
        <span className="text-sm font-bold text-gray-900">{value}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-purple-600"
      />
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>{min}%</span>
        <span>{max}%</span>
      </div>
    </div>
  );
}

export default function PensionPage() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [employeeContrib, setEmployeeContrib] = useState(3);
  const [employerMatch, setEmployerMatch] = useState(3);
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
          if (p.pensionSettings?.employeeContributionPct != null)
            setEmployeeContrib(p.pensionSettings.employeeContributionPct);
          if (p.pensionSettings?.employerMatchPct != null) setEmployerMatch(p.pensionSettings.employerMatchPct);
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
        { pensionSettings: { employerMatchPct: employerMatch, employeeContributionPct: employeeContrib } },
        token
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const grossAnnual = profile?.payslipData?.grossSalary ?? 0;
  const hasPayslip = grossAnnual > 0;
  const monthlyGross = grossAnnual / 12;

  const yourMonthlyPension = (monthlyGross * employeeContrib) / 100;
  const employerMonthlyActual = (monthlyGross * Math.min(employeeContrib, employerMatch)) / 100;
  const missedMonthly = pensionGapMonthly(grossAnnual, employeeContrib, employerMatch);
  const yourTotal = yourMonthlyPension + employerMonthlyActual;
  const potValue = compoundFutureValue(yourTotal, YEARS_TO_RETIREMENT);
  const potValueOptimized = compoundFutureValue(
    yourMonthlyPension + (monthlyGross * employerMatch) / 100,
    YEARS_TO_RETIREMENT
  );
  const missedPotValue = compoundFutureValue(missedMonthly, YEARS_TO_RETIREMENT);

  const isMaximized = employeeContrib >= employerMatch;

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
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Pension</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pension optimizer</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Your employer will match your pension contributions up to a limit. Contributing less than that limit means
            turning down part of your salary as free money. This tool shows exactly what that gap costs you over a
            career.
          </p>
        </motion.div>

        {/* Teaching banner */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex gap-3"
        >
          <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-emerald-800">Why this matters more than most things</p>
            <p className="text-xs text-emerald-700 leading-relaxed">
              <ConceptLink slug="compound-interest" className="text-[11px]">
                Compound growth
              </ConceptLink>{" "}
              means money invested in your 20s is worth far more at retirement than money invested in your 40s. Every
              month of missed employer match is gone permanently — it can't be made back later.
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
                Calculations use your gross salary.{" "}
                <Link to="/payslip" className="font-semibold underline">
                  Set up your payslip
                </Link>{" "}
                for accurate figures.
              </p>
            </div>
          </div>
        )}

        {/* Inputs */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white border border-gray-200 rounded-xl p-5 mb-4 space-y-5"
        >
          <h2 className="text-sm font-bold text-gray-900">Your pension setup</h2>
          <SliderInput label="Your contribution (employee)" value={employeeContrib} onChange={setEmployeeContrib} />
          <SliderInput label="Employer match limit" value={employerMatch} onChange={setEmployerMatch} />

          {hasPayslip && (
            <div className="pt-3 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[11px] text-gray-400 mb-1">Your contribution</p>
                <p className="text-sm font-bold text-gray-900">{fmt(yourMonthlyPension)}/mo</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 mb-1">Employer adds</p>
                <p className="text-sm font-bold text-gray-900">{fmt(employerMonthlyActual)}/mo</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 mb-1">Total going in</p>
                <p className="text-sm font-bold text-emerald-600">{fmt(yourTotal)}/mo</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Save */}
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
            "Save pension settings"
          )}
        </button>

        {/* Results */}
        <AnimatePresence>
          {hasPayslip && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Gap alert */}
              {!isMaximized && missedMonthly > 0 ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm font-bold text-red-800 mb-1">
                    You're leaving {fmt(missedMonthly)}/month unclaimed
                  </p>
                  <p className="text-xs text-red-700 leading-relaxed">
                    Your employer would match up to {employerMatch}% but you're only contributing {employeeContrib}%.
                    Raising your contribution to {employerMatch}% costs you {fmt(missedMonthly)}/month now but unlocks
                    an equal employer contribution — effectively doubling that slice of savings.
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-xs font-semibold text-emerald-800">
                    You're maximizing your employer match — great work.
                  </p>
                </div>
              )}

              {/* Compound projection */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Projected pension pot in {YEARS_TO_RETIREMENT} years (at 6% growth)
                </p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-[11px] text-gray-400 mb-1">Current setup</p>
                    <p className="text-xl font-bold text-gray-900">{fmt(potValue, 0)}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 text-center">
                    <p className="text-[11px] text-emerald-600 mb-1">Fully optimized</p>
                    <p className="text-xl font-bold text-emerald-700">{fmt(potValueOptimized, 0)}</p>
                  </div>
                </div>
                {missedPotValue > 1000 && !isMaximized && (
                  <p className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    The difference is <strong className="text-amber-800">{fmt(missedPotValue, 0)}</strong> — money that
                    compounds tax-free inside your pension rather than sitting unused.
                  </p>
                )}
              </div>

              {/* Learn more */}
              <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
                <div>
                  <p className="text-xs font-bold text-purple-900">Learn how pensions work</p>
                  <p className="text-xs text-purple-600">Auto-enrolment, contributions, and more</p>
                </div>
                <Link
                  to="/learn/paths/pensions-101"
                  className="flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 shrink-0"
                >
                  Pensions 101 <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* State pension note */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-700 mb-1">Don't forget the State Pension</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Your National Insurance contributions build entitlement to the{" "}
                  <ConceptLink slug="state-pension" className="text-[11px]">
                    State Pension
                  </ConceptLink>
                  . You need 35 qualifying years for the full amount (currently ~£221/week). Your workplace pension is
                  on top of this.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
