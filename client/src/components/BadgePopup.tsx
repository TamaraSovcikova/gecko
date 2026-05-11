// client/src/components/BadgePopup.tsx

import Badge from "./Badge";

type BadgeType = {
  level: number;
  label: string;
  color: string;
};

export default function BadgePopup({
  badge,
  onClose,
}: {
  badge: BadgeType;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 99999,
      }}
    >
      <div
        style={{
          width: "min(360px, calc(100vw - 24px))",
          maxHeight: "calc(100vh - 24px)",
          overflowY: "auto",
          background: "white",
          borderRadius: "12px",
          padding: "clamp(16px, 3vw, 24px)",
          textAlign: "center",
          border: "1px solid #c9bde8",
          boxSizing: "border-box",
        }}
      >
        <h2 style={{ margin: "0 0 10px 0" }}>🎉 Congratulations!</h2>

        <p style={{ margin: "0 0 30px 0", fontSize: "14px", color: "#4a3f6b" }}>
          You unlocked the <b>{badge.label}</b> badge!
        </p>

        {/* BIG BADGE */}
        <div style = {{
            margin: "0 auto 50px auto",
            display: "flex",
            justifyContent: "center"
            }}
        >
          <div style={{ transform: "scale(1.6)" }}>
            <Badge badge={badge} />
        </div>
        </div>

        <button
          onClick={onClose}
          style={{
            padding: "10px 16px",
            borderRadius: "8px",
            border: "none",
            background: "#5c3fa3",
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
            width: "100%",
          }}
        >
          Nice!
        </button>
      </div>
    </div>
  );
}