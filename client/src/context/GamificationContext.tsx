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

  const fetchGamification = async () => {
    if (!token) return;

    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/v1/user/gamification`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setData(res.data);
  };

  useEffect(() => {
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
  if (!context) {
    throw new Error("useGamification must be used within GamificationProvider");
  }
  return context;
};