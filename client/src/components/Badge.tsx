type BadgeType = {
  level: number;
  label: string;
  color: string;
};

export const BADGES: BadgeType[] = [
  { level: 1, label: "Finance Rookie", color: "#28a745" },
  { level: 5, label: "Rich Gecko", color: "#17a2b8" },
  { level: 10, label: "G.E.C.K.O Expert", color: "#d4af37" },
];

export default function Badge({ badge }: { badge: BadgeType }) {
  return (
    <div
      style={{
        position: "relative",
        width: "70px",
        height: "70px",
        transition: "all 0.2s ease",
      }}
    >
      {/* Circle */}
      <div
        style={{
          width: "70px",
          height: "70px",
          borderRadius: "50%",
          border: `3px solid ${badge.color}`,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "25px",
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
          bottom: "-8px",
          left: "50%",
          transform: "translateX(-50%)",
          background: badge.color,
          padding: "4px 8px",
          borderRadius: "999px",
          fontSize: "10px",
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
}