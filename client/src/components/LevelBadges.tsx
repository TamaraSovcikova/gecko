// client/src/components/LevelBadges.tsx

import { useGamification } from "../context/GamificationContext";
import Badge, { BADGES } from "./Badge";


export default function LevelBadges() {
  const { data } = useGamification();

  if (!data) return null;

  const userLevel = data.level;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 160,
        right: 100,
        display: "flex",
        gap: "15px",
        justifyContent: "flex-end",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      {BADGES.map((badge) => {
        const unlocked = userLevel >= badge.level;

        return (
          <div
            key={badge.level}
            style={{
              opacity: unlocked ? 1 : 0,
              transform: unlocked ? "scale(0.7)" : "scale(0.5)",
              transition: "all 0.2s ease",
            }}
          >

          <Badge badge={badge} />

          </div>
        );
      })}
    </div>
  );
}