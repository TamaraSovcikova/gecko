import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, TrendingUp, BookOpen, Target, PiggyBank, BarChart3, Zap } from "lucide-react";

const FEATURES = [
  { icon: BarChart3, title: "Budget Dashboard", desc: "Visualise your income vs spend with clear breakdowns by category." },
  { icon: TrendingUp, title: "Spend Forecasting", desc: "ML-powered predictions show where your money will go next month." },
  { icon: PiggyBank, title: "Savings Goals", desc: "Set targets, track contributions, and celebrate milestones." },
  { icon: BookOpen, title: "Financial Learning", desc: "Bite-size modules on payslips, pensions, and budgeting." },
  { icon: Target, title: "AI Finance Chat", desc: "Ask questions about your actual spending - no generic advice." },
  { icon: Zap, title: "Receipt OCR", desc: "Snap a receipt and expenses log themselves automatically." },
];

const TEAM = [
  { name: "Tamara", email: "member@example.com" },
  { name: "Aaliyah", email: "member@example.com" },
  { name: "Rhea", email: "member@example.com" },
  { name: "Yasmine", email: "member@example.com" },
  { name: "Zoe", email: "member@example.com" },
  { name: "Tom", email: "member@example.com" },
];

const FadeUp = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
    {children}
  </motion.div>
);

