// client/src/pages/Learn/TopicCard.tsx
// Slim topic card — shows icon, title, and a one-line summary.
// "Learn more" opens TopicModal for the full explanation + interactive widget.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { LearningTopic } from "../../constants/learningContent";
import TopicModal from "./TopicModal";

const INTERACTIVE_TOPIC_IDS = new Set([
  "payslip-gross-net",
  "budgeting-50-30-20",
  "tax-codes",
  "saving-goals",
]);

interface CategoryStyle {
  iconBg: string;
  iconColor: string;
  accent: string;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  "Understanding Your Payslip": {
    iconBg: "#EEF2FF",
    iconColor: "#6366F1",
    accent: "#6366F1",
  },
  "Budgeting Basics": {
    iconBg: "#F0FDFA",
    iconColor: "#0D9488",
    accent: "#0D9488",
  },
  "Tax Fundamentals": {
    iconBg: "#FFF7ED",
    iconColor: "#F97316",
    accent: "#F97316",
  },
  "Saving and Financial Goals": {
    iconBg: "#FFFBEB",
    iconColor: "#D97706",
    accent: "#D97706",
  },
};

const FALLBACK: CategoryStyle = {
  iconBg: "#F3F4F6",
  iconColor: "#6B7280",
  accent: "#6B7280",
};

interface TopicCardProps {
  topic: LearningTopic;
  onRead?: (id: string) => void;
}

export default function TopicCard({ topic, onRead }: TopicCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const style = CATEGORY_STYLES[topic.category] ?? FALLBACK;
  const hasWidget = INTERACTIVE_TOPIC_IDS.has(topic.id);

  const openModal = () => {
    setModalOpen(true);
    if (onRead) onRead(topic.id);
  };

  const handleQuiz = (quizId: string) => {
    setModalOpen(false);
    navigate(`/quiz?topic=${quizId}`);
  };

  // First sentence only to keep cards compact
  const shortSummary = topic.summary.split(". ")[0] + ".";

  return (
    <>
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          border: "0.5px solid #E5E7EB",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          height: "100%",
          transition: "box-shadow 0.15s, border-color 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 2px 14px rgba(0,0,0,0.07)";
          (e.currentTarget as HTMLDivElement).style.borderColor =
            style.accent + "55";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
          (e.currentTarget as HTMLDivElement).style.borderColor = "#E5E7EB";
        }}
      >
        {/* Icon + title */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flex: 1, paddingTop: 1 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#111827",
                lineHeight: 1.3,
                marginBottom: hasWidget ? 3 : 0,
              }}
            >
              {topic.title}
            </div>
            {hasWidget && (
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 6px",
                  borderRadius: 99,
                  background: style.iconBg,
                  color: style.accent,
                  fontWeight: 500,
                  display: "inline-block",
                }}
              >
                ✦ Interactive
              </span>
            )}
          </div>
        </div>

        {/* One-line summary */}
        <p
          style={{
            fontSize: 12,
            color: "#6B7280",
            lineHeight: 1.6,
            margin: 0,
            flex: 1,
          }}
        >
          {shortSummary}
        </p>

        {/* Learn more */}
        <button
          onClick={openModal}
          style={{
            width: "100%",
            fontSize: 12,
            padding: "5px 10px",
            borderRadius: 9,
            border: `0.5px solid ${style.accent}33`,
            background: style.iconBg,
            color: style.accent,
            cursor: "pointer",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            marginTop: "auto",
          }}
        >
          <i className="bi bi-book" style={{ fontSize: 11 }} />
          Learn more
        </button>
      </div>

      {modalOpen && (
        <TopicModal
          topic={topic}
          onClose={() => setModalOpen(false)}
          onQuiz={handleQuiz}
        />
      )}
    </>
  );
}
