import { useState } from "react";
import { Link } from "react-router-dom";
import TopNav from "../../components/TopNav";
import { useAuth } from "../../context/AuthContext";
import TooltipGuide from "../../components/TooltipGuide";
import { usePageOnboarding } from "../../hooks/usePageOnboarding";
import { DataPolicyContent } from "../../components/LegalContent";

const DataPolicyPage = () => {
  const [showDeleteHelp, setShowDeleteHelp] = useState(false);
  const { currentUser } = useAuth();
  const {
    isOpen: isOnboardingOpen,
    activeStepNumber,
    steps: onboardingSteps,
    closeGuide,
    completeGuide,
    goToStep,
  } = usePageOnboarding("/data-policy");

  return (
    <div className="app-page">
      <TopNav />
      <div className="app-content app-surface">
        <p className="app-section-eyebrow">Last updated: 11 May 2026</p>
        <h1 className="app-page-title" data-onboarding="data-policy-heading">Data Policy</h1>

        <section className="app-prose">
          <DataPolicyContent />
        </section>

        <div style={{ marginTop: "28px", padding: "18px", borderRadius: "12px", border: "1px solid #c9bde8", backgroundColor: "#faf9fd" }}>
          <button
            type="button"
            onClick={() => setShowDeleteHelp((value) => !value)}
            className="gecko-pill-btn"
            style={{ color: "#e05c5c" }}
          >
            Delete my account and data
          </button>

          {showDeleteHelp && (
            <div style={{ marginTop: "14px", color: "#4a3f6b", lineHeight: 1.6 }}>
              {currentUser ? (
                <Link to="/profile" style={{ color: "#5c3fa3", fontWeight: 700 }}>
                  Go to Profile to delete your account
                </Link>
              ) : (
                <Link to="/login" style={{ color: "#5c3fa3", fontWeight: 700 }}>
                  Sign in to delete your account
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
      <TooltipGuide
        isOpen={isOnboardingOpen}
        activeStepNumber={activeStepNumber}
        steps={onboardingSteps}
        onClose={closeGuide}
        onComplete={completeGuide}
        onGoToStep={goToStep}
      />
    </div>
  );
};

export default DataPolicyPage;