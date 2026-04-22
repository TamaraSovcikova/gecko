import TopNav from "../../components/TopNav";
import TooltipGuide from "../../components/TooltipGuide";
import { usePageOnboarding } from "../../hooks/usePageOnboarding";

const Terms = () => {
  const {
    isOpen: isOnboardingOpen,
    activeStepNumber,
    steps: onboardingSteps,
    closeGuide,
    completeGuide,
    goToStep,
  } = usePageOnboarding("/terms");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fafaf8", padding: "20px" }}>
      <TopNav />
      <div style={{ maxWidth: "980px", margin: "24px auto", background: "#fff", padding: "28px", borderRadius: "14px", border: "1px solid #e8e3dc" }}>
        <p style={{ margin: 0, color: "#7f8678", textTransform: "uppercase", letterSpacing: "0.08em" }}>Last updated: 29 March 2026</p>
        <h1 style={{ margin: "10px 0 20px", color: "#355f46", fontWeight: 300, fontSize: "44px" }} data-onboarding="terms-heading">Terms & Conditions</h1>

        <section style={{ color: "#4d504f", lineHeight: 1.7 }}>
          <h2 style={{ color: "#355f46", fontSize: "22px" }}>Using the service</h2>
          <p>
            G.E.C.K.O is a student project that aims to help users understand payslips,
            manage budgets, and review spending habits. You agree to use the app lawfully and not
            to misuse the service, interfere with other users, or attempt to access data that is
            not yours.
          </p>

          <h2 style={{ color: "#355f46", fontSize: "22px" }}>Account responsibilities</h2>
          <p>
            You are responsible for the accuracy of the information you enter, including payslip,
            budgeting, and expense data. You are also responsible for maintaining access to your
            sign-in provider, including Firebase email/password or Google sign-in where applicable.
          </p>

          <h2 style={{ color: "#355f46", fontSize: "22px" }}>Third-party services</h2>
          <p>
            Some features rely on third-party services such as Firebase Auth for authentication,
            MongoDB Atlas for data storage, Adzuna for salary and job-market information, and quiz
            providers such as QuizApi where quiz features are enabled. We aim to present third-party
            results accurately, but we cannot guarantee those external services are always available
            or error-free.
          </p>

          <h2 style={{ color: "#355f46", fontSize: "22px" }}>Service availability</h2>
          <p>
            This project is provided on a best-effort basis. We aim to keep the service available,
            but downtime, incomplete features, or data inconsistencies may occur while the project
            is under active development and review.
          </p>

          <h2 style={{ color: "#355f46", fontSize: "22px" }}>Acceptable use</h2>
          <p>
            You must not upload malicious content, abuse the API, try to bypass authentication,
            or use the platform in a way that could disrupt service operation or compromise privacy.
          </p>

          <h2 style={{ color: "#355f46", fontSize: "22px" }}>Disclaimer</h2>
          <p>
            G.E.C.K.O is not financial, tax, legal, or employment advice. It is intended
            as an educational budgeting tool, and you should verify important decisions using trusted
            official sources.
          </p>
        </section>
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

export default Terms;
