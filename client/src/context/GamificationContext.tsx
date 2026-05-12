// context/GamificationContext

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

type GamificationData = {
  xp: number;
  level: number;
  weeklyStreak: number;
  xpIntoLevel: number;
  xpNeeded: number;
  streakAtRisk: boolean;
  highestSeenBadgeLevel: number;
  badgeResetToken: string;
};

type GamificationContextType = {
  data: GamificationData | null;
  refreshGamification: () => Promise<void>;
  markBadgeSeen: (level: number) => Promise<void>;
};

const GamificationContext = createContext<GamificationContextType | undefined>(
  undefined,
);

export const GamificationProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const [data, setData] = useState<GamificationData | null>(null);

  const fetchGamification = async () => {
    if (!token) {
      return;
    }

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/quiz/gamification`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setData(res.data);
    } catch (err) {
      console.error("Gamification fetch failed:", err);
    }
  };

  const markBadgeSeen = async (level: number) => {
    if (!token) {
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/quiz/badge/seen`,
        { level },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setData((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          highestSeenBadgeLevel: Number(res.data?.highestSeenBadgeLevel || prev.highestSeenBadgeLevel || 0),
        };
      });
    } catch (err) {
      console.error("Failed to persist badge seen state:", err);
    }
  };

  useEffect(() => {
    // Only fetch when token is available and auth is done loading
    if (token) {
      fetchGamification();
    }
  }, [token]);

  return (
    <GamificationContext.Provider
      value={{
        data,
        refreshGamification: fetchGamification,
        markBadgeSeen,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);

  // =========================
  // DEBUGGING: hook safety
  // =========================
  if (!context) {
    console.error("useGamification used outside provider"); //DEBUGGING
    throw new Error("useGamification must be used within GamificationProvider");
  }

  return context;
};
