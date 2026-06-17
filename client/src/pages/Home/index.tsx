import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  TrendingUp,
  BookOpen,
  Target,
  PiggyBank,
  BarChart3,
  Zap,
  CheckCircle,
  Shield,
  Award,
  GraduationCap,
  Sparkles,
} from "lucide-react";

const FEATURES = [
  {
    icon: BarChart3,
    title: "Budget Dashboard",
    desc: "Category breakdowns, health scores, and spending bars that show exactly where your money goes.",
  },
  {
    icon: TrendingUp,
    title: "Spend Forecasting",
    desc: "Ensemble model predicts next month so you can act before you overspend.",
  },
  {
    icon: GraduationCap,
    title: "Student Loan Tracker",
    desc: "See your exact monthly repayments, when you'll clear the balance, and what gets written off.",
  },
  {
    icon: Sparkles,
    title: "Pension Optimizer",
    desc: "Model employer match scenarios and see the 40-year compound difference of contributing more now.",
  },
  {
    icon: PiggyBank,
    title: "Savings Goals",
    desc: "Set targets, log contributions, and watch your progress month by month.",
  },
  {
    icon: BookOpen,
    title: "Financial Learning",
    desc: "Structured modules on payslips, tax, NI, pensions, and budgeting - UK-specific.",
  },
  {
    icon: Target,
    title: "AI Finance Chat",
    desc: "Ask questions about your actual data. No generic advice, just your numbers.",
  },
  {
    icon: Zap,
    title: "Receipt OCR",
    desc: "Photograph a receipt and the expense logs itself. No manual entry required.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Enter your payslip",
    desc: "Put in your gross salary and location. Gecko calculates take-home pay and builds your budget automatically - no guesswork.",
  },
  {
    n: "02",
    title: "Log expenses as they happen",
    desc: "Quick-add from the dashboard, or scan a receipt with your camera. Bills and recurring payments are detected for you.",
  },
  {
    n: "03",
    title: "Track, learn, and improve",
    desc: "Your health score, forecasts, and personalised market tips update in real time as your data grows over months.",
  },
];

const TRUST_ITEMS = [
  { icon: Shield, label: "Firebase Auth" },
  { icon: Award, label: "UK Tax Accurate" },
  { icon: CheckCircle, label: "GDPR Compliant" },
];

