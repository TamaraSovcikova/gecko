import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, PiggyBank, MapPin, CreditCard } from "lucide-react";
import { estimateUKTakeHome, fmt } from "../../lib/ukTaxCalc";
import { ConceptLink } from "../../components/ConceptLink";
import { cn } from "../../lib/utils";

// ---- Salary raise scenario ------------------------------------------------

function SalaryScenario() {
  const [current, setCurrent] = useState(28000);
  const [target, setTarget] = useState(35000);

  const cur = useMemo(() => estimateUKTakeHome(current), [current]);
  const tar = useMemo(() => estimateUKTakeHome(target), [target]);

  const monthlyDelta = tar && cur ? tar.monthly - cur.monthly : 0;
  const taxDelta = tar && cur ? tar.tax - cur.tax : 0;
  const effectiveDelta = tar && cur ? tar.effectiveRate - cur.effectiveRate : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-semibold text-gray-500 mb-1 block">Current salary (£/yr)</span>
          <input
            type="number"
            value={current}
            onChange={(e) => setCurrent(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-500 mb-1 block">New salary (£/yr)</span>
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
          />
        </label>
      </div>

      {cur && tar && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {/* Monthly take-home comparison */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-200">
              <p className="text-[10px] text-gray-400 font-semibold mb-1">Current take-home/mo</p>
              <p className="text-lg font-bold text-gray-700">£{fmt(cur.monthly)}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-200">
              <p className="text-[10px] text-emerald-600 font-semibold mb-1">Increase/mo</p>
              <p className="text-lg font-bold text-emerald-700">+£{fmt(monthlyDelta)}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-200">
              <p className="text-[10px] text-purple-600 font-semibold mb-1">New take-home/mo</p>
              <p className="text-lg font-bold text-purple-700">£{fmt(tar.monthly)}</p>
            </div>
          </div>

          {/* Tax impact */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
            <p className="font-bold text-amber-800 mb-1">Tax impact</p>
            <p className="text-amber-700 text-xs leading-relaxed">
              Extra tax: <strong>£{fmt(taxDelta)}/yr</strong> — your effective rate goes from{" "}
              <strong>{cur.effectiveRate.toFixed(1)}%</strong> to <strong>{tar.effectiveRate.toFixed(1)}%</strong> (
              {effectiveDelta >= 0 ? "+" : ""}
              {effectiveDelta.toFixed(1)}pp).{" "}
              {target > 50270 && current <= 50270
                ? "You'd cross into the 40% higher-rate band on earnings above £50,270 — you only pay 40% on the slice above that threshold, not your whole salary."
                : "You stay in the same tax band, so the marginal rate on the extra earnings stays the same."}
            </p>
            <p className="text-xs text-amber-600 mt-2">
              Learn more: <ConceptLink slug="income-tax-bands" /> · <ConceptLink slug="personal-allowance" />
            </p>
          </div>

          {/* What could you do with the extra? */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-700 mb-2">What £{fmt(monthlyDelta)}/mo extra could do</p>
            <ul className="space-y-1 text-xs text-gray-500">
              <li>• Fill a £{fmt(monthlyDelta * 6)} emergency fund in 6 months</li>
              <li>• Max your £20,000 ISA allowance in {Math.ceil(20000 / (monthlyDelta || 1))} months</li>
              <li>• Clear £{fmt(monthlyDelta * 12)}/yr of debt</li>
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ---- Savings rate scenario ------------------------------------------------

function SavingsScenario() {
  const [salary, setSalary] = useState(30000);
  const [rate, setRate] = useState(10);
  const [years, setYears] = useState(5);
  const [apy, setApy] = useState(4.5);

  const result = useMemo(() => {
    const est = estimateUKTakeHome(salary);
    if (!est) return null;
    const monthly = (est.monthly * rate) / 100;
    const annualRate = apy / 100;
    const months = years * 12;
    const mRate = annualRate / 12;
    const fv = monthly * ((Math.pow(1 + mRate, months) - 1) / mRate);
    const contributed = monthly * months;
    return { monthly, fv, contributed, interest: fv - contributed, takeHome: est.monthly };
  }, [salary, rate, years, apy]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-semibold text-gray-500 mb-1 block">Gross salary (£/yr)</span>
          <input
            type="number"
            value={salary}
            onChange={(e) => setSalary(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-500 mb-1 block">Savings rate (%)</span>
          <input
            type="range"
            min={1}
            max={50}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full mt-2"
          />
          <span className="text-sm font-bold text-purple-600">{rate}%</span>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-500 mb-1 block">Years</span>
          <input
            type="range"
            min={1}
            max={30}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full mt-2"
          />
          <span className="text-sm font-bold text-purple-600">{years} yr</span>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-500 mb-1 block">Interest rate (% APY)</span>
          <input
            type="number"
            step={0.1}
            value={apy}
            onChange={(e) => setApy(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
          />
        </label>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-200">
              <p className="text-[10px] text-gray-400 font-semibold mb-1">Monthly saved</p>
              <p className="text-lg font-bold text-gray-700">£{fmt(result.monthly)}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {rate}% of £{fmt(result.takeHome)}/mo
              </p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-200">
              <p className="text-[10px] text-emerald-600 font-semibold mb-1">Total after {years}yr</p>
              <p className="text-lg font-bold text-emerald-700">£{fmt(result.fv)}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-200">
              <p className="text-[10px] text-purple-600 font-semibold mb-1">Interest earned</p>
              <p className="text-lg font-bold text-purple-700">£{fmt(result.interest)}</p>
            </div>
          </div>

          {/* Compound interest callout */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-xs text-gray-500 leading-relaxed">
            <p>
              You contribute <strong>£{fmt(result.contributed)}</strong> yourself over {years} years. Compound interest
              adds another <strong>£{fmt(result.interest)}</strong> — that's{" "}
              <strong>{((result.interest / result.contributed) * 100).toFixed(0)}%</strong> extra for free.
            </p>
            <p className="mt-1.5">
              Learn more: <ConceptLink slug="compound-interest" /> · <ConceptLink slug="isa-vs-savings-account" />
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ---- Location move scenario -----------------------------------------------

type City = { name: string; rentSingle: number; rentShared: number; transportMonthly: number };
const CITIES: City[] = [
  { name: "London", rentSingle: 1800, rentShared: 900, transportMonthly: 180 },
  { name: "Manchester", rentSingle: 900, rentShared: 550, transportMonthly: 75 },
  { name: "Birmingham", rentSingle: 850, rentShared: 500, transportMonthly: 65 },
  { name: "Bristol", rentSingle: 1050, rentShared: 650, transportMonthly: 70 },
  { name: "Leeds", rentSingle: 850, rentShared: 500, transportMonthly: 65 },
  { name: "Edinburgh", rentSingle: 1000, rentShared: 600, transportMonthly: 60 },
  { name: "Liverpool", rentSingle: 750, rentShared: 450, transportMonthly: 60 },
  { name: "Guildford/Surrey", rentSingle: 1300, rentShared: 750, transportMonthly: 120 },
];

function LocationScenario() {
  const [salary, setSalary] = useState(30000);
  const [cityA, setCityA] = useState("Manchester");
  const [cityB, setCityB] = useState("London");
  const [shared, setShared] = useState(true);

  const est = useMemo(() => estimateUKTakeHome(salary), [salary]);

  const getCity = (name: string) => CITIES.find((c) => c.name === name)!;

  const compare = useMemo(() => {
    if (!est) return null;
    const a = getCity(cityA);
    const b = getCity(cityB);
    const rent = shared ? "rentShared" : "rentSingle";
    const costA = a[rent] + a.transportMonthly;
    const costB = b[rent] + b.transportMonthly;
    const disposableA = est.monthly - costA;
    const disposableB = est.monthly - costB;
    return { a, b, costA, costB, disposableA, disposableB, rent };
  }, [est, cityA, cityB, shared]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-semibold text-gray-500 mb-1 block">Gross salary (£/yr)</span>
          <input
            type="number"
            value={salary}
            onChange={(e) => setSalary(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
          />
        </label>
        <div className="flex items-end gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer pb-2">
            <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} className="rounded" />
            Shared house
          </label>
        </div>
        <label className="block">
          <span className="text-xs font-semibold text-gray-500 mb-1 block">City A</span>
          <select
            value={cityA}
            onChange={(e) => setCityA(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold focus:outline-none focus:border-purple-400 bg-white"
          >
            {CITIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-500 mb-1 block">City B</span>
          <select
            value={cityB}
            onChange={(e) => setCityB(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold focus:outline-none focus:border-purple-400 bg-white"
          >
            {CITIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {compare && est && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { city: compare.a, cost: compare.costA, disposable: compare.disposableA },
              { city: compare.b, cost: compare.costB, disposable: compare.disposableB },
            ].map(({ city, cost, disposable }, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-xl border p-4",
                  i === 0 ? "border-gray-200 bg-gray-50" : "border-purple-200 bg-purple-50"
                )}
              >
                <p className={cn("text-xs font-bold mb-2", i === 0 ? "text-gray-700" : "text-purple-700")}>
                  {city.name}
                </p>
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Rent ({shared ? "shared" : "own room"})</span>
                    <span className="font-semibold text-gray-700">
                      £{fmt(shared ? city.rentShared : city.rentSingle)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transport</span>
                    <span className="font-semibold text-gray-700">£{fmt(city.transportMonthly)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                    <span>Total fixed</span>
                    <span className="font-semibold text-gray-700">£{fmt(cost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Take-home</span>
                    <span className="font-semibold text-gray-700">£{fmt(est.monthly)}</span>
                  </div>
                  <div
                    className={cn(
                      "flex justify-between font-bold",
                      disposable < 0 ? "text-red-600" : i === 0 ? "text-gray-900" : "text-purple-700"
                    )}
                  >
                    <span>Disposable</span>
                    <span>£{fmt(disposable)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {compare.disposableB < compare.disposableA && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              {compare.b.name} leaves you <strong>£{fmt(compare.disposableA - compare.disposableB)}/mo less</strong>{" "}
              after housing and transport — equivalent to a{" "}
              <strong>£{fmt((compare.disposableA - compare.disposableB) * 12)}/yr pay cut</strong>. You would need a
              salary of roughly <strong>£{fmt(salary + (compare.costB - compare.costA) * 12 * 1.3)}</strong> in{" "}
              {compare.b.name} to match your {compare.a.name} lifestyle.
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ---- Debt payoff scenario ------------------------------------------------

function DebtScenario() {
  const [balance, setBalance] = useState(5000);
  const [apr, setApr] = useState(24.9);
  const [payment, setPayment] = useState(200);

  const result = useMemo(() => {
    if (!balance || !apr || !payment) return null;
    const mRate = apr / 100 / 12;
    if (payment <= balance * mRate) return { months: Infinity, totalInterest: Infinity };
    let rem = balance;
    let months = 0;
    let totalInterest = 0;
    while (rem > 0 && months < 1200) {
      const interest = rem * mRate;
      totalInterest += interest;
      rem = rem + interest - payment;
      months++;
    }
    return { months, totalInterest };
  }, [balance, apr, payment]);

  const minPayment = useMemo(() => {
    const mRate = apr / 100 / 12;
    return Math.ceil(balance * mRate + 1);
  }, [balance, apr]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-semibold text-gray-500 mb-1 block">Debt balance (£)</span>
          <input
            type="number"
            value={balance}
            onChange={(e) => setBalance(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-500 mb-1 block">APR (%)</span>
          <input
            type="number"
            step={0.1}
            value={apr}
            onChange={(e) => setApr(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
          />
        </label>
        <label className="block col-span-2">
          <span className="text-xs font-semibold text-gray-500 mb-1 block">
            Monthly payment (£) — minimum to clear: £{minPayment}
          </span>
          <input
            type="range"
            min={minPayment}
            max={Math.max(balance, payment * 3)}
            value={payment}
            onChange={(e) => setPayment(Number(e.target.value))}
            className="w-full mt-1"
          />
          <span className="text-sm font-bold text-purple-600">£{fmt(payment)}/mo</span>
        </label>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {result.months === Infinity ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 font-semibold">
              Payment too low — interest exceeds your repayment. Increase monthly payment above £{minPayment}.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-200">
                  <p className="text-[10px] text-gray-400 font-semibold mb-1">Clear in</p>
                  <p className="text-lg font-bold text-gray-700">
                    {result.months >= 12
                      ? `${Math.floor(result.months / 12)}yr ${result.months % 12}mo`
                      : `${result.months} mo`}
                  </p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center border border-red-200">
                  <p className="text-[10px] text-red-500 font-semibold mb-1">Total interest</p>
                  <p className="text-lg font-bold text-red-600">£{fmt(result.totalInterest)}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-200">
                  <p className="text-[10px] text-emerald-600 font-semibold mb-1">Total paid</p>
                  <p className="text-lg font-bold text-emerald-700">£{fmt(balance + result.totalInterest)}</p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 text-xs text-gray-500 leading-relaxed">
                <p>
                  Paying £{fmt(payment)}/mo, you&apos;ll hand the lender <strong>£{fmt(result.totalInterest)}</strong>{" "}
                  in interest — that&apos;s <strong>{((result.totalInterest / balance) * 100).toFixed(0)}%</strong> of
                  the original balance. Doubling your payment to £{fmt(payment * 2)}/mo would roughly halve the
                  repayment period.
                </p>
                <p className="mt-1.5">
                  Learn more: <ConceptLink slug="credit-score" /> · <ConceptLink slug="emergency-fund" />
                </p>
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ---- Scenario tabs -------------------------------------------------------

type ScenarioId = "salary" | "savings" | "location" | "debt";

const SCENARIOS: {
  id: ScenarioId;
  label: string;
  icon: React.ReactNode;
  color: string;
  border: string;
  bg: string;
  description: string;
}[] = [
  {
    id: "salary",
    label: "Salary raise",
    icon: <TrendingUp className="w-4 h-4" />,
    color: "text-purple-700",
    border: "border-purple-300",
    bg: "bg-purple-50",
    description: "See how a pay rise changes your take-home after tax and NI.",
  },
  {
    id: "savings",
    label: "Savings rate",
    icon: <PiggyBank className="w-4 h-4" />,
    color: "text-emerald-700",
    border: "border-emerald-300",
    bg: "bg-emerald-50",
    description: "Compound interest in action — what saving consistently builds over time.",
  },
  {
    id: "location",
    label: "City move",
    icon: <MapPin className="w-4 h-4" />,
    color: "text-blue-700",
    border: "border-blue-300",
    bg: "bg-blue-50",
    description: "Compare disposable income in two UK cities after rent and transport.",
  },
  {
    id: "debt",
    label: "Debt payoff",
    icon: <CreditCard className="w-4 h-4" />,
    color: "text-amber-700",
    border: "border-amber-300",
    bg: "bg-amber-50",
    description: "How long to clear a balance, and how much interest you&apos;ll pay.",
  },
];

export default function ScenariosPage() {
  const [active, setActive] = useState<ScenarioId>("salary");
  const scenario = SCENARIOS.find((s) => s.id === active)!;

  return (
    <div className="app-page">
      <div className="max-w-2xl mx-auto pb-12">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">What-if tool</p>
          <h1 className="text-2xl font-bold text-gray-900">Scenarios</h1>
          <p className="text-sm text-gray-400 mt-1">
            Adjust the numbers and see real-time impact. All figures use UK 2024/25 tax rates.
          </p>
        </div>

        {/* Scenario selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(s.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all",
                active === s.id
                  ? `${s.bg} ${s.border} ${s.color} shadow-sm`
                  : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
              )}
            >
              {s.icon}
              <span className="text-xs font-bold">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Active scenario */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm"
          >
            <div
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-3 border",
                scenario.bg,
                scenario.border,
                scenario.color
              )}
            >
              {scenario.icon} {scenario.label}
            </div>
            <p className="text-xs text-gray-400 mb-5 leading-relaxed">{scenario.description}</p>

            {active === "salary" && <SalaryScenario />}
            {active === "savings" && <SavingsScenario />}
            {active === "location" && <LocationScenario />}
            {active === "debt" && <DebtScenario />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
