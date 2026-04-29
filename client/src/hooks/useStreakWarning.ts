import { useGamification } from "../context/GamificationContext";

export const useStreakWarning = () => {
  const { data } = useGamification();

  return {
    showStreakWarning: data?.streakAtRisk ?? false,
    streak: data?.weeklyStreak ?? 0,
  };
};