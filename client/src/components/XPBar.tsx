import { useGamification } from "../context/GamificationContext";

const BASE_XP = 100;
const GROWTH_RATE = 1.2;

const getXpForLevel = (level: number) =>
  Math.floor(BASE_XP * Math.pow(GROWTH_RATE, level));

export default function XPBar() {
  const { data } = useGamification();

  if (!data) return null;

  const xpNeeded = getXpForLevel(data.level);
  const progress = Math.min((data.xp / xpNeeded) * 100, 100);

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 20,
        width: "260px",
        background: "#fff",
        padding: "10px",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        zIndex: 9999,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: "6px" }}>
        Level {data.level}
      </div>

      <div style={{ fontSize: "12px", marginBottom: "6px" }}>
        {data.xp} / {xpNeeded} XP
      </div>

      <div
        style={{
          height: "10px",
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

      <div style={{ fontSize: "11px", marginTop: "6px", color: "#666" }}>
        🔥 Streak: {data.weeklyStreak} weeks
      </div>
    </div>
  );
}