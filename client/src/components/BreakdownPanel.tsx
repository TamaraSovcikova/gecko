import { useEffect } from "react";

type HealthFactor = {
  key: string;
  title: string;
  weight: number;
  score: number;
  contribution: number;
  impact: "helping" | "lowering" | "neutral";
  valueLabel: string;
  explanation: string;
};

type HealthBreakdown = {
  healthScore: number;
  hasEnoughData: boolean;
  summary: string;
  factors: HealthFactor[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  breakdown?: HealthBreakdown | null;
};

const impactStyle = (impact: HealthFactor["impact"]) => {
  switch (impact) {
    case "helping":
      return { label: "Helping your score", color: "#2f6a4b", bg: "#e7f2eb" };
    case "lowering":
      return { label: "Lowering your score", color: "#8f3f3f", bg: "#f9ebeb" };
    default:
      return { label: "Neutral impact", color: "#5d675f", bg: "#edf0ec" };
  }
};

const BreakdownPanel = ({ isOpen, onClose, breakdown }: Props) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(34, 43, 34, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        zIndex: 1400,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Health score breakdown"
        data-onboarding="dashboard-health-breakdown-panel"
        style={{
          width: "min(760px, 100%)",
          maxHeight: "85vh",
          overflowY: "auto",
          backgroundColor: "#fff",
          borderRadius: "14px",
          border: "1px solid #dfd8cc",
          boxShadow: "0 16px 32px rgba(40, 47, 40, 0.22)",
          padding: "22px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
          <div>
            <p style={{ margin: 0, color: "#7c847c", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "12px" }}>
              Financial health
            </p>
            <h2 style={{ margin: "6px 0 0", color: "#305843", fontWeight: 500 }}>Score breakdown</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-onboarding="dashboard-health-breakdown-close"
            style={{ border: "1px solid #d7d1c6", borderRadius: "999px", padding: "8px 14px", backgroundColor: "#fff" }}
          >
            Close
          </button>
        </div>

        {!breakdown?.hasEnoughData ? (
          <div style={{ marginTop: "20px", backgroundColor: "#f7f7f4", border: "1px solid #e3dfd6", borderRadius: "12px", padding: "16px" }}>
            <p style={{ margin: 0, color: "#4f5950" }}>
              {breakdown?.summary || "Not enough data yet to generate a breakdown."}
            </p>
            <p style={{ margin: "12px 0 0", fontSize: "13px", color: "#6e756e" }}>
              Add a payslip and log some expenses to unlock a full score explanation.
            </p>
          </div>
        ) : (
          <>
            <p style={{ margin: "16px 0 0", color: "#4a544d", lineHeight: 1.55 }}>{breakdown.summary}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "12px", marginTop: "16px" }} data-onboarding="dashboard-health-breakdown-factors">
              {breakdown.factors.map((factor) => {
                const tone = impactStyle(factor.impact);
                return (
                  <section key={factor.key} style={{ border: "1px solid #e5dfd5", borderRadius: "12px", padding: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                      <h3 style={{ margin: 0, fontSize: "16px", color: "#2f4838" }}>{factor.title}</h3>
                      <span style={{ fontSize: "12px", color: "#667068" }}>Weight {factor.weight}%</span>
                    </div>
                    <p style={{ margin: "10px 0 0", fontSize: "13px", color: "#5d655f" }}>{factor.valueLabel}</p>
                    <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#475148" }}>{factor.explanation}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                      <span style={{ fontSize: "12px", padding: "6px 10px", borderRadius: "999px", backgroundColor: tone.bg, color: tone.color, fontWeight: 600 }}>
                        {tone.label}
                      </span>
                      <span style={{ fontSize: "12px", color: "#5f6861" }}>Contribution {factor.contribution.toFixed(1)}</span>
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}

        <div style={{ marginTop: "18px", borderTop: "1px solid #ece6dc", paddingTop: "12px" }}>
          <p style={{ margin: 0, color: "#6f766f", fontSize: "13px" }}>
            Score shown: <strong style={{ color: "#2e5b44" }}>{breakdown?.healthScore ?? 0}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BreakdownPanel;
