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
          backgroundColor: "#fff",
          borderRadius: "14px",
          width: "900px",
          maxWidth: "100%",
          maxHeight: "85vh",
          overflowY: "auto",
          padding: "30px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          position: "relative",
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
