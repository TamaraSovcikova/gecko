import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";
import { saveFinancialProfile } from "../../api/financialProfileApi";

type Question = {
  id: string;
  question: string;
  sub: string;
  options: { value: string; label: string; emoji: string }[];
};

const QUESTIONS: Question[] = [
  {
    id: "pension",
    question: "Do you contribute to a workplace pension?",
    sub: "UK employers must auto-enrol eligible workers — you may have opted out.",
    options: [
      { value: "yes-max", label: "Yes, and I'm maximizing the employer match", emoji: "💪" },
      { value: "yes-some", label: "Yes, but I'm not sure about the employer match", emoji: "🤔" },
      { value: "no", label: "No, I'm not enrolled or opted out", emoji: "❌" },
      { value: "unsure", label: "I genuinely don't know", emoji: "🙈" },
    ],
  },
  {
    id: "student-loan",
    question: "Do you have a student loan?",
    sub: "Repayments start automatically when you earn above the threshold — check your payslip.",
    options: [
      { value: "plan2", label: "Yes — Plan 2 (started uni 2012-2023)", emoji: "📚" },
      { value: "plan5", label: "Yes — Plan 5 (started uni 2023+)", emoji: "📚" },
      { value: "plan1-4", label: "Yes — Plan 1 or Plan 4", emoji: "📚" },
      { value: "no", label: "No student loan", emoji: "✅" },
    ],
  },
  {
    id: "emergency-fund",
    question: "Do you have an emergency fund?",
    sub: "3 months of expenses saved somewhere accessible, like a savings account.",
    options: [
      { value: "yes", label: "Yes, 3+ months of expenses covered", emoji: "🛡️" },
      { value: "partial", label: "I have some savings but not 3 months", emoji: "🏗️" },
      { value: "no", label: "Not yet", emoji: "⚠️" },
      { value: "what", label: "What's an emergency fund?", emoji: "❓" },
    ],
  },
  {
    id: "isa",
    question: "Do you use an ISA?",
    sub: "Individual Savings Accounts let you earn interest and investment returns tax-free.",
    options: [
      { value: "yes", label: "Yes, I have a Stocks & Shares or Cash ISA", emoji: "📈" },
      { value: "no-know", label: "I know what one is but don't have one", emoji: "📖" },
      { value: "no-know-not", label: "I've heard of it but don't really know", emoji: "🤷" },
    ],
  },
  {
    id: "tracking",
    question: "Do you actively track your spending?",
    sub: "Regularly checking where your money goes each month.",
    options: [
      { value: "yes-gecko", label: "Yes — I use Gecko for this", emoji: "🦎" },
      { value: "yes-other", label: "Yes — another method", emoji: "✅" },
      { value: "sort-of", label: "Sort of — I check occasionally", emoji: "👀" },
      { value: "no", label: "Not really", emoji: "😬" },
    ],
  },
];

type Priority = {
  title: string;
  body: string;
  link: string;
  linkLabel: string;
  color: string;
};

function computePriorities(answers: Record<string, string>): Priority[] {
  const priorities: Priority[] = [];

  const pension = answers.pension;
  if (pension === "no" || pension === "unsure") {
    priorities.push({
      title: "Enrol in your workplace pension",
      body: "Your employer is legally required to contribute to your pension if you're eligible. Not enrolling means turning down part of your salary.",
      link: "/pension",
      linkLabel: "Pension optimizer",
      color: "emerald",
    });
  } else if (pension === "yes-some") {
    priorities.push({
      title: "Check if you're maximizing your employer match",
      body: "Many employees leave free employer contributions unclaimed by contributing less than the match limit.",
      link: "/pension",
      linkLabel: "Check your pension",
      color: "emerald",
    });
  }

  const loan = answers["student-loan"];
  if (loan && loan !== "no") {
    priorities.push({
      title: "Understand your student loan repayments",
      body: "Your repayments come out of your payslip automatically. See exactly how much, and whether you'll ever clear the balance.",
      link: "/loans",
      linkLabel: "Student loan tracker",
      color: "blue",
    });
  }

  const emergency = answers["emergency-fund"];
  if (emergency === "no" || emergency === "what") {
    priorities.push({
      title: "Build your emergency fund",
      body: "3 months of expenses in a savings account is the foundation of financial stability. Without it, one unexpected cost can unravel your budget.",
      link: "/learn/paths/emergency-fund",
      linkLabel: "Emergency fund path",
      color: "amber",
    });
  }

  const isa = answers.isa;
  if (isa === "no-know" || isa === "no-know-not") {
    priorities.push({
      title: "Open a Cash or Stocks & Shares ISA",
      body: "The ISA allowance (£20,000/year) lets you save and invest without paying tax on returns. It's one of the best wrappers available to UK savers.",
      link: "/learn/concepts/isa-vs-savings-account",
      linkLabel: "Learn about ISAs",
      color: "purple",
    });
  }

  const tracking = answers.tracking;
  if (tracking === "no" || tracking === "sort-of") {
    priorities.push({
      title: "Start tracking your spending",
      body: "You can't improve what you don't measure. The dashboard gives you a month-by-month picture of where your money goes.",
      link: "/dashboard",
      linkLabel: "Go to dashboard",
      color: "gray",
    });
  }

  return priorities.slice(0, 4);
}

