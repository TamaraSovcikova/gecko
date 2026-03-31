import { ONBOARDING_PAGES, OnboardingPageKey } from "../onboarding/content";

const STORAGE_KEY = "zoar.onboarding.completedPages.v1";

const sanitizePages = (pages: string[]): OnboardingPageKey[] => {
  const allowed = new Set(ONBOARDING_PAGES);
  return Array.from(new Set(pages.filter((page): page is OnboardingPageKey => allowed.has(page as OnboardingPageKey))));
};

export const getLocalCompletedOnboardingPages = (): OnboardingPageKey[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return sanitizePages(parsed.map((item) => String(item)));
  } catch {
    return [];
  }
};

export const setLocalCompletedOnboardingPages = (pages: OnboardingPageKey[]) => {
  if (typeof window === "undefined") {
    return;
  }

  const sanitized = sanitizePages(pages);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
};

export const markLocalOnboardingPageComplete = (page: OnboardingPageKey): OnboardingPageKey[] => {
  const next = sanitizePages([...getLocalCompletedOnboardingPages(), page]);
  setLocalCompletedOnboardingPages(next);
  return next;
};

export const markLocalOnboardingPagesComplete = (pages: OnboardingPageKey[]): OnboardingPageKey[] => {
  const next = sanitizePages([...getLocalCompletedOnboardingPages(), ...pages]);
  setLocalCompletedOnboardingPages(next);
  return next;
};

export const resetLocalOnboardingPages = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
};
