// client/src/pages/Learn/SavingsGoalTracker.tsx
// Interactive savings goal tracker.
// User sets a goal and monthly saving amount; shows months needed + visual timeline.

import { useState } from "react";

const fmt = (n: number) => "£" + Math.round(n).toLocaleString("en-GB");

export default function SavingsGoalTracker() {
  const [goal, setGoal] = useState(1000);
  const [monthly, setMonthly] = useState(200);

  const months = monthly > 0 ? Math.ceil(goal / monthly) : 0;
  const showDots = Math.min(months, 24);

  return (
    <div>
      {/* Inputs */}
      {[
        { label: "Savings goal", value: goal, set: setGoal },
        { label: "Monthly saving", value: monthly, set: setMonthly },
      ].map(({ label, value, set }) => (
        <div
          key={label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <label style={{ fontSize: 13, color: "#6B7280", minWidth: 130 }}>
            {label}
          </label>
          <div style={{ position: "relative", flex: 1 }}>
            <span
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 13,
                color: "#9CA3AF",
              }}
            >
              £
            </span>
            <input
              type="number"
              min={0}
              value={value}
              onChange={(e) => set(Math.max(0, Number(e.target.value)))}
              style={{
                width: "100%",
                fontSize: 13,
                padding: "7px 10px 7px 24px",
                border: "0.5px solid #D1D5DB",
                borderRadius: 8,
                background: "#fff",
                color: "#111827",
                outline: "none",
              }}
            />
          </div>
        </div>
      ))}

      {/* Result */}
      {goal > 0 && monthly > 0 ? (
        <div
          style={{
            background: "#F0FDFA",
            borderRadius: 12,
            padding: "14px 16px",
            marginTop: "0.75rem",
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 600, color: "#0D9488" }}>
            {months} {months === 1 ? "month" : "months"}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#0F766E",
              marginTop: 2,
              marginBottom: 12,
            }}
          >
            to save {fmt(goal)} at {fmt(monthly)}/month
          </div>

          {/* Dot timeline */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {Array.from({ length: showDots }).map((_, i) => {
              const progress = Math.min(1, ((i + 1) * monthly) / goal);
              const green = Math.round(150 + progress * 50);
              return (
                <div
                  key={i}
                  title={`Month ${i + 1}: ${fmt(Math.min((i + 1) * monthly, goal))} saved`}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    background: `rgba(13, ${green}, 100, ${0.2 + progress * 0.75})`,
                    cursor: "default",
                    transition: "background 0.3s",
                  }}
                />
              );
            })}
            {months > 24 && (
              <span
                style={{
                  fontSize: 11,
                  color: "#9CA3AF",
                  alignSelf: "center",
                  marginLeft: 4,
                }}
              >
                +{months - 24} more
              </span>
            )}
          </div>

          {months > 24 && (
            <p style={{ fontSize: 11, color: "#6B7280", marginTop: 8 }}>
              Tip: increasing your monthly saving reduces this significantly.
            </p>
          )}
        </div>
      ) : (
        <p
          style={{
            fontSize: 12,
            color: "#9CA3AF",
            marginTop: 12,
            textAlign: "center",
          }}
        >
          Enter a goal and monthly saving amount to see your timeline.
        </p>
      )}
    </div>
  );
}
