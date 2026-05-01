import React from "react";
import { ForecastWarning } from "../types/forecast";

interface ForecastWarningPopupProps {
  warnings: ForecastWarning[];
  onDismiss: (warningId: string) => void;
}

const wrapperStyle: React.CSSProperties = {
  position: "fixed",
  top: "20px",
  right: "20px",
  zIndex: 9999,
  width: "360px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const cardStyle: React.CSSProperties = {
  background: "#fef9e7",
  border: "1px solid #f0d280",
  borderRadius: "8px",
  padding: "14px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
};

const titleStyle: React.CSSProperties = {
  fontWeight: 700,
  marginBottom: "8px",
};

const messageStyle: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: 1.4,
  marginBottom: "10px",
};

const buttonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "6px",
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 600,
};

const ForecastWarningPopup: React.FC<ForecastWarningPopupProps> = ({
  warnings,
  onDismiss,
}) => {
  console.log("[ForecastWarningPopup] warnings prop =", warnings);

  if (!warnings || warnings.length === 0) {
    return null;
  }

  return (
    <div style={wrapperStyle}>
      {warnings.map((warning) => (
        <div key={warning.id} style={cardStyle}>
          <div style={titleStyle}>Budget Warning</div>
          <div style={messageStyle}>{warning.message}</div>

          <button
            style={buttonStyle}
            onClick={() => {
              console.log("[ForecastWarningPopup] Dismissing warning", warning.id);
              onDismiss(warning.id);
            }}
          >
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
};

export default ForecastWarningPopup;