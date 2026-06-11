import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";
import { OnboardingStep } from "../onboarding/content";

type Props = {
  isOpen: boolean;
  activeStepNumber: number;
  steps: OnboardingStep[];
  onClose: () => void;
  onComplete: () => void;
  onGoToStep: (stepNumber: number) => void;
};

const TooltipGuide = ({ isOpen, activeStepNumber, steps, onClose, onComplete, onGoToStep }: Props) => {
  const [dismissed, setDismissed] = useState(false);

  const activeIndex = useMemo(
    () => (steps ?? []).findIndex((s) => s.number === activeStepNumber),
    [activeStepNumber, steps]
  );
  const activeStep = activeIndex >= 0 ? steps[activeIndex] : (steps[0] ?? null);
  const isLastStep = activeIndex >= steps.length - 1;
  const isFirstStep = activeIndex <= 0;

  const goPrev = () => {
    if (!isFirstStep) onGoToStep(steps[activeIndex - 1].number);
  };
  const goNext = () => {
    if (isLastStep) {
      onComplete();
      setDismissed(true);
    } else onGoToStep(steps[activeIndex + 1].number);
  };
  const dismiss = () => {
    setDismissed(true);
    onClose();
  };

  const reopen = () => {
    setDismissed(false);
    if (steps[0]) onGoToStep(steps[0].number);
  };

  if (!steps.length) return null;

  const stepCount = steps.length;
  const currentNum = activeIndex >= 0 ? activeIndex + 1 : 1;

  return (
    <>
      {/* Main tip card */}
      <AnimatePresence>
        {isOpen && !dismissed && activeStep && (
          <motion.div
            key="tip-card"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-20 left-4 z-[2500] w-72 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden"
            style={{ fontFamily: "Manrope, Segoe UI, Arial, sans-serif" }}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-3.5 pt-3 pb-0">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-amber-50 flex items-center justify-center">
                  <Lightbulb className="w-3 h-3 text-amber-500" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Tip {currentNum} of {stepCount}
                </span>
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="p-1 text-gray-300 hover:text-gray-500 transition-colors rounded-md"
                aria-label="Dismiss tips"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-3.5 pt-2 pb-3">
              <p className="text-sm font-bold text-gray-900 mb-1">{activeStep.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{activeStep.body}</p>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1 pb-2">
              {steps.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onGoToStep(steps[i].number)}
                  className={`rounded-full transition-all ${i === activeIndex ? "w-4 h-1.5 bg-purple-600" : "w-1.5 h-1.5 bg-gray-200 hover:bg-gray-300"}`}
                  aria-label={`Go to tip ${i + 1}`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between px-3 pb-3">
              <button
                type="button"
                onClick={goPrev}
                disabled={isFirstStep}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-gray-50"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <button
                type="button"
                onClick={goNext}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                {isLastStep ? "Done" : "Next"}
                {!isLastStep && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Re-open pill - only when dismissed and not in the way of the chat FAB */}
      <AnimatePresence>
        {dismissed && (
          <motion.button
            key="reopen"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            type="button"
            onClick={reopen}
            className="fixed bottom-20 left-4 z-[2500] flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-700 hover:border-gray-300 shadow-sm transition-colors"
          >
            <Lightbulb className="w-3 h-3 text-amber-400" />
            Page tips
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};

export default TooltipGuide;
