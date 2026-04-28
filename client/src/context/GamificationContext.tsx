// context/GamificationContext

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

type GamificationData = {
  xp: number;
  level: number;
  weeklyStreak: number;
};

type GamificationContextType = {
  data: GamificationData | null;
  refreshGamification: () => Promise<void>;
};

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const [data, setData] = useState<GamificationData | null>(null);

  // =========================
  // DEBUGGING: render tracking
  // =========================
  console.log("GamificationProvider render - token:", token); //DEBUGGING

  const fetchGamification = async () => {
    // =========================
    // DEBUGGING: fetch guard
    // =========================
    if (!token) {
      console.log("fetchGamification aborted - no token"); //DEBUGGING
      return;
    }

    console.log("fetchGamification started"); //DEBUGGING

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/user/gamification`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // =========================
      // DEBUGGING: API response
      // =========================
      console.log("gamification API response:", res.data); //DEBUGGING

      setData(res.data);

      // =========================
      // DEBUGGING: state update
      // =========================
      console.log("gamification state updated"); //DEBUGGING

    } catch (err) {
      console.error("Gamification fetch failed:", err); //DEBUGGING
    }
  };

  useEffect(() => {
    // =========================
    // DEBUGGING: effect trigger
    // =========================
    console.log("useEffect triggered with token:", token); //DEBUGGING

    fetchGamification();
  }, [token]);

  return (
    <GamificationContext.Provider
      value={{
        data,
        refreshGamification: fetchGamification,
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