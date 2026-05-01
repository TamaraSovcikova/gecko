// client/src/components/LevelBadges.tsx

import { useGamification } from "../context/GamificationContext";
import Badge, { BADGES } from "./Badge";
import { COLORS } from "../constants/theme";


export default function LevelBadges() {
  const { data } = useGamification();

  if (!data) return null;

  const userLevel = data.level;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 92,
        right: 20,
        display: "flex",
        gap: "10px",
        justifyContent: "flex-end",
        alignItems: "center",
        zIndex: 9999,
        background: "rgba(250, 249, 253, 0.86)",
        border: `1px solid ${COLORS.purple300}`,
        borderRadius: "999px",
        padding: "8px 10px",
        boxShadow: "0 8px 22px rgba(92, 63, 163, 0.12)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      {BADGES.map((badge) => {
        const unlocked = userLevel >= badge.level;

        return (
          <div
            key={badge.level}
            style={{
              opacity: unlocked ? 1 : 0.35,
              transform: unlocked ? "scale(0.72)" : "scale(0.62)",
              transition: "all 0.2s ease",
              filter: unlocked ? "none" : "grayscale(100%)",
            }}
          >

          <Badge badge={badge} />

          </div>
        );
      })}
    </div>
  );
}