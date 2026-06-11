import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen, Search, CheckCircle2, Trophy } from "lucide-react";
import TopNav from "../../components/TopNav";
import { LEARNING_CONTENT, LEARNING_CATEGORIES, type LearningCategory } from "../../constants/learningContent";
import TopicCard from "./TopicCard";
import { useAuth } from "../../context/AuthContext";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";

const CATEGORY_META: Record<LearningCategory, { color: string; description: string }> = {
  "Understanding Your Payslip": { color: "#6366F1", description: "Break down every line - gross pay, tax, NI, pension, and take-home." },
  "Budgeting Basics": { color: "#0D9488", description: "Simple frameworks for managing money without tracking every penny." },
  "Tax Fundamentals": { color: "#F97316", description: "How tax codes, personal allowance, and self-assessment work." },
  "Saving and Financial Goals": { color: "#D97706", description: "From emergency funds to ISAs - savings that work for your goals." },
};

function getStorageKey(userId?: string) { return userId ? `learn_read_topics_${userId}` : null; }

function loadRead(userId?: string): Set<string> {
  try {
    const key = getStorageKey(userId);
    if (!key) return new Set();
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((x: unknown) => typeof x === "string")) : new Set();
  } catch { return new Set(); }
}

function saveRead(userId: string, set: Set<string>) {
  try {
    const key = getStorageKey(userId);
    if (key) localStorage.setItem(key, JSON.stringify([...set]));
  } catch {}
}

export default function Learn() {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid;

  const [activeCategory, setActiveCategory] = useState<LearningCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [readTopics, setReadTopics] = useState<Set<string>>(() => loadRead(userId));

  useEffect(() => { setReadTopics(loadRead(userId)); }, [userId]);

  const totalTopics = LEARNING_CONTENT.length;
  const validTopicIds = useMemo(() => new Set(LEARNING_CONTENT.map(t => t.id)), []);
  const readCount = useMemo(() => [...readTopics].filter(id => validTopicIds.has(id)).length, [readTopics, validTopicIds]);
  const progressPct = totalTopics > 0 ? (readCount / totalTopics) * 100 : 0;

  const handleRead = (id: string) => {
    if (!userId) return;
    setReadTopics(prev => {
      const next = new Set(prev);
      next.add(id);
      saveRead(userId, next);
      return next;
    });
  };

  const filteredTopics = LEARNING_CONTENT.filter(topic => {
    const matchesCat = activeCategory === "all" || topic.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || topic.title.toLowerCase().includes(q) || topic.summary.toLowerCase().includes(q) || topic.category.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const groupedTopics = activeCategory === "all"
    ? LEARNING_CATEGORIES.map(cat => ({ category: cat, topics: filteredTopics.filter(t => t.category === cat) })).filter(g => g.topics.length > 0)
    : [{ category: activeCategory, topics: filteredTopics }];

  return (
    <div className="app-page">
      <TopNav />
      <div className="max-w-screen-xl mx-auto px-4 pb-16">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-xl p-6 mb-6 text-white shadow-lg mt-2" style={{ background: "linear-gradient(135deg, #5c3fa3 0%, #4e358f 100%)" }}>
          <div className="absolute -right-6 -top-6 h-40 w-40 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-md" style={{ background: "rgba(255,255,255,0.2)" }}>
                <BookOpen className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.7)" }}>Financial Education</p>
            </div>
            <h1 className="text-2xl font-bold mb-4">Learn &amp; Level Up</h1>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 max-w-xs">
                <div className="flex justify-between text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                  <span>{readCount} of {totalTopics} topics explored</span>
                  <span>{Math.round(progressPct)}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.2)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "#f0b429" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
              {progressPct === 100 && (
                <div className="flex items-center gap-2 rounded-pill px-3 py-1.5 text-sm font-semibold" style={{ background: "rgba(240,180,41,0.2)" }}>
                  <Trophy className="h-4 w-4" style={{ color: "#f0b429" }} />
                  All topics complete!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search + filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gecko-muted" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-md border border-purple-300 bg-white text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveCategory("all")} className={cn("px-3 py-1.5 rounded-pill text-xs font-semibold transition-colors", activeCategory === "all" ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-700 hover:bg-purple-200")}>
              All
            </button>
            {LEARNING_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={cn("px-3 py-1.5 rounded-pill text-xs font-semibold transition-colors", activeCategory === cat ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-700 hover:bg-purple-200")}>
                {cat.split(" ").slice(0, 2).join(" ")}
              </button>
            ))}
          </div>
        </div>

        {/* Topic groups */}
        <div className="space-y-8">
          {groupedTopics.map(({ category, topics }) => {
            const meta = CATEGORY_META[category as LearningCategory];
            const catRead = topics.filter(t => readTopics.has(t.id)).length;
            return (
              <motion.section key={category} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold" style={{ color: meta?.color }}>{category}</h3>
                      <Badge variant="outline">{topics.length} topics</Badge>
                      {catRead === topics.length && topics.length > 0 && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    </div>
                    <p className="text-xs text-gecko-muted mt-0.5">{meta?.description}</p>
                  </div>
                  <span className="text-xs text-gecko-muted">{catRead}/{topics.length} read</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {topics.map(topic => <TopicCard key={topic.id} topic={topic} onRead={handleRead} />)}
                </div>
              </motion.section>
            );
          })}
        </div>

        {filteredTopics.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-10 w-10 text-purple-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-purple-600">No topics found</p>
            <p className="text-xs text-gecko-muted mt-1">Try a different search or category</p>
          </div>
        )}
      </div>
    </div>
  );
}
