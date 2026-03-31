import axios from "axios";
import { ONBOARDING_PAGES, OnboardingPageKey } from "../onboarding/content";

type ProfileResponse = {
  financialOnboarding?: {
    completedPages?: string[];
  };
};

const sanitizePages = (pages: string[]): OnboardingPageKey[] => {
  const allowed = new Set(ONBOARDING_PAGES);
  return Array.from(new Set(pages.filter((page): page is OnboardingPageKey => allowed.has(page as OnboardingPageKey))));
};

export const saveOnboardingCompletion = async (token: string, page: OnboardingPageKey): Promise<OnboardingPageKey[]> => {
  return saveOnboardingCompletions(token, [page]);
};

export const saveOnboardingCompletions = async (token: string, pages: OnboardingPageKey[]): Promise<OnboardingPageKey[]> => {
  const response = await axios.patch<ProfileResponse>(
    `${import.meta.env.VITE_API_URL}/api/v1/user/profile`,
    {
      onboarding: {
        completePages: pages,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return sanitizePages(response.data?.financialOnboarding?.completedPages || pages);
};

export const resetServerOnboarding = async (token: string): Promise<OnboardingPageKey[]> => {
  const response = await axios.patch<ProfileResponse>(
    `${import.meta.env.VITE_API_URL}/api/v1/user/profile`,
    {
      onboarding: {
        reset: true,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return sanitizePages(response.data?.financialOnboarding?.completedPages || []);
};
