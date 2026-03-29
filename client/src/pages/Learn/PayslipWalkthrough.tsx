// client/src/pages/Learn/PayslipWalkthrough.tsx
// Interactive step-through walkthrough of a sample payslip.

import { useState } from "react";

interface Step {
  rowKey: string | null;
  heading: string;
  text: string;
}

const STEPS: Step[] = [
  {
    rowKey: null,
    heading: "Your payslip, explained",
    text: "This is a sample payslip for someone earning £30,000 a year. Step through each line to see exactly where your money goes.",
  },
  {
    rowKey: "gross",
    heading: "Gross salary",
    text: "Your gross salary is what your employer agrees to pay - £30,000 a year works out to £2,500 a month. This is your starting point before any deductions.",
  },
  {
    rowKey: "tax",
    heading: "Income tax",
    text: "You pay 0% on the first £12,570 (your personal allowance) and 20% on the rest. On a £30,000 salary that comes to around £247.90 per month.",
  },
  {
    rowKey: "ni",
    heading: "National Insurance",
    text: "NI is separate from income tax. You pay 8% on earnings between £12,570 and £50,270. Here that's £124.20/month - it funds the NHS and your state pension.",
  },
  {
    rowKey: "pension",
    heading: "Pension (5%)",
    text: "If you're auto-enrolled in a workplace pension, 5% of your gross goes in each month. Your employer adds at least 3% on top - free money you'd lose if you opted out.",
  },
  {
    rowKey: "net",
    heading: "Take-home pay",
    text: "This is what lands in your bank account. Of the £2,500 gross, you keep £2,002.90 after tax, NI, and pension contributions.",
  },
];

const ROWS = [
  { key: "gross", label: "Gross salary", amount: "£2,500.00", type: "gross" },
  { key: "tax", label: "Income tax", amount: "-£247.90", type: "deduction" },
  {
    key: "ni",
    label: "National Insurance",
    amount: "-£124.20",
    type: "deduction",
  },
  {
    key: "pension",
    label: "Pension (5%)",
    amount: "-£125.00",
    type: "deduction",
  },
  { key: "net", label: "Take-home pay", amount: "£2,002.90", type: "net" },
];

const ACCENT = "#6366F1";
const ACCENT_BG = "#EEF2FF";
const ACCENT_TEXT = "#4338CA";

export default function PayslipWalkthrough() {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  return (
    <div>
      {/* Mock payslip */}
      <div
        style={{
          background: "#F8F9FC",
          borderRadius: 12,
          padding: "0.9rem 1rem",
          marginBottom: "0.9rem",
          border: "0.5px solid #E5E7EB",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#9CA3AF",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "0.6rem",
          }}
        >
          Monthly payslip - April 2025
        </div>
        {ROWS.map((row) => {
          const isActive = current.rowKey === row.key;
          const isNet = row.type === "net";
          const isDeduction = row.type === "deduction";
          return (
            <div key={row.key}>
              {isNet && (
                <div
                  style={{
                    height: 1,
                    background: "#E5E7EB",
                    margin: "6px 0",
                  }}
                />
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "7px 10px",
                  borderRadius: 8,
                  transition: "background 0.2s",
                  background: isActive ? ACCENT_BG : "transparent",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: isActive ? ACCENT_TEXT : "#6B7280",
                    fontWeight: isActive ? 500 : 400,
                    transition: "color 0.2s",
                  }}
                >
                  {row.label}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: isNet ? 600 : 500,
                    color: isDeduction
                      ? "#DC2626"
                      : isNet
                        ? "#16A34A"
                        : "#111827",
                  }}
                >
                  {row.amount}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Explanation box */}
      <div
        style={{
          background: ACCENT_BG,
          borderRadius: 10,
          padding: "12px 14px",
          marginBottom: "0.9rem",
          minHeight: 72,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: ACCENT_TEXT,
            marginBottom: 3,
          }}
        >
          {current.heading}
        </div>
        <div style={{ fontSize: 12, color: "#3730A3", lineHeight: 1.6 }}>
          {current.text}
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          style={{
            fontSize: 12,
            padding: "6px 16px",
            borderRadius: 8,
            border: "0.5px solid #D1D5DB",
            background: "#F9FAFB",
            color: "#374151",
            cursor: step === 0 ? "default" : "pointer",
            opacity: step === 0 ? 0.4 : 1,
          }}
        >
          Back
        </button>

        {/* Dots */}
        <div style={{ display: "flex", gap: 5 }}>
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              style={{
                width: i === step ? 18 : 7,
                height: 7,
                borderRadius: 99,
                border: "none",
                background: i === step ? ACCENT : "#C7D2FE",
                cursor: "pointer",
                padding: 0,
                transition: "width 0.2s, background 0.2s",
              }}
            />
          ))}
        </div>

        <button
          onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
          disabled={step === STEPS.length - 1}
          style={{
            fontSize: 12,
            padding: "6px 16px",
            borderRadius: 8,
            border: "none",
            background: step === STEPS.length - 1 ? "#E5E7EB" : ACCENT,
            color: step === STEPS.length - 1 ? "#9CA3AF" : "#fff",
            cursor: step === STEPS.length - 1 ? "default" : "pointer",
            fontWeight: 500,
          }}
        >
          {step === STEPS.length - 1 ? "Done" : "Next →"}
        </button>
      </div>
    </div>
  );
}
