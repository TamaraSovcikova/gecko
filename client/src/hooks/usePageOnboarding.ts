import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { saveOnboardingCompletions } from "../api/onboardingApi";
import { getStepByNumber, getStepsForRoute, ONBOARDING_PAGES, ONBOARDING_STEPS, OnboardingPageKey } from "../onboarding/content";
import { getLocalCompletedOnboardingPages, markLocalOnboardingPageComplete, markLocalOnboardingPagesComplete } from "../utils/onboardingState";

type State = {
  isOpen: boolean;
  activeStepNumber: number;
  currentRoute: OnboardingPageKey;
  steps: typeof ONBOARDING_STEPS;
  closeGuide: () => Promise<void>;
  completeGuide: () => Promise<void>;
  goToStep: (stepNumber: number) => void;
};

const ACTIVE_STEP_KEY = "zoar.onboarding.activeStepNumber";

const readActiveStep = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(ACTIVE_STEP_KEY);
  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const storeActiveStep = (stepNumber: number | null) => {
  if (typeof window === "undefined") {
    return;
  }

  if (stepNumber === null) {
    window.sessionStorage.removeItem(ACTIVE_STEP_KEY);
    return;
  }

  window.sessionStorage.setItem(ACTIVE_STEP_KEY, String(stepNumber));
};

export const usePageOnboarding = (page: OnboardingPageKey, enabled = true): State => {
  const navigate = useNavigate();
  const { token, loading, profile, setProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeStepNumber, setActiveStepNumber] = useState<number>(1);
  const persistActiveStepRef = useRef(false);

  const routeSteps = useMemo(() => getStepsForRoute(page), [page]);

  useEffect(() => {
    if (!enabled || loading) {
      setIsOpen(false);
      return;
    }

    const forcedStepNumber = readActiveStep();
    if (forcedStepNumber !== null && getStepByNumber(forcedStepNumber)) {
      setIsOpen(true);
      setActiveStepNumber(forcedStepNumber);
      persistActiveStepRef.current = true;
      return;
    }

    const completedPages = token
      ? profile?.onboardingCompletedPages || []
      : getLocalCompletedOnboardingPages();

    const firstStepForRoute = routeSteps[0];
    if (!firstStepForRoute) {
      setIsOpen(false);
      return;
    }

    if (!completedPages.includes(page)) {
      setIsOpen(true);
      setActiveStepNumber(firstStepForRoute.number);
      persistActiveStepRef.current = false;
      return;
    }

    setIsOpen(false);
  }, [enabled, loading, page, profile?.onboardingCompletedPages, routeSteps, token]);

  useEffect(() => {
    if (!persistActiveStepRef.current) {
      return;
    }

    const step = getStepByNumber(activeStepNumber);
    if (!step) {
      return;
    }

    if (step.route === page) {
      storeActiveStep(step.number);
    }
  }, [activeStepNumber, page]);

  const persistCompletionForPage = async () => {
    const localPages = markLocalOnboardingPageComplete(page);

    if (!token) {
      return localPages;
    }

    try {
      const serverPages = await saveOnboardingCompletions(token, [page]);
      return serverPages;
    } catch {
      return localPages;
    }
  };

  const persistCompletionForAll = async () => {
    const localPages = markLocalOnboardingPagesComplete(ONBOARDING_PAGES);

    if (!token) {
      return localPages;
    }

    try {
      const serverPages = await saveOnboardingCompletions(token, ONBOARDING_PAGES);
      return serverPages;
    } catch {
      return localPages;
    }
  };

  const closeGuide = async () => {
    const completedPages = await persistCompletionForPage();
    setProfile((previous) => ({
      ...(previous || {}),
      onboardingCompletedPages: completedPages,
    }));
    persistActiveStepRef.current = false;
    setIsOpen(false);
    storeActiveStep(null);
  };

  const completeGuide = async () => {
    const completedPages = await persistCompletionForAll();
    setProfile((previous) => ({
      ...(previous || {}),
      onboardingCompletedPages: completedPages,
    }));
    persistActiveStepRef.current = false;
    setIsOpen(false);
    storeActiveStep(null);
  };

  const goToStep = (stepNumber: number) => {
    const step = getStepByNumber(stepNumber);
    if (!step) {
      return;
    }

    persistActiveStepRef.current = true;
    storeActiveStep(step.number);
    if (step.route !== page) {
      navigate(step.route);
      return;
    }

    setIsOpen(true);
    setActiveStepNumber(step.number);
  };

  return {
    isOpen,
    activeStepNumber,
    currentRoute: page,
    steps: ONBOARDING_STEPS,
    closeGuide,
    completeGuide,
    goToStep,
  };
};
