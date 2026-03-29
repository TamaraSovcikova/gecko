// client/src/pages/Learn/TopicCard.tsx
// Learning topic card - pastel colour-coded by category, expandable detail,
// optional interactive widget, quiz CTA.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { LearningTopic } from "../../constants/learningContent";

// Interactive widget components - only rendered when expanded
import PayslipWalkthrough from "./PayslipWalkthrough";
import BudgetCalculator from "./BudgetCalculator";
import TaxBandVisualiser from "./TaxBandVisualiser";
import SavingsGoalTracker from "./SavingsGoalTracker";

// Map topic IDs to their interactive widget
const INTERACTIVE_WIDGETS: Record<string, React.ComponentType> = {
  "payslip-gross-net": PayslipWalkthrough,
  "budgeting-50-30-20": BudgetCalculator,
  "tax-codes": TaxBandVisualiser,
  "saving-goals": SavingsGoalTracker,
};

// Pastel colour palette per category
interface CategoryStyle {
  iconBg: string;
  iconColor: string;
  quizBg: string;
  quizColor: string;
  accentBorder: string;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  "Understanding Your Payslip": {
    iconBg: "#EEF2FF",
    iconColor: "#6366F1",
    quizBg: "#EEF2FF",
    quizColor: "#4338CA",
    accentBorder: "#C7D2FE",
  },
  "Budgeting Basics": {
    iconBg: "#F0FDFA",
    iconColor: "#0D9488",
    quizBg: "#F0FDFA",
    quizColor: "#0F766E",
    accentBorder: "#99F6E4",
  },
  "Tax Fundamentals": {
    iconBg: "#FFF7ED",
    iconColor: "#F97316",
    quizBg: "#FFF7ED",
    quizColor: "#C2410C",
    accentBorder: "#FED7AA",
  },
  "Saving and Financial Goals": {
    iconBg: "#FFFBEB",
    iconColor: "#D97706",
    quizBg: "#FFFBEB",
    quizColor: "#B45309",
    accentBorder: "#FDE68A",
  },
};

const FALLBACK_STYLE: CategoryStyle = {
  iconBg: "#F3F4F6",
  iconColor: "#6B7280",
  quizBg: "#F3F4F6",
  quizColor: "#374151",
  accentBorder: "#E5E7EB",
};

interface TopicCardProps {
  topic: LearningTopic;
  onRead?: (id: string) => void;
}

function renderDetail(text: string) {
  const lines = text.split("\n").filter((l) => l.trim());
  const elements: React.ReactNode[] = [];
  let bullets: string[] = [];

  const flush = () => {
    if (bullets.length > 0) {
      elements.push(
        <ul
          key={`ul-${elements.length}`}
          style={{ paddingLeft: "1.1rem", marginBottom: 8 }}
        >
          {bullets.map((b, i) => (
            <li
              key={i}
              style={{
                fontSize: 12,
                color: "#6B7280",
                marginBottom: 4,
                lineHeight: 1.55,
              }}
            >
              {b.replace(/^[•\-]\s*/, "")}
            </li>
          ))}
        </ul>,
      );
      bullets = [];
    }
  };

  lines.forEach((line, i) => {
    if (line.startsWith("•") || line.startsWith("-")) {
      bullets.push(line);
    } else {
      flush();
      elements.push(
        <p
          key={i}
          style={{
            fontSize: 12,
            color: "#6B7280",
            lineHeight: 1.6,
            marginBottom: 8,
          }}
        >
          {line}
        </p>,
      );
    }
  });
  flush();
  return elements;
}

export default function TopicCard({ topic, onRead }: TopicCardProps) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const style = CATEGORY_STYLES[topic.category] ?? FALLBACK_STYLE;
  const Widget = INTERACTIVE_WIDGETS[topic.id] ?? null;
  const hasWidget = Widget !== null;

  const handleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && onRead) onRead(topic.id);
  };

  const handleQuiz = () => {
    if (topic.linkedQuizId) navigate(`/quiz?category=${topic.linkedQuizId}`);
  };

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: `0.5px solid ${expanded ? style.accentBorder : "#E5E7EB"}`,
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: expanded ? "0 2px 12px rgba(0,0,0,0.06)" : "none",
        height: "100%",
      }}
    >
      {/* Icon + title */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: style.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <i
            className={`${topic.icon} fs-5`}
            style={{ color: style.iconColor }}
          />
        </div>
        <div style={{ paddingTop: 2 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#111827",
              lineHeight: 1.35,
            }}
          >
            {topic.title}
          </div>
          {hasWidget && (
            <span
              style={{
                fontSize: 10,
                padding: "1px 7px",
                borderRadius: 99,
                background: style.iconBg,
                color: style.iconColor,
                fontWeight: 500,
                display: "inline-block",
                marginTop: 3,
              }}
            >
              ✦ Interactive
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6, margin: 0 }}>
        {topic.summary}
      </p>

      {/* Expandable section */}
      <div style={{ marginTop: "auto" }}>
        <button
          onClick={handleExpand}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontSize: 12,
            color: style.iconColor,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontWeight: 500,
            marginBottom: expanded ? 10 : 0,
          }}
        >
          <i
            className={`bi ${expanded ? "bi-chevron-up" : "bi-chevron-down"}`}
          />
          {expanded ? "Show less" : hasWidget ? "Try it" : "Learn more"}
        </button>

        {expanded && (
          <div
            style={{
              borderTop: `0.5px solid ${style.accentBorder}`,
              paddingTop: 12,
              marginBottom: 12,
            }}
          >
            {/* Interactive widget first if available, then text detail */}
            {hasWidget && Widget ? (
              <>
                <Widget />
                {/* Collapsible text detail below widget */}
                <details style={{ marginTop: 12 }}>
                  <summary
                    style={{
                      fontSize: 12,
                      color: "#9CA3AF",
                      cursor: "pointer",
                      listStyle: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <i className="bi bi-book" />
                    Read the full explanation
                  </summary>
                  <div style={{ marginTop: 10 }}>
                    {renderDetail(topic.detail)}
                  </div>
                </details>
              </>
            ) : (
              renderDetail(topic.detail)
            )}
          </div>
        )}

        {/* Quiz CTA */}
        {topic.linkedQuizId && topic.linkedQuizLabel && (
          <button
            onClick={handleQuiz}
            style={{
              width: "100%",
              fontSize: 12,
              padding: "7px 10px",
              borderRadius: 9,
              border: "none",
              background: style.quizBg,
              color: style.quizColor,
              cursor: "pointer",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <i className="bi bi-patch-question" />
            {topic.linkedQuizLabel}
          </button>
        )}
      </div>
    </div>
  );
}