const Home = () => {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div className="min-h-screen bg-purple-50 overflow-x-hidden" style={{ fontFamily: "Manrope, Segoe UI, Arial, sans-serif", color: "#1a1040" }}>
      {/* Sticky nav */}
      <header className="sticky top-0 z-30 w-full bg-purple-50/95 backdrop-blur-sm border-b border-purple-200 shadow-nav">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-1 no-underline shrink-0">
            <img src="/gecko-transparent.png?v=3" alt="Gecko logo" className="w-12 h-12 object-contain" />
            <span className="text-lg font-extrabold tracking-wider"
              style={{ background: "linear-gradient(92deg, #5c3fa3, #8b6fd4 50%, #f0b429)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              G.E.C.K.O
            </span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6" aria-label="Homepage sections">
            {["About", "Features", "Contact"].map((s) => (
              <a key={s} href={`#${s.toLowerCase()}`}
                className="text-sm font-bold text-purple-700 hover:text-purple-900 transition-colors no-underline relative after:absolute after:left-0 after:-bottom-1 after:w-full after:h-0.5 after:bg-purple-500 after:scale-x-0 after:origin-left hover:after:scale-x-100 after:transition-transform">
                {s}
              </a>
            ))}
          </nav>
          <Link to="/login"
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-purple-700 text-white text-sm font-bold rounded-pill border border-purple-800 shadow-button hover:-translate-y-0.5 hover:shadow-lg transition-all no-underline">
            Login <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-purple-100 via-purple-50 to-white">
          {/* Decorative blobs */}
          <div className="absolute top-1/4 right-[-60px] w-64 h-64 rounded-[40%_60%_64%_36%/42%_35%_65%_58%] bg-purple-200 opacity-80 animate-[float_8s_ease-in-out_infinite]" />
          <div className="absolute bottom-[-60px] left-[-50px] w-56 h-56 rounded-[58%_42%_35%_65%/56%_41%_59%_44%] bg-purple-300 opacity-60 animate-[float_12s_ease-in-out_infinite_reverse]" />
          <div className="absolute top-[18%] left-[10%] w-3 h-3 rounded-full bg-purple-400 opacity-70" />
          <div className="absolute top-[27%] left-[15%] w-2.5 h-2.5 rounded-full bg-gold opacity-70" />

          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 w-full max-w-screen-xl mx-auto px-4 sm:px-6 py-20 grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-10 items-center">
            {/* Copy */}
            <div className="bg-white/85 border border-purple-200 rounded-2xl p-7 shadow-xl">
              <FadeUp>
                <motion.h1 className="text-7xl sm:text-8xl font-bold tracking-wide leading-none mb-4"
                  style={{ background: "linear-gradient(94deg, #5c3fa3 0%, #8b6fd4 55%, #f0b429 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
                  animate={{ scale: [1, 1.025, 1] }} transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}>
                  G.E.C.K.O
                </motion.h1>
              </FadeUp>
              <FadeUp delay={0.1}>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill border border-purple-300 bg-purple-100 text-purple-800 text-xs font-extrabold tracking-widest uppercase mb-3">
                  Built for first-job confidence
                </span>
              </FadeUp>
              <FadeUp delay={0.15}>
                <p className="text-xl font-bold text-purple-700 mb-3">Goals, Earnings, Capital, Knowledge, Outcomes</p>
              </FadeUp>
              <FadeUp delay={0.2}>
                <p className="text-lg text-purple-600 leading-relaxed mb-6">
                  A finance platform built to support young adults through their first job journey, from payslip understanding to budgeting confidence.
                </p>
              </FadeUp>
              <FadeUp delay={0.25} className="flex flex-wrap gap-3 mb-6">
                <a href="#about" className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-purple-700 text-white font-bold rounded-pill border border-purple-800 shadow-button hover:-translate-y-0.5 hover:shadow-lg transition-all no-underline text-sm">
                  Learn More
                </a>
                <a href="#contact" className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-purple-100 text-purple-700 font-bold rounded-pill border border-purple-300 hover:-translate-y-0.5 transition-all no-underline text-sm">
                  Contact Team
                </a>
                <Link to="/register" className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gold text-white font-bold rounded-pill hover:-translate-y-0.5 hover:bg-gold-deep transition-all no-underline text-sm shadow-button">
                  Get Started <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </FadeUp>
              <FadeUp delay={0.3}>
                <div className="grid grid-cols-3 gap-3">
                  {[["Instant", "Expense logging"], ["Clear", "Payslip breakdowns"], ["Smart", "Market-driven tips"]].map(([val, label]) => (
                    <div key={label} className="border border-purple-200 rounded-xl bg-purple-50 p-3 shadow-sm">
                      <p className="text-lg font-extrabold text-purple-700 m-0">{val}</p>
                      <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mt-0.5 m-0">{label}</p>
                    </div>
                  ))}
                </div>
              </FadeUp>
            </div>

            {/* Hero image */}
            <FadeUp delay={0.1} className="hidden lg:flex items-center justify-center">
              <motion.img src="/gecko-transparent.png?v=3" alt="Gecko mascot"
                animate={{ rotate: [-6, -4, -6] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="w-full max-w-sm filter drop-shadow-xl select-none pointer-events-none" />
            </FadeUp>
          </motion.div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 bg-purple-50">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
            <FadeUp className="text-center mb-12">
              <h2 className="text-4xl font-bold text-purple-800 mb-3">Everything you need</h2>
              <p className="text-purple-500 text-lg max-w-xl mx-auto">Six powerful tools working together so you never feel lost with money again.</p>
            </FadeUp>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map(({ icon: Icon, title, desc }, i) => (
                <FadeUp key={title} delay={i * 0.05}>
                  <div className="bg-white border border-purple-200 rounded-xl p-5 h-full hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-base font-bold text-purple-900 mb-1">{title}</h3>
                    <p className="text-sm text-purple-500 leading-relaxed">{desc}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="py-20 bg-purple-100/60 border-t border-b border-purple-200 relative overflow-hidden">
          <div className="absolute top-1/4 right-[-40px] w-48 h-48 rounded-full bg-purple-200 opacity-50 animate-[float_10s_ease-in-out_infinite]" />
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.85fr] gap-10 items-center">
              <div>
                <FadeUp>
                  <h2 className="text-4xl font-bold text-purple-700 mb-5">About Us</h2>
                </FadeUp>
                <FadeUp delay={0.05}>
                  <p className="text-lg text-purple-700 leading-relaxed mb-4">
                    G.E.C.K.O (Goals, Earnings, Capital, Knowledge, Outcomes) is Team Zoar's response to the problem statement "Navigating your first job." Our project focuses on empowering young adults with essential financial knowledge related to payslips, pensions, and budgeting through an accessible web app.
                  </p>
                </FadeUp>
                <FadeUp delay={0.1}>
                  <p className="text-lg text-purple-700 leading-relaxed mb-4">
                    This directly supports SDG 4 (Quality Education) by turning complex financial topics into practical, interactive learning. Many young adults begin work with limited financial literacy, which can lead to financial stress, poor money decisions, and missed long-term opportunities.
                  </p>
                </FadeUp>
                <FadeUp delay={0.15}>
                  <p className="text-lg text-purple-700 leading-relaxed">
                    UK Money Advice Service data highlights the urgency: 61% of young adults struggle with budgeting within their first year of employment. G.E.C.K.O addresses this with clear guidance, budgeting tools, and gamified engagement that rewards progress and builds healthy money habits.
                  </p>
                </FadeUp>
              </div>

              <FadeUp delay={0.1} className="bg-purple-50 border border-purple-200 rounded-2xl shadow-lg p-6 space-y-4">
                <h3 className="text-xl font-bold text-purple-700 mb-2">Why Gecko Stands Out</h3>
                {[["Learn by doing", "Interactive"], ["Build confidence early", "First Job Ready"], ["Market context", "Data-Driven"]].map(([label, metric]) => (
                  <div key={label} className="flex items-center justify-between gap-3 p-3 bg-white border border-purple-200 rounded-xl">
                    <span className="text-sm font-bold text-purple-700">{label}</span>
                    <span className="text-sm font-extrabold text-purple-600">{metric}</span>
                  </div>
                ))}
                <div className="bg-purple-100 border border-purple-200 rounded-xl p-4">
                  <p className="text-sm font-extrabold text-purple-700 mb-2">Powered by practical guidance</p>
                  <p className="text-xs text-purple-600 leading-relaxed">
                    Gecko combines budgeting tools, payslip clarity, and real market context so young adults can make confident money decisions from day one.
                  </p>
                </div>
              </FadeUp>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="py-20 bg-purple-50/80 relative overflow-hidden">
          <div className="absolute top-1/4 right-[-50px] w-52 h-52 rounded-[40%_60%_64%_36%/42%_35%_65%_58%] bg-purple-200 opacity-60 animate-[float_8s_ease-in-out_infinite]" />
          <div className="absolute bottom-[-50px] left-[-40px] w-48 h-48 rounded-[58%_42%_35%_65%/56%_41%_59%_44%] bg-purple-300 opacity-50 animate-[float_12s_ease-in-out_infinite_reverse]" />
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 relative z-10">
            <FadeUp className="mb-10">
              <h2 className="text-4xl font-bold text-purple-900 mb-2">Contact Us</h2>
              <p className="text-purple-500 text-lg">University of Surrey, Guildford, England, GU2 7XH</p>
            </FadeUp>
            <FadeUp delay={0.1}>
              <div className="bg-white border border-purple-200 rounded-2xl shadow-lg p-6">
                <p className="text-sm font-bold text-purple-500 uppercase tracking-wider mb-4">Team Zoar</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {TEAM.map(({ name, email }) => (
                    <div key={name} className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-100 rounded-xl hover:border-purple-300 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-purple-200 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-purple-700">{name[0]}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-purple-900 truncate">{name}</p>
                        <p className="text-xs text-purple-500 truncate">{email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>

            {/* CTA */}
            <FadeUp delay={0.2} className="mt-12 text-center">
              <p className="text-purple-600 text-lg mb-5">Ready to take control of your finances?</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-700 text-white font-bold rounded-pill border border-purple-800 shadow-button hover:-translate-y-0.5 hover:shadow-lg transition-all no-underline">
                  Create Free Account <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-700 font-bold rounded-pill border border-purple-300 hover:-translate-y-0.5 transition-all no-underline">
                  Login
                </Link>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 bg-purple-900 text-white text-center">
          <p className="text-sm text-purple-300">
            &copy; 2026 G.E.C.K.O - Team Zoar, University of Surrey &bull; COM2042 Group Project
          </p>
        </footer>
      </main>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
};

export default Home;
