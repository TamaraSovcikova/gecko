import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen, Search, CheckCircle2, Trophy, Zap, ArrowRight, ChevronRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { LEARNING_CONTENT, LEARNING_CATEGORIES, type LearningCategory } from "../../constants/learningContent";
import TopicCard from "./TopicCard";
import { useAuth } from "../../context/AuthContext";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { LEARNING_PATHS, getPathProgress } from "../../data/learningPaths";

const CATEGORY_META: Record<
  LearningCategory,
  { color: string; bg: string; border: string; description: string; quizTopic: string }
> = {
  "Understanding Your Payslip": {
    color: "#6366F1",
    bg: "#EEF2FF",
    border: "#C7D2FE",
    description: "Break down every line - gross pay, tax, NI, pension, and take-home.",
    quizTopic: "payslip",
  },
  "Budgeting Basics": {
    color: "#0D9488",
    bg: "#F0FDFA",
    border: "#99F6E4",
    description: "Simple frameworks for managing money without tracking every penny.",
    quizTopic: "budgeting",
  },
  "Tax Fundamentals": {
    color: "#EA580C",
    bg: "#FFF7ED",
    border: "#FED7AA",
    description: "How tax codes, personal allowance, and self-assessment work.",
    quizTopic: "tax",
  },
  "Saving and Financial Goals": {
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
    description: "From emergency funds to ISAs - savings that work for your goals.",
    quizTopic: "saving",
  },
};

function getStorageKey(userId?: string) {
  return userId ? `learn_read_topics_${userId}` : null;
}

function loadRead(userId?: string): Set<string> {
  try {
    const key = getStorageKey(userId);
    if (!key) return new Set();
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((x: unknown) => typeof x === "string")) : new Set();
  } catch {
    return new Set();
  }
}

function saveRead(userId: string, set: Set<string>) {
  try {
    const key = getStorageKey(userId);
    if (key) localStorage.setItem(key, JSON.stringify([...set]));
  } catch {}
}

