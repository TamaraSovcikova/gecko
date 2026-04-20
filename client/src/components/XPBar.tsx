// client/src/components/XPBar.tsx

import { useGamification } from "../context/GamificationContext";

const BASE_XP = 100;
const GROWTH_RATE = 1.2;

const getXpForLevel = (level: number) =>
  Math.floor(BASE_XP * Math.pow(GROWTH_RATE, level));

export default function XPBar() {
  const { data } = useGamification();

  // DEBUGGING
  console.log("gamification data:", data); //DEBUGGING

  if (!data) {
    return (
      <div style={{ marginTop: "10px", marginRight: "20px" }}>
        Loading XP...
      </div>
    );
  }

  const xpNeeded = getXpForLevel(data.level);
  const xp = data.xp ?? 0;

  const progress =
    xpNeeded > 0 ? Math.min((xp / xpNeeded) * 100, 100) : 0;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 85,
        right: 20,
        width: "340px",
        padding: "10px 12px",
        background: "#ffffff",
        borderRadius: "0", // no card feel
        boxShadow: "none", // explicitly removed
        border: "1px solid #ddd",
        zIndex: 9999,
      }}
    >
      {/* LEVEL + XP INLINE */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontWeight: 600,
          fontSize: "13px",
          marginBottom: "6px",
        }}
      >
        <span>Level {data.level}</span>
        <span>
          {xp} / {xpNeeded} XP
        </span>
      </div>

      {/* XP BAR */}
      <div
        style={{
          height: "14px",
          background: "#e5e5e5",
          borderRadius: "999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "#4caf50",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      {/* EMPTY STATE TIP */}
      {xp === 0 && (
        <div style={{ fontSize: "11px", marginTop: "6px", color: "#999" }}>
          Start completing quizzes to earn XP 🚀
        </div>
      )}

      {/* STREAK */}
      <div style={{ fontSize: "11px", marginTop: "6px", color: "#666" }}>
        🔥 Streak: {data.weeklyStreak} weeks
      </div>
    </div>
  );
}