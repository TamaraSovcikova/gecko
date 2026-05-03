type Props = {
  children: React.ReactNode;
  onClose: () => void;
};

export default function Modal({ children, onClose }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.55)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "#faf9fd",
          borderRadius: "14px",
          width: "min(900px, calc(100vw - 24px))",
          maxHeight: "calc(100vh - 24px)",
          overflowY: "auto",
          padding: "clamp(16px, 3vw, 30px)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          position: "relative",
          boxSizing: "border-box",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            border: "none",
            background: "transparent",
            fontSize: "20px",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          ✕
        </button>

        {children}
      </div>
    </div>
  );
}
