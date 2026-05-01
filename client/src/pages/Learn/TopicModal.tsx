// client/src/pages/Learn/TopicModal.tsx
// Modal that opens when the user clicks "Learn more" on a topic card.
// Shows the interactive widget (if the topic has one) followed by the
// full plain-English detail text.

import { useEffect } from "react";
import type { LearningTopic } from "../../constants/learningContent";
import PayslipWalkthrough from "./PayslipWalkthrough";
import BudgetCalculator from "./BudgetCalculator";
import TaxBandVisualiser from "./TaxBandVisualiser";
import SavingsGoalTracker from "./SavingsGoalTracker";

const INTERACTIVE_WIDGETS: Record<string, React.ComponentType> = {
  "payslip-gross-net": PayslipWalkthrough,
  "budgeting-50-30-20": BudgetCalculator,
  "tax-codes": TaxBandVisualiser,
  "saving-goals": SavingsGoalTracker,
};

interface CategoryStyle {
  accent: string;
  accentBg: string;
  iconBg: string;
  iconColor: string;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  "Understanding Your Payslip": {
    accent: "#6366F1",
    accentBg: "#EEF2FF",
    iconBg: "#EEF2FF",
    iconColor: "#6366F1",
  },
  "Budgeting Basics": {
    accent: "#0D9488",
    accentBg: "#F0FDFA",
    iconBg: "#F0FDFA",
    iconColor: "#0D9488",
  },
  "Tax Fundamentals": {
    accent: "#F97316",
    accentBg: "#FFF7ED",
    iconBg: "#FFF7ED",
    iconColor: "#F97316",
  },
  "Saving and Financial Goals": {
    accent: "#D97706",
    accentBg: "#FFFBEB",
    iconBg: "#FFFBEB",
    iconColor: "#D97706",
  },
};

const FALLBACK: CategoryStyle = {
  accent: "#6B7280",
  accentBg: "#F3F4F6",
  iconBg: "#F3F4F6",
  iconColor: "#6B7280",
};

function renderDetail(text: string) {
  const lines = text.split("\n").filter((l) => l.trim());
  const elements: React.ReactNode[] = [];
  let bullets: string[] = [];

  const flush = (key: string) => {
    if (bullets.length > 0) {
      elements.push(
        <ul
          key={key}
          style={{ paddingLeft: "1.2rem", marginBottom: 12, marginTop: 0 }}
        >
          {bullets.map((b, i) => (
            <li
              key={i}
              style={{
                fontSize: 14,
                color: "#374151",
                marginBottom: 6,
                lineHeight: 1.65,
              }}
            >
              {b.replace(/^[•-]\s*/, "")}
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
      flush(`ul-${i}`);
      // Bold any leading label like "Heading:" before the text
      const colonIdx = line.indexOf(":");
      if (colonIdx > 0 && colonIdx < 40 && !line.startsWith("http")) {
        const label = line.slice(0, colonIdx + 1);
        const rest = line.slice(colonIdx + 1);
        elements.push(
          <p
            key={i}
            style={{
              fontSize: 14,
              color: "#374151",
              lineHeight: 1.65,
              marginBottom: 10,
            }}
          >
            <strong style={{ color: "#111827" }}>{label}</strong>
            {rest}
          </p>,
        );
      } else {
        elements.push(
          <p
            key={i}
            style={{
              fontSize: 14,
              color: "#374151",
              lineHeight: 1.65,
              marginBottom: 10,
            }}
          >
            {line}
          </p>,
        );
      }
    }
  });
  flush("ul-final");
  return elements;
}

interface TopicModalProps {
  topic: LearningTopic;
  onClose: () => void;
  onQuiz?: (quizId: string) => void;
}

export default function TopicModal({
  topic,
  onClose,
  onQuiz,
}: TopicModalProps) {
  const style = CATEGORY_STYLES[topic.category] ?? FALLBACK;
  const Widget = INTERACTIVE_WIDGETS[topic.id] ?? null;

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    // Prevent body scroll while modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 1050,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backdropFilter: "blur(2px)",
      }}
    >
      {/* Modal panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 20,
          width: "100%",
          maxWidth: 640,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: style.accentBg,
            padding: "1.25rem 1.5rem",
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            borderBottom: `0.5px solid ${style.iconBg === "#EEF2FF" ? "#C7D2FE" : "#E5E7EB"}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "rgba(255,255,255,0.7)",
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                color: style.accent,
                fontWeight: 500,
                marginBottom: 2,
              }}
            >
              {topic.category}
            </div>
            <h2
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "#111827",
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {topic.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "rgba(255,255,255,0.7)",
              border: "none",
              borderRadius: 8,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              color: "#6B7280",
              fontSize: 14,
            }}
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "1.5rem" }}>
          {/* Summary */}
          <p
            style={{
              fontSize: 14,
              color: "#6B7280",
              lineHeight: 1.7,
              marginBottom: "1.5rem",
              borderLeft: `3px solid ${style.accent}`,
              paddingLeft: 12,
            }}
          >
            {topic.summary}
          </p>

          {/* Interactive widget */}
          {Widget && (
            <div style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: style.accent,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <i className="bi bi-stars" />
                Try it yourself
              </div>
              <div
                style={{
                  background: style.accentBg,
                  borderRadius: 14,
                  padding: "1.1rem",
                  border: `0.5px solid ${style.iconColor}22`,
                }}
              >
                <Widget />
              </div>
            </div>
          )}

          {/* Full detail */}
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#9CA3AF",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 12,
              }}
            >
              The full picture
            </div>
            {renderDetail(topic.detail)}
          </div>
        </div>

        {/* Footer — quiz CTA */}
        {topic.linkedQuizId && topic.linkedQuizLabel && (
          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "0.5px solid #E5E7EB",
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => {
                if (onQuiz && topic.linkedQuizId) onQuiz(topic.linkedQuizId);
              }}
              style={{
                width: "100%",
                fontSize: 14,
                padding: "10px 16px",
                borderRadius: 12,
                border: "none",
                background: style.accent,
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <i className="bi bi-patch-question" />
              {topic.linkedQuizLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
