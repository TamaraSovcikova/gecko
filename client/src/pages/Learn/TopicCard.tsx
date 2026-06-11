import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import type { LearningTopic } from "../../constants/learningContent";
import TopicModal from "./TopicModal";
import { cn } from "../../lib/utils";

const INTERACTIVE_TOPIC_IDS = new Set(["payslip-gross-net", "budgeting-50-30-20", "tax-codes", "saving-goals"]);

const CATEGORY_STYLES: Record<string, { iconBg: string; iconColor: string; accent: string; border: string }> = {
  "Understanding Your Payslip": { iconBg: "#EEF2FF", iconColor: "#6366F1", accent: "#6366F1", border: "#C7D2FE" },
  "Budgeting Basics": { iconBg: "#F0FDFA", iconColor: "#0D9488", accent: "#0D9488", border: "#99F6E4" },
  "Tax Fundamentals": { iconBg: "#FFF7ED", iconColor: "#EA580C", accent: "#EA580C", border: "#FED7AA" },
  "Saving and Financial Goals": { iconBg: "#FFFBEB", iconColor: "#D97706", accent: "#D97706", border: "#FDE68A" },
};

const FALLBACK = { iconBg: "#F3F4F6", iconColor: "#6B7280", accent: "#6B7280", border: "#E5E7EB" };

interface TopicCardProps {
  topic: LearningTopic;
  onRead?: (id: string) => void;
  isRead?: boolean;
}

export default function TopicCard({ topic, onRead, isRead = false }: TopicCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const style = CATEGORY_STYLES[topic.category] ?? FALLBACK;
  const hasWidget = INTERACTIVE_TOPIC_IDS.has(topic.id);
  const shortSummary = topic.summary.split(". ")[0] + ".";

  const openModal = () => {
    setModalOpen(true);
    if (onRead) onRead(topic.id);
  };

  const handleQuiz = (quizId: string) => {
    setModalOpen(false);
    navigate(`/quiz?topic=${quizId}`);
  };

  return (
    <>
      <div
        className={cn(
          "bg-white rounded-xl border p-4 flex flex-col gap-3 h-full transition-all duration-150 cursor-pointer group",
          "hover:shadow-md hover:-translate-y-px",
          isRead ? "border-gray-200" : "border-gray-200 hover:border-opacity-80"
        )}
        style={isRead ? {} : ({ "--hover-border": style.border } as React.CSSProperties)}
        onMouseEnter={(e) => {
          if (!isRead) (e.currentTarget as HTMLDivElement).style.borderColor = style.border;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "";
        }}
        onClick={openModal}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && openModal()}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 leading-snug flex-1">{topic.title}</p>
          {isRead && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: style.accent }} />}
        </div>

        {/* Badges */}
        {(hasWidget || isRead) && (
          <div className="flex flex-wrap gap-1.5">
            {hasWidget && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{ background: style.iconBg, color: style.accent }}
              >
                ✦ Interactive
              </span>
            )}
            {isRead && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500">
                Read
              </span>
            )}
          </div>
        )}

        {/* Summary */}
        <p className="text-xs text-gray-500 leading-relaxed flex-1">{shortSummary}</p>

        {/* CTA */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            openModal();
          }}
          className="w-full text-xs font-semibold py-2 px-3 rounded-lg border transition-all mt-auto text-center"
          style={{
            background: style.iconBg,
            color: style.accent,
            borderColor: style.border,
          }}
        >
          {isRead ? "Review" : "Learn more"}
        </button>
      </div>

      {modalOpen && <TopicModal topic={topic} onClose={() => setModalOpen(false)} onQuiz={handleQuiz} />}
    </>
  );
}