export default function Learn() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const userId = currentUser?.uid;

  const [activeCategory, setActiveCategory] = useState<LearningCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [readTopics, setReadTopics] = useState<Set<string>>(() => loadRead(userId));

  useEffect(() => {
    setReadTopics(loadRead(userId));
  }, [userId]);

  const totalTopics = LEARNING_CONTENT.length;
  const validTopicIds = useMemo(() => new Set(LEARNING_CONTENT.map((t) => t.id)), []);
  const readCount = useMemo(
    () => [...readTopics].filter((id) => validTopicIds.has(id)).length,
    [readTopics, validTopicIds]
  );
  const progressPct = totalTopics > 0 ? (readCount / totalTopics) * 100 : 0;

  const handleRead = (id: string) => {
    if (!userId) return;
    setReadTopics((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveRead(userId, next);
      return next;
    });
  };

  const pathProgress = getPathProgress(userId ?? "anon");

  const filteredTopics = LEARNING_CONTENT.filter((topic) => {
    const matchesCat = activeCategory === "all" || topic.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      topic.title.toLowerCase().includes(q) ||
      topic.summary.toLowerCase().includes(q) ||
      topic.category.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const groupedTopics =
    activeCategory === "all"
      ? LEARNING_CATEGORIES.map((cat) => ({
          category: cat,
          topics: filteredTopics.filter((t) => t.category === cat),
        })).filter((g) => g.topics.length > 0)
      : [{ category: activeCategory, topics: filteredTopics }];

  return (
    <div className="app-page">
      <div className="max-w-screen-xl mx-auto pb-10">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Financial Education</p>
            <h1 className="text-2xl font-bold text-gray-900">Learn</h1>
          </div>

          {/* Overall progress widget */}
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
            {progressPct === 100 ? (
              <Trophy className="h-4 w-4 shrink-0" style={{ color: "#f0b429" }} />
            ) : (
              <BookOpen className="h-4 w-4 text-purple-600 shrink-0" />
            )}
            <div>
              <p className="text-xs text-gray-500 mb-1.5">
                {readCount} of {totalTopics} topics explored
              </p>
              <div className="w-36 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-purple-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
            <span className="text-sm font-bold text-gray-900 tabular-nums">{Math.round(progressPct)}%</span>
          </div>
        </div>

        {/* Category overview cards */}
        {activeCategory === "all" && !searchQuery && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {LEARNING_CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat as LearningCategory];
              const total = LEARNING_CONTENT.filter((t) => t.category === cat).length;
              const done = LEARNING_CONTENT.filter((t) => t.category === cat && readTopics.has(t.id)).length;
              const pct = total > 0 ? (done / total) * 100 : 0;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="text-left p-4 bg-white border rounded-xl hover:shadow-md transition-all duration-200 focus:outline-none"
                  style={{ borderColor: meta.border }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-bold leading-snug" style={{ color: meta.color, maxWidth: "14ch" }}>
                      {cat}
                    </span>
                    {done === total && total > 0 && (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: meta.color }} />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-3 leading-snug">
                    {done}/{total} topics
                  </p>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: meta.bg }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: meta.color }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Learning Paths */}
        {activeCategory === "all" && !searchQuery && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-0.5">
                  Structured learning
                </p>
                <h2 className="text-base font-bold text-gray-900">Learning Paths</h2>
              </div>
              <span className="text-xs text-gray-400">Sequential, step-by-step</span>
            </div>

            {/* Recommended path */}
            {(() => {
              const recommended = LEARNING_PATHS[0];
              const pct = pathProgress[recommended.slug] ?? 0;
              const started = pct > 0;
              return (
                <Link
                  to={`/learn/paths/${recommended.slug}`}
                  className="block mb-3 p-4 rounded-xl border-2 border-purple-300 bg-purple-50 hover:bg-purple-100 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{recommended.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                          {started ? "Continue" : "Recommended start"}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                        {recommended.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{recommended.description}</p>
                      {pct > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1.5 bg-purple-100 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-600 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[11px] font-semibold text-purple-600">{Math.round(pct)}%</span>
                        </div>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-purple-400 group-hover:text-purple-600 shrink-0 mt-1 transition-colors" />
                  </div>
                </Link>
              );
            })()}

            {/* All paths grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {LEARNING_PATHS.slice(1).map((path) => {
                const pct = pathProgress[path.slug] ?? 0;
                return (
                  <Link
                    key={path.slug}
                    to={`/learn/paths/${path.slug}`}
                    className={cn(
                      "flex flex-col gap-2 p-3.5 bg-white rounded-xl border hover:shadow-md transition-all group",
                      path.borderColor
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xl">{path.emoji}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors mt-0.5" />
                    </div>
                    <div>
                      <p className={cn("text-xs font-bold mb-0.5", path.textColor)}>{path.subtitle}</p>
                      <p className="text-sm font-bold text-gray-900 leading-snug group-hover:text-purple-700 transition-colors">
                        {path.title}
                      </p>
                    </div>
                    <div className="mt-auto">
                      {pct > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className={cn("flex-1 h-1 rounded-full overflow-hidden", path.color)}>
                            <div
                              className={cn("h-full rounded-full", path.textColor.replace("text-", "bg-"))}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={cn("text-[10px] font-semibold", path.textColor)}>{Math.round(pct)}%</span>
                        </div>
                      ) : (
                        <span className={cn("text-[10px] font-semibold", path.textColor)}>
                          {path.modules.length} modules
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Search + category filter */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-44">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory("all")}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                activeCategory === "all" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              All
            </button>
            {LEARNING_CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat as LearningCategory];
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={
                    active
                      ? { background: meta.color, color: "#fff" }
                      : { background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }
                  }
                >
                  {cat.split(" ").slice(0, 2).join(" ")}
                </button>
              );
            })}
          </div>
        </div>

        {/* Topic groups */}
        <div className="space-y-10">
          {groupedTopics.map(({ category, topics }) => {
            const meta = CATEGORY_META[category as LearningCategory];
            const catRead = topics.filter((t) => readTopics.has(t.id)).length;
            return (
              <motion.section key={category} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {/* Category header */}
                <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: meta?.color }} />
                      <h3 className="text-sm font-bold text-gray-800">{category}</h3>
                      {catRead === topics.length && topics.length > 0 && (
                        <CheckCircle2 className="h-3.5 w-3.5" style={{ color: meta?.color }} />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 ml-4">{meta?.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {catRead}/{topics.length} read
                    </span>
                    {/* Quiz shortcut */}
                    <button
                      onClick={() => navigate(`/quiz?topic=${meta?.quizTopic}`)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border"
                      style={{ background: meta?.bg, color: meta?.color, borderColor: meta?.border }}
                    >
                      <Zap className="w-3 h-3" />
                      Quiz
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {topics.map((topic) => (
                    <TopicCard key={topic.id} topic={topic} onRead={handleRead} isRead={readTopics.has(topic.id)} />
                  ))}
                </div>
              </motion.section>
            );
          })}
        </div>

        {/* Empty state */}
        {filteredTopics.length === 0 && (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">No topics found</p>
            <p className="text-xs text-gray-400">
              Try a different search term or{" "}
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
                className="text-purple-600 font-semibold hover:underline"
              >
                clear filters
              </button>
            </p>
          </div>
        )}

        {/* Completion celebration */}
        {progressPct === 100 && (
          <div className="mt-8 p-6 bg-white border border-gray-200 rounded-xl text-center shadow-sm">
            <Trophy className="h-8 w-8 mx-auto mb-3" style={{ color: "#f0b429" }} />
            <p className="text-base font-bold text-gray-900 mb-1">All topics explored!</p>
            <p className="text-sm text-gray-500 mb-4">Ready to test your knowledge?</p>
            <button
              onClick={() => navigate("/quiz")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Zap className="w-4 h-4" />
              Take a quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
