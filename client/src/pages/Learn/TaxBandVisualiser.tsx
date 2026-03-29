// client/src/pages/Learn/TaxBandVisualiser.tsx
// Interactive tax band visualiser.
// User enters their annual salary; bars update to show how bands are applied.

import { useState } from "react";

const fmt = (n: number) => "£" + Math.round(n).toLocaleString("en-GB");

interface Band {
  label: string;
  rate: string;
  amount: number;
  bg: string;
  textColor: string;
}

function calcBands(salary: number): Band[] {
  if (salary <= 0) return [];
  const pa = Math.min(salary, 12570);
  const basic = Math.max(0, Math.min(salary, 50270) - 12570);
  const higher = Math.max(0, Math.min(salary, 125140) - 50270);
  const addl = Math.max(0, salary - 125140);

  const bands: Band[] = [
    {
      label: "Personal allowance",
      rate: "0%",
      amount: pa,
      bg: "#EEF2FF",
      textColor: "#4338CA",
    },
    {
      label: "Basic rate",
      rate: "20%",
      amount: basic,
      bg: "#C7D2FE",
      textColor: "#3730A3",
    },
    {
      label: "Higher rate",
      rate: "40%",
      amount: higher,
      bg: "#818CF8",
      textColor: "#fff",
    },
    {
      label: "Additional rate",
      rate: "45%",
      amount: addl,
      bg: "#4338CA",
      textColor: "#fff",
    },
  ];
  return bands.filter((b) => b.amount > 0);
}

export default function TaxBandVisualiser() {
  const [salary, setSalary] = useState(30000);

  const bands = calcBands(salary);
  const tax =
    Math.max(0, Math.min(salary, 50270) - 12570) * 0.2 +
    Math.max(0, Math.min(salary, 125140) - 50270) * 0.4 +
    Math.max(0, salary - 125140) * 0.45;
  const effectiveRate = salary > 0 ? (tax / salary) * 100 : 0;

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
          Annual salary
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
            value={salary}
            onChange={(e) => setSalary(Math.max(0, Number(e.target.value)))}
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

      {/* Band bars */}
      {salary > 0 && (
        <div style={{ marginBottom: "0.75rem" }}>
          {bands.map((band) => {
            const widthPct = Math.max(4, (band.amount / salary) * 100);
            return (
              <div
                key={band.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "#6B7280",
                    minWidth: 130,
                    flexShrink: 0,
                  }}
                >
                  {band.label} ({band.rate})
                </span>
                <div
                  style={{
                    height: 22,
                    borderRadius: 6,
                    background: band.bg,
                    width: `${widthPct}%`,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 8px",
                    transition: "width 0.3s",
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: band.textColor,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fmt(band.amount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary chips */}
      {salary > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 11,
              padding: "4px 12px",
              borderRadius: 99,
              background: "#EEF2FF",
              color: "#4338CA",
              fontWeight: 500,
            }}
          >
            Tax: {fmt(tax)}/yr
          </span>
          <span
            style={{
              fontSize: 11,
              padding: "4px 12px",
              borderRadius: 99,
              background: "#F0FDFA",
              color: "#0D9488",
              fontWeight: 500,
            }}
          >
            Take-home: {fmt(salary - tax)}/yr
          </span>
          <span
            style={{
              fontSize: 11,
              padding: "4px 12px",
              borderRadius: 99,
              background: "#FFFBEB",
              color: "#B45309",
              fontWeight: 500,
            }}
          >
            Effective rate: {effectiveRate.toFixed(1)}%
          </span>
        </div>
      )}

      {salary === 0 && (
        <p style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center" }}>
          Enter your annual salary to see how tax bands apply.
        </p>
      )}
    </div>
  );
}