const FadeUp = ({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const Home = () => {
  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ fontFamily: "Manrope, Segoe UI, Arial, sans-serif", color: "#111827", background: "#fff" }}
    >
      {/* Sticky nav */}
      <header
        className="sticky top-0 z-40 w-full border-b border-white/10 backdrop-blur-md"
        style={{ background: "rgba(10,10,15,0.96)" }}
      >
        <div className="max-w-screen-xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 no-underline shrink-0">
            <img src="/gecko-transparent.png?v=3" alt="Gecko logo" className="w-9 h-9 object-contain" />
            <span className="text-base font-bold text-white tracking-wide">Gecko</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-8">
            {[
              ["Features", "#features"],
              ["How it works", "#how-it-works"],
              ["About", "#about"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="text-sm text-gray-400 hover:text-white transition-colors no-underline"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-gray-300 hover:text-white transition-colors no-underline hidden sm:block"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors no-underline"
            >
              Get started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative min-h-[92vh] flex items-center" style={{ background: "#0A0A0F" }}>
          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(#7C3AED 1px, transparent 1px), linear-gradient(to right, #7C3AED 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />
          {/* Ambient glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-15 pointer-events-none"
            style={{ background: "radial-gradient(ellipse, #7C3AED 0%, transparent 70%)" }}
          />

          <div className="relative z-10 w-full max-w-screen-xl mx-auto px-5 py-28">
            <FadeUp>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-700/50 bg-purple-900/30 text-purple-300 text-xs font-semibold tracking-widest uppercase mb-7">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                Built for first-job confidence
              </span>
            </FadeUp>

            <FadeUp delay={0.05}>
              <h1
                className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight mb-6"
                style={{ lineHeight: 1.06, maxWidth: "18ch" }}
              >
                Master your money from day one.
              </h1>
            </FadeUp>

            <FadeUp delay={0.1}>
              <p className="text-lg text-gray-400 leading-relaxed mb-9" style={{ maxWidth: "50ch" }}>
                Gecko turns your payslip into a budget, your spending into insights, and financial concepts into
                practical skills - all in one place built for young adults entering work.
              </p>
            </FadeUp>

            <FadeUp delay={0.15} className="flex flex-wrap items-center gap-4 mb-16">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors no-underline text-sm shadow-lg"
                style={{ boxShadow: "0 8px 24px rgba(124,58,237,0.35)" }}
              >
                Create free account <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-gray-300 hover:text-white font-semibold rounded-lg transition-colors no-underline text-sm border border-white/10 hover:border-white/20"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                See features
              </a>
            </FadeUp>

            {/* Stats bar */}
            <FadeUp delay={0.2}>
              <div
                className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10 border border-white/10 rounded-xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                {[
                  { value: "61%", label: "of young adults struggle to budget in their first year of work" },
                  { value: "£6k", label: "average gap between gross and net pay that surprises first-jobbers" },
                  { value: "Free", label: "entirely free to use - no credit card, no subscription needed" },
                ].map(({ value, label }) => (
                  <div key={value} className="px-6 py-5">
                    <p className="text-3xl font-bold text-white mb-1">{value}</p>
                    <p className="text-sm text-gray-500 leading-snug">{label}</p>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
        </section>

        {/* Trust strip */}
        <div className="py-4 border-b border-gray-100 bg-white">
          <div className="max-w-screen-xl mx-auto px-5 flex flex-wrap items-center justify-center gap-8">
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-gray-400">
                <Icon className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <section id="features" className="py-24 bg-gray-50">
          <div className="max-w-screen-xl mx-auto px-5">
            <FadeUp className="mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-purple-600 mb-3">Features</p>
              <h2 className="text-4xl font-bold text-gray-900 mb-3">Everything you need in one place</h2>
              <p className="text-gray-500 text-lg" style={{ maxWidth: "52ch" }}>
                Integrated tools built for UK graduates - from your first payslip to your first pension contribution.
              </p>
            </FadeUp>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {FEATURES.map(({ icon: Icon, title, desc }, i) => (
                <FadeUp key={title} delay={i * 0.04}>
                  <div className="bg-white border border-gray-200 rounded-xl p-6 h-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-24" style={{ background: "#0A0A0F" }}>
          <div className="max-w-screen-xl mx-auto px-5">
            <FadeUp className="mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-3">How it works</p>
              <h2 className="text-4xl font-bold text-white mb-3">Up and running in minutes</h2>
              <p className="text-gray-400 text-lg" style={{ maxWidth: "52ch" }}>
                No spreadsheets. No jargon. Just your numbers working for you.
              </p>
            </FadeUp>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {STEPS.map(({ n, title, desc }, i) => (
                <FadeUp key={n} delay={i * 0.06}>
                  <div
                    className="p-7 rounded-xl border border-white/8 h-full"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    <span
                      className="text-5xl font-bold leading-none block mb-5"
                      style={{ color: "rgba(124,58,237,0.35)" }}
                    >
                      {n}
                    </span>
                    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* About / Mission */}
        <section id="about" className="py-24 bg-white">
          <div className="max-w-screen-xl mx-auto px-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <FadeUp>
                <p className="text-xs font-bold uppercase tracking-widest text-purple-600 mb-3">Our mission</p>
                <h2 className="text-4xl font-bold text-gray-900 mb-5">Financial literacy should not be a privilege.</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  G.E.C.K.O (Goals, Earnings, Capital, Knowledge, Outcomes) was built in response to a clear gap: most
                  young adults start their first job without the tools to understand their own payslip. The result is
                  confusion, stress, and missed opportunities.
                </p>
                <p className="text-gray-600 leading-relaxed mb-6">
                  This directly supports SDG 4 (Quality Education). Gecko combines budgeting tools, structured learning,
                  gamification, and real market context so young adults can make confident money decisions from day one.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["SDG 4 - Quality Education", "First-job focused", "UK tax & pension accuracy"].map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold border border-gray-200"
                    >
                      <CheckCircle className="w-3 h-3 text-purple-600 shrink-0" />
                      {tag}
                    </span>
                  ))}
                </div>
              </FadeUp>

              <FadeUp delay={0.06}>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      icon: Shield,
                      title: "Your data is yours",
                      desc: "Export or delete at any time. We store only what you need for the service.",
                    },
                    {
                      icon: Award,
                      title: "Learn by doing",
                      desc: "Interactive calculators, quizzes, and real tools - not just reading material.",
                    },
                    {
                      icon: BarChart3,
                      title: "Live market context",
                      desc: "Salary benchmarks pulled from Adzuna so your goals reflect the real world.",
                    },
                    {
                      icon: Target,
                      title: "Built for the UK",
                      desc: "Tax bands, NI rates, and pension auto-enrolment rules - accurate and current.",
                    },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <Icon className="w-5 h-5 text-purple-600 mb-2" />
                      <p className="text-sm font-bold text-gray-900 mb-1">{title}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </FadeUp>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section
          className="py-20"
          style={{ background: "linear-gradient(135deg, #3B0764 0%, #5B21B6 50%, #7C3AED 100%)" }}
        >
          <div className="max-w-screen-xl mx-auto px-5 text-center">
            <FadeUp>
              <h2 className="text-4xl font-bold text-white mb-4">Ready to take control?</h2>
              <p className="text-purple-200 text-lg mb-8 mx-auto" style={{ maxWidth: "46ch" }}>
                Free to use. Set up in under two minutes. Start understanding your money today.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-purple-700 font-bold rounded-lg hover:bg-gray-50 transition-colors no-underline text-sm shadow-lg"
                >
                  Create free account <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-7 py-3.5 text-white font-semibold rounded-lg transition-colors no-underline text-sm border border-white/30 hover:border-white/60"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  Sign in
                </Link>
              </div>
            </FadeUp>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-10 border-t border-white/8" style={{ background: "#0A0A0F" }}>
        <div className="max-w-screen-xl mx-auto px-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/gecko-transparent.png?v=3" alt="Gecko logo" className="w-7 h-7 object-contain opacity-70" />
            <span className="text-sm font-bold text-gray-500">Gecko</span>
          </div>
          <p className="text-xs text-gray-600 text-center">
            &copy; 2026 G.E.C.K.O &mdash; Personal project, originally built as part of University of Surrey COM2042
          </p>
          <div className="flex items-center gap-5">
            <Link to="/terms" className="text-xs text-gray-600 hover:text-gray-400 transition-colors no-underline">
              Terms
            </Link>
            <Link
              to="/data-policy"
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors no-underline"
            >
              Privacy
            </Link>
            <Link to="/login" className="text-xs text-gray-600 hover:text-gray-400 transition-colors no-underline">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
