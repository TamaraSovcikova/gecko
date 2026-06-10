// api/hooks/useProfile.ts - Example TanStack Query hook for the user profile.
//
// Pattern to follow when migrating other pages off raw fetch/axios:
//   1. Keyed query (["profile"]) so cache invalidation is targeted.
//   2. enabled flag tied to auth so it only fires when logged in.
//   3. Mutation invalidates the query on success.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";

export type ProfileResponse = {
  _id: string;
  email: string;
  displayName: string;
  avatarChoice?: string;
  newsletterOptIn?: boolean;
  hasCompletedOnboarding?: boolean;
  payslipData?: {
    grossSalary?: number;
    jobTitle?: string;
    location?: string;
  };
  xp?: number;
  level?: number;
  weeklyStreak?: number;
};

const PROFILE_KEY = ["profile"] as const;

export const useProfile = (enabled = true) => {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<ProfileResponse>("/api/v1/user/profile");
      return data;
    },
    enabled,
  });
};

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<ProfileResponse>) => {
      const { data } = await apiClient.patch<ProfileResponse>("/api/v1/user/profile", patch);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROFILE_KEY });
    },
  });
};
