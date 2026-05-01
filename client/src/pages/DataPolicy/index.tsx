import { useState } from "react";
import { Link } from "react-router-dom";
import TopNav from "../../components/TopNav";
import { useAuth } from "../../context/AuthContext";
import TooltipGuide from "../../components/TooltipGuide";
import { usePageOnboarding } from "../../hooks/usePageOnboarding";

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
    <div style={{ minHeight: "100vh", backgroundColor: "#faf9fd", padding: "20px" }}>
      <TopNav />
      <div style={{ maxWidth: "980px", margin: "24px auto", background: "#fff", padding: "28px", borderRadius: "14px", border: "1px solid #c9bde8" }}>
        <p style={{ margin: 0, color: "#7a6e99", textTransform: "uppercase", letterSpacing: "0.08em" }}>Last updated: 29 March 2026</p>
        <h1 style={{ margin: "10px 0 20px", color: "#5c3fa3", fontWeight: 300, fontSize: "44px" }} data-onboarding="data-policy-heading">Data Policy</h1>

        <section style={{ color: "#4a3f6b", lineHeight: 1.7 }}>
          <h2 style={{ color: "#5c3fa3", fontSize: "22px" }}>What data we collect</h2>
          <p>
            We collect account metadata such as username and authentication identifiers, payslip
            and budgeting information you enter, expense records you log, and quiz activity where
            quiz features are used. We only aim to collect the data needed to operate the app and
            improve budgeting-related features.
          </p>

          <h2 style={{ color: "#5c3fa3", fontSize: "22px" }}>Why we collect it</h2>
          <p>
            We use this data to authenticate users, calculate payslip and budget views, show spending
            dashboards, support educational and quiz features, and maintain account-management tools
            such as profile updates and deletion.
          </p>

          <h2 style={{ color: "#5c3fa3", fontSize: "22px" }}>How it is stored</h2>
          <p>
            Authentication is handled through Firebase Auth. Profile metadata, payslip information,
            budgeting records, expenses, and related audit metadata are stored in MongoDB Atlas.
            We aim to keep storage limited to what the application currently needs.
          </p>

          <h2 style={{ color: "#5c3fa3", fontSize: "22px" }}>Who can access it</h2>
          <p>
            Access is intended to be limited to the development team operating this project and,
            where required for project oversight or administration, relevant university staff or admins.
            We do not aim to sell your data or share it with unrelated third parties.
          </p>

          <h2 style={{ color: "#5c3fa3", fontSize: "22px" }}>Consent</h2>
          <p>
            Where registration or onboarding asks for consent, we aim to use that consent as the basis
            for optional processing. If the implementation changes, this policy should be reviewed so the
            wording stays aligned with the actual consent flow shown in the app.
          </p>

          <h2 style={{ color: "#5c3fa3", fontSize: "22px" }}>Your rights</h2>
          <p>
            You can ask to access, correct, or delete your data. The app already includes account deletion
            functionality, and we aim to keep that flow transparent. Where full GDPR compliance has not yet
            been independently verified, this document is intended as a best-practice draft rather than a
            legal guarantee.
          </p>
        </section>

        <div style={{ marginTop: "28px", padding: "18px", borderRadius: "12px", border: "1px solid #c9bde8", backgroundColor: "#faf9fd" }}>
          <button
            type="button"
            onClick={() => setShowDeleteHelp((value) => !value)}
            style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #c9bde8", backgroundColor: "#fff", color: "#e05c5c", fontWeight: 700 }}
          >
            Delete my account and data
          </button>

          {showDeleteHelp && (
            <div style={{ marginTop: "14px", color: "#4a3f6b", lineHeight: 1.6 }}>
              <p>
                This link is a draft entry point. The deletion workflow already exists inside the authenticated
                profile area, while a fuller public-facing confirmation flow is still being refined.
              </p>
              {currentUser ? (
                <Link to="/profile" style={{ color: "#5c3fa3", fontWeight: 700 }}>
                  Go to Profile to manage deletion
                </Link>
              ) : (
                <Link to="/login" style={{ color: "#5c3fa3", fontWeight: 700 }}>
                  Sign in to manage deletion requests
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