import React from "react";
import { ForecastWarning } from "../types/forecast";

interface ForecastWarningPopupProps {
  warnings: ForecastWarning[];
  onDismiss: (warningId: string) => void;
}

const wrapperStyle: React.CSSProperties = {
  position: "fixed",
  top: "12px",
  right: "12px",
  zIndex: 9999,
  width: "min(360px, calc(100vw - 24px))",
  maxHeight: "calc(100vh - 24px)",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const cardStyle: React.CSSProperties = {
  background: "#f4f1fb",
  border: "1px solid #c9bde8",
  borderRadius: "8px",
  padding: "14px",
  boxShadow: "0 8px 18px rgba(92, 63, 163, 0.18)",
};

const titleStyle: React.CSSProperties = {
  fontWeight: 700,
  color: "#1a1040",
  marginBottom: "8px",
};

const messageStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#4a3f6b",
  lineHeight: 1.4,
  marginBottom: "10px",
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #c9bde8",
  background: "#ede8f8",
  color: "#5c3fa3",
  borderRadius: "6px",
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 600,
};

const ForecastWarningPopup: React.FC<ForecastWarningPopupProps> = ({
  warnings,
  onDismiss,
}) => {
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