function scoreAnswers(answers: Record<string, string>): number {
  let score = 0;
  if (answers.pension === "yes-max") score += 25;
  else if (answers.pension === "yes-some") score += 15;
  if (answers["student-loan"] === "no") score += 10;
  else if (answers["student-loan"]) score += 5;
  if (answers["emergency-fund"] === "yes") score += 25;
  else if (answers["emergency-fund"] === "partial") score += 10;
  if (answers.isa === "yes") score += 20;
  else if (answers.isa === "no-know") score += 10;
  if (answers.tracking === "yes-gecko" || answers.tracking === "yes-other") score += 20;
  else if (answers.tracking === "sort-of") score += 10;
  return score;
}

const COLOR_MAP: Record<string, string> = {
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
  blue: "bg-blue-50 border-blue-200 text-blue-700",
  amber: "bg-amber-50 border-amber-200 text-amber-700",
  purple: "bg-purple-50 border-purple-200 text-purple-700",
  gray: "bg-gray-50 border-gray-200 text-gray-700",
};

export default function ReadinessCheckPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const current = QUESTIONS[step];
  const total = QUESTIONS.length;
  const progress = (step / total) * 100;

  const handleAnswer = async (value: string) => {
    const next = { ...answers, [current.id]: value };
    setAnswers(next);

    if (step < total - 1) {
      setStep(step + 1);
    } else {
      // Complete
      const score = scoreAnswers(next);
      const priorities = computePriorities(next);
      setSaving(true);
      setDone(true);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          await saveFinancialProfile(
            {
              readinessCheck: {
                completedAt: new Date().toISOString(),
                score,
                priorities: priorities.map((p) => p.title),
                answers: next,
              },
            },
            token
          );
        } catch {
          // non-blocking
        }
      }
      setSaving(false);
    }
  };

  const priorities = done ? computePriorities(answers) : [];
  const score = done ? scoreAnswers(answers) : 0;

  return (
    <div className="app-page">
      <div className="max-w-lg mx-auto pb-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Financial readiness check</h1>
          <p className="text-sm text-gray-500">5 questions to figure out where you stand and what to focus on first.</p>
        </motion.div>

        {/* Progress bar */}
        {!done && (
          <div className="mb-8">
            <div className="flex justify-between text-[11px] text-gray-400 mb-2">
              <span>
                Question {step + 1} of {total}
              </span>
              <span>{Math.round(progress)}% done</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-purple-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        )}

        {/* Question */}
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">{current.question}</h2>
                <p className="text-sm text-gray-400 leading-relaxed">{current.sub}</p>
              </div>
              <div className="space-y-2.5">
                {current.options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleAnswer(opt.value)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50 rounded-xl text-left transition-all group"
                  >
                    <span className="text-lg shrink-0">{opt.emoji}</span>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-purple-900">{opt.label}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-400 ml-auto shrink-0" />
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              {/* Score */}
              <div className="text-center mb-8">
                <div
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-4",
                    score >= 70
                      ? "bg-emerald-100 text-emerald-700"
                      : score >= 40
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                  )}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Readiness score: {score}/100
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Your starting points</h2>
                <p className="text-sm text-gray-400">
                  {priorities.length === 0
                    ? "You're in great shape. Keep it up."
                    : `Here are the ${priorities.length} areas to focus on first.`}
                </p>
              </div>

              {/* Priorities */}
              <div className="space-y-3 mb-8">
                {priorities.length > 0 ? (
                  priorities.map((p, i) => (
                    <motion.div
                      key={p.title}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className={cn("border rounded-xl p-4", COLOR_MAP[p.color])}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold mb-1">{p.title}</p>
                          <p className="text-xs leading-relaxed opacity-80">{p.body}</p>
                        </div>
                      </div>
                      <Link
                        to={p.link}
                        className="inline-flex items-center gap-1 mt-3 text-xs font-semibold hover:opacity-80 transition-opacity"
                      >
                        {p.linkLabel} <ArrowRight className="w-3 h-3" />
                      </Link>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-emerald-800">You're well set up financially.</p>
                    <p className="text-xs text-emerald-600 mt-1">Keep building and keep learning.</p>
                  </div>
                )}
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Back to dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
