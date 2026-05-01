// client/src/components/XPBar.tsx
// Bottom-center fixed bar with glassmorphism.
// Badge circle sits centered on the top edge, half above / half inside the bar.

import { useGamification } from "../context/GamificationContext";
import { BADGES } from "./Badge";
import { COLORS } from "../constants/theme";

export default function XPBar() {
  const { data } = useGamification();

  if (!data) return null;

  const xp = data.xp;
  const level = data.level;
  const xpIntoLevel = data.xpIntoLevel;
  const xpNeeded = data.xpNeeded;

  const progress =
    xpNeeded > 0 ? Math.min((xpIntoLevel / xpNeeded) * 100, 100) : 0;

  const unlockedBadges = BADGES.filter((b) => level >= b.level);
  const highestBadge =
    unlockedBadges.length > 0
      ? unlockedBadges[unlockedBadges.length - 1]
      : null;
  const badgeNames = unlockedBadges.map((badge) => badge.label).join(" • ");

  const CIRCLE_SIZE = 52;
  const HALF_CIRCLE = CIRCLE_SIZE / 2;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 14,
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(640px, calc(100vw - 20px))",
        paddingTop: highestBadge ? HALF_CIRCLE + 10 : 10,
        paddingBottom: 10,
        paddingLeft: 16,
        paddingRight: 16,
        background: "rgba(250, 249, 253, 0.82)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: `1px solid ${COLORS.purple300}`,
        borderRadius: "18px",
        boxShadow: "0 8px 32px rgba(92, 63, 163, 0.18), 0 2px 8px rgba(92, 63, 163, 0.10)",
        zIndex: 9999,
        overflow: "visible",
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
      }}
    >
      {/* BADGE CIRCLE — centered on top edge */}
      {highestBadge && (
        <div
          style={{
            position: "absolute",
            top: -HALF_CIRCLE,
            left: "50%",
            transform: "translateX(-50%)",
            width: CIRCLE_SIZE,
            height: CIRCLE_SIZE,
            borderRadius: "50%",
            border: `2.5px solid ${highestBadge.color}`,
            background: `radial-gradient(circle at 35% 35%, #fff 0%, ${COLORS.purple100} 100%)`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "15px",
            fontWeight: 800,
            color: COLORS.purple600,
            zIndex: 1,
            boxShadow: `0 4px 14px ${highestBadge.color}55, 0 2px 6px rgba(92,63,163,0.18)`,
            letterSpacing: "0.5px",
          }}
        >
          {highestBadge.level}
        </div>
      )}

      {/* LEVEL + XP ROW */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "6px",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: COLORS.purple600,
            letterSpacing: "0.2px",
          }}
        >
          Level {level}
        </span>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: COLORS.textMuted,
          }}
        >
          <span style={{ color: COLORS.gold, fontWeight: 700 }}>{xpIntoLevel}</span>
          {" / "}
          {xpNeeded} XP
        </span>
      </div>

      {/* XP PROGRESS BAR */}
      <div
        style={{
          height: "8px",
          background: COLORS.purple200,
          borderRadius: "999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${COLORS.purple500} 0%, ${COLORS.purple400} 100%)`,
            borderRadius: "999px",
            transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: `0 0 8px ${COLORS.purple500}66`,
          }}
        />
      </div>

      {/* FOOTER: streak or prompt */}
      <div
        style={{
          fontSize: "11px",
          marginTop: "6px",
          color: COLORS.textMuted,
          textAlign: "center",
          letterSpacing: "0.1px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {xp === 0
          ? "Complete quizzes to earn XP 🚀"
          : `🔥 ${data.weeklyStreak}-week streak${badgeNames ? ` | ${badgeNames}` : ""}`}
      </div>
    </div>
  );
}

