import TopNav from "../../components/TopNav";
import TooltipGuide from "../../components/TooltipGuide";
import { usePageOnboarding } from "../../hooks/usePageOnboarding";
import { TermsContent } from "../../components/LegalContent";

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
    <div className="app-page">
      <TopNav />
      <div className="app-content app-surface">
        <p className="app-section-eyebrow">Last updated: 11 May 2026</p>
        <h1 className="app-page-title" data-onboarding="terms-heading">Terms & Conditions</h1>

        <section className="app-prose">
          <TermsContent />
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
