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

  const progress = xpNeeded > 0 ? Math.min((xpIntoLevel / xpNeeded) * 100, 100) : 0;

  const unlockedBadges = BADGES.filter((b) => level >= b.level);
  const highestBadge = unlockedBadges.length > 0 ? unlockedBadges[unlockedBadges.length - 1] : null;
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
        background: "rgba(244, 241, 251, 0.92)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: `1px solid ${COLORS.purple300}`,
        borderRadius: "18px",
        boxShadow: "0 14px 34px rgba(92, 63, 163, 0.24), 0 4px 12px rgba(92, 63, 163, 0.14)",
        zIndex: 9999,
        overflow: "visible",
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
      }}
    >
      {/* BADGE CIRCLE - centered on top edge */}
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
            background: COLORS.purple100,
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
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255, 255, 255, 0.18)",
            transform: "translateX(-100%)",
            animation: "xpSheen 2.6s linear infinite",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: COLORS.purple500,
            borderRadius: "999px",
            transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: `0 0 8px ${COLORS.purple500}66`,
          }}
        />
      </div>

      <style>{`
        @keyframes xpSheen {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(150%); }
        }
      `}</style>

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
