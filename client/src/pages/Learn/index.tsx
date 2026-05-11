// client/src/pages/Learn/index.tsx

import { useState, useEffect, useMemo } from "react";
import TopNav from "../../components/TopNav";
import {
  LEARNING_CONTENT,
  LEARNING_CATEGORIES,
  type LearningCategory,
} from "../../constants/learningContent";
import TopicCard from "./TopicCard";
import { useAuth } from "../../context/AuthContext";

const CATEGORY_META: Record<
  LearningCategory,
  { icon: string; color: string; dotColor: string; description: string }
> = {
  "Understanding Your Payslip": {
    icon: "bi-receipt-cutoff",
    color: "#6366F1",
    dotColor: "#818CF8",
    description:
      "Break down every line - gross pay, tax, NI, pension, and take-home.",
  },
  "Budgeting Basics": {
    icon: "bi-wallet2",
    color: "#0D9488",
    dotColor: "#34D399",
    description:
      "Simple frameworks for managing money without tracking every penny.",
  },
  "Tax Fundamentals": {
    icon: "bi-building-fill-gear",
    color: "#F97316",
    dotColor: "#FB923C",
    description: "How tax codes, personal allowance, and self-assessment work.",
  },
  "Saving and Financial Goals": {
    icon: "bi-piggy-bank-fill",
    color: "#D97706",
    dotColor: "#FBBF24",
    description:
      "From emergency funds to ISAs — savings that work for your goals.",
  },
};

// ---------- helpers ----------
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
    if (!Array.isArray(parsed)) return new Set();

    return new Set(parsed.filter((x) => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function saveRead(userId: string, set: Set<string>) {
  try {
    const key = getStorageKey(userId);
    if (!key) return;

    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    // Ignore localStorage failures (private mode or quota limits).
  }
}

// ---------- component ----------
export default function Learn() {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid;

  const [activeCategory] = useState<
    LearningCategory | "all"
  >("all");

  const [searchQuery] = useState("");

  const [readTopics, setReadTopics] = useState<Set<string>>(() =>
    loadRead(userId),
  );

  useEffect(() => {
    setReadTopics(loadRead(userId));
  }, [userId]);

  const totalTopics = LEARNING_CONTENT.length;

  // only count valid topics (prevents fake "100% complete" bug)
  const validTopicIds = useMemo(
    () => new Set(LEARNING_CONTENT.map((t) => t.id)),
    [],
  );

  const readCount = useMemo(() => {
    return [...readTopics].filter((id) => validTopicIds.has(id)).length;
  }, [readTopics, validTopicIds]);

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

  const filteredTopics = LEARNING_CONTENT.filter((topic) => {
    const matchesCat =
      activeCategory === "all" || topic.category === activeCategory;

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
      <TopNav />

      <div className="app-content">

      {/* HERO */}
      <div
        style={{
          background: "#f4f1fb",
          borderRadius: 14,
          padding: "1.75rem",
          marginBottom: "1.5rem",
          border: "1px solid #d9cff0",
          boxShadow: "0 4px 18px rgba(92, 63, 163, 0.08)",
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>
          Financial Education Hub
        </h1>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, color: "#8b6fd4", marginBottom: 5 }}>
            {readCount} of {totalTopics} topics explored
          </div>

          <div
            style={{
              height: 6,
              background: "#c9bde8",
              borderRadius: 99,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background: "#8b6fd4",
                width: `${progressPct}%`,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* TOPICS */}
      {groupedTopics.map(({ category, topics }) => {
        const meta = CATEGORY_META[category as LearningCategory];

        return (
          <div key={category} style={{ marginBottom: "2rem" }}>
            <h3 style={{ fontSize: 12, color: meta?.color ?? "#7a6e99", marginBottom: 4 }}>
              {category} ({topics.length})
            </h3>
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "#5b4f7a" }}>
              {meta?.description}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                gap: 12,
              }}
            >
              {topics.map((topic) => (
                <TopicCard key={topic.id} topic={topic} onRead={handleRead} />
              ))}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
