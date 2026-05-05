// client/src/pages/Learn/BudgetCalculator.tsx
// Interactive 50/30/20 budget calculator.
// User enters their take-home pay; the three buckets update in real time.

import { useState } from "react";

const fmt = (n: number) => "£" + Math.round(n).toLocaleString("en-GB");

export default function BudgetCalculator() {
  const [takeHome, setTakeHome] = useState(2000);

  const needs = takeHome * 0.5;
  const wants = takeHome * 0.3;
  const savings = takeHome * 0.2;

  const buckets = [
    {
      label: "Needs",
      pct: "50%",
      amount: needs,
      description: "Rent, bills, groceries, transport",
      bg: "#EEF2FF",
      labelColor: "#4338CA",
      amtColor: "#3730A3",
      barColor: "#818CF8",
    },
    {
      label: "Wants",
      pct: "30%",
      amount: wants,
      description: "Eating out, subscriptions, fun",
      bg: "#F0FDFA",
      labelColor: "#0D9488",
      amtColor: "#0F766E",
      barColor: "#34D399",
    },
    {
      label: "Savings",
      pct: "20%",
      amount: savings,
      description: "Emergency fund, goals, pension top-up",
      bg: "#FFFBEB",
      labelColor: "#B45309",
      amtColor: "#92400E",
      barColor: "#FBBF24",
    },
  ];

  return (
    <div>
      {/* Input */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: "1rem",
        }}
      >
        <label style={{ fontSize: 13, color: "#6B7280", whiteSpace: "nowrap" }}>
          Monthly take-home
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
            value={takeHome}
            onChange={(e) => setTakeHome(Math.max(0, Number(e.target.value)))}
            style={{
              width: "100%",
              fontSize: 14,
              padding: "8px 10px 8px 24px",
              border: "0.5px solid #D1D5DB",
              borderRadius: 8,
              background: "#fff",
              color: "#111827",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Buckets */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8,
          marginBottom: "0.75rem",
        }}
      >
        {buckets.map((b) => (
          <div
            key={b.label}
            style={{
              background: b.bg,
              borderRadius: 12,
              padding: "10px 10px 8px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: b.labelColor,
                marginBottom: 2,
              }}
            >
              {b.label} · {b.pct}
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, color: b.amtColor }}>
              {fmt(b.amount)}
            </div>
            <div
              style={{
                fontSize: 10,
                color: b.labelColor,
                opacity: 0.75,
                marginTop: 2,
                lineHeight: 1.4,
              }}
            >
              {b.description}
            </div>
          </div>
        ))}
      </div>

      {/* Stacked bar */}
      <div
        style={{
          height: 10,
          borderRadius: 99,
          overflow: "hidden",
          display: "flex",
          background: "#F3F4F6",
        }}
      >
        {buckets.map((b) => (
          <div
            key={b.label}
            style={{
              width: b.pct,
              height: "100%",
              background: b.barColor,
              transition: "width 0.3s",
            }}
          />
        ))}
      </div>

      {takeHome === 0 && (
        <p
          style={{
            fontSize: 12,
            color: "#9CA3AF",
            marginTop: 8,
            textAlign: "center",
          }}
        >
          Enter your monthly take-home to see your budget split.
        </p>
      )}
    </div>
  );
}
