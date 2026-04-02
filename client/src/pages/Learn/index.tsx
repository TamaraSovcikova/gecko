// client/src/pages/Learn/index.tsx
// Financial Education Resource Hub.
// Content driven entirely from learningContent.ts — no backend needed.
// Progress tracks topics the user has expanded in this session (stored in localStorage).

import { useState, useEffect } from "react";
import TopNav from "../../components/TopNav";
import {
  LEARNING_CONTENT,
  LEARNING_CATEGORIES,
  type LearningCategory,
} from "../../constants/learningContent";
import TopicCard from "./TopicCard";

const STORAGE_KEY = "learn_read_topics";

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

function loadRead(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveRead(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

export default function Learn() {
  const [activeCategory, setActiveCategory] = useState<
    LearningCategory | "all"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [readTopics, setReadTopics] = useState<Set<string>>(loadRead);

  const totalTopics = LEARNING_CONTENT.length;
  const readCount = readTopics.size;
  const progressPct = totalTopics > 0 ? (readCount / totalTopics) * 100 : 0;

  const handleRead = (id: string) => {
    setReadTopics((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveRead(next);
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
    <div style={{ padding: "1.5rem", maxWidth: 1100, margin: "0 auto" }}>
      <TopNav />
      {/* ------ Hero ----------- */}
      <div
        style={{
          background: "#EEF2FF",
          borderRadius: 10,
          padding: "1.75rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1.25rem",
          border: "0.5px solid #D4DAFF",
        }}
      >
        <div style={{ fontSize: 36, flexShrink: 0 }}>🎓</div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#3730A3",
                  marginBottom: 4,
                }}
              >
                Financial Education Hub
              </h1>
              <p
                style={{
                  fontSize: 13,
                  color: "#6366F1",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Explore the resources below to learn more about money - from
                your first payslip to long-term savings.
              </p>
            </div>
            {/* Search */}
            <div style={{ position: "relative", minWidth: 220 }}>
              <i
                className="bi bi-search"
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9CA3AF",
                  fontSize: 13,
                }}
              />
              <input
                type="text"
                placeholder="Search topics…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  fontSize: 13,
                  padding: "7px 10px 7px 30px",
                  borderRadius: 10,
                  border: "0.5px solid #C7D2FE",
                  background: "rgba(255,255,255,0.8)",
                  color: "#374151",
                  width: "100%",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, color: "#818CF8", marginBottom: 5 }}>
              {readCount} of {totalTopics} topics explored
            </div>
            <div
              style={{
                height: 6,
                background: "#C7D2FE",
                borderRadius: 99,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "#6366F1",
                  borderRadius: 99,
                  width: `${progressPct}%`,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ------ Category filter pills ----------- */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: "1.25rem",
        }}
      >
        <button
          onClick={() => setActiveCategory("all")}
          style={{
            fontSize: 12,
            padding: "5px 14px",
            borderRadius: 99,
            border: `0.5px solid ${activeCategory === "all" ? "#C7D2FE" : "#D1D5DB"}`,
            background: activeCategory === "all" ? "#EEF2FF" : "#fff",
            color: activeCategory === "all" ? "#4338CA" : "#6B7280",
            cursor: "pointer",
            fontWeight: activeCategory === "all" ? 500 : 400,
          }}
        >
          All topics
        </button>

        {LEARNING_CATEGORIES.map((cat) => {
          const meta = CATEGORY_META[cat];
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                fontSize: 12,
                padding: "5px 14px",
                borderRadius: 99,
                border: `0.5px solid ${active ? meta.dotColor : "#D1D5DB"}`,
                background: active ? "#fff" : "#fff",
                color: active ? meta.color : "#6B7280",
                cursor: "pointer",
                fontWeight: active ? 500 : 400,
                display: "flex",
                alignItems: "center",
                gap: 5,
                boxShadow: active ? `0 0 0 2px ${meta.dotColor}33` : "none",
              }}
            >
              <i className={meta.icon} />
              {cat}
            </button>
          );
        })}
      </div>

      {/* ------ No results ----------- */}
      {filteredTopics.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem 0" }}>
          <i
            className="bi bi-search"
            style={{
              fontSize: 32,
              color: "#D1D5DB",
              display: "block",
              marginBottom: 12,
            }}
          />
          <p style={{ fontSize: 14, color: "#9CA3AF" }}>
            No topics match <strong>"{searchQuery}"</strong>
          </p>
          <button
            onClick={() => setSearchQuery("")}
            style={{
              fontSize: 12,
              padding: "6px 16px",
              borderRadius: 8,
              border: "0.5px solid #D1D5DB",
              background: "#fff",
              color: "#374151",
              cursor: "pointer",
              marginTop: 8,
            }}
          >
            Clear search
          </button>
        </div>
      )}

      {/* -- Topic groups --------*/}
      {groupedTopics.map(({ category, topics }) => {
        const meta = CATEGORY_META[category as LearningCategory];
        return (
          <div key={category} style={{ marginBottom: "2rem" }}>
            {/* Section label */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: "0.75rem",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: meta.dotColor,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#6B7280" }}>
                {category}
              </span>
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 8px",
                  borderRadius: 99,
                  background: "#F3F4F6",
                  color: "#9CA3AF",
                }}
              >
                {topics.length}
              </span>
            </div>

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
  );
}
