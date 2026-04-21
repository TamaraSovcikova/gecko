// client/src/components/LevelBadges.tsx

import { useGamification } from "../context/GamificationContext";

type Badge = {
  level: number;
  label: string;
  color: string;
};

const BADGES: Badge[] = [
  { level: 1, label: "Finance Rookie", color: "#28a745" }, // adzuna tip green
  { level: 5, label: "Rich Gecko", color: "#17a2b8" }, // adzuna tip blue
  { level: 10, label: "G.E.C.K.O Expert", color: "#d4af37" }, // gold
];

export default function LevelBadges() {
  const { data } = useGamification();

  if (!data) return null;

  const userLevel = data.level;

  return (
    <div
        style={{
            position: "fixed",
            bottom: 150,
            right: 90,
            display: "flex",
            gap: "15px",
            justifyContent: "flex-end",
            alignItems: "centre",
            zIndex: 9999,
        }}
    >
      {BADGES.map((badge) => {
        const unlocked = userLevel >= badge.level;

        return (
          <div
            key={badge.level}
            style={{
              position: "relative",
              width: "70px",
              height: "70px",
              opacity: unlocked ? 1 : 0.1,
              transform: unlocked ? "scale(1)" : "scale(1)",
              transition: "all 0.2s ease",
            }}
          >
            {/* Circle */}
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: `3px solid ${badge.color}`,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "18px",
                fontWeight: 700,
                color: "#333",
                background: "#fff",
              }}
            >
              {badge.level}
            </div>

            {/* Ribbon */}
            <div
              style={{
                position: "absolute",
                bottom: "16px",
                left: "25%",
                transform: "translateX(-45%)",
                background: badge.color,
                padding: "3px 6px",
                borderRadius: "999px",
                fontSize: "8px",
                fontWeight: 700,
                color: "#1a1a1a",
                border: "1px solid rgba(0,0,0,0.15)",
                whiteSpace: "nowrap",
              }}
            >
              {badge.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}