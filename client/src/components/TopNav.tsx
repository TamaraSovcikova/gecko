import { Link } from "react-router-dom";
import NavDropdown from "./NavDropdown";

const TopNav = () => {
  return (
    <header
      style={{
        backgroundColor: "#fdfaf7",
        borderBottom: "1px solid #dcd7cc",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: "Arial, sans-serif",
        gap: "20px",
        borderRadius: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Link
          to="/dashboard"
          style={{
            textDecoration: "none",
            fontSize: "20px",
            fontWeight: 700,
            color: "#2b5127",
            letterSpacing: "1px",
          }}
        >
          BANK TREE BUDGETING
        </Link>
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "10px",
            background: "linear-gradient(180deg, #dcead5 0%, #b9d5b1 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #acc4ad",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
          }}
          aria-label="Tree logo"
        >
          <svg width="18" height="18" viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="16" cy="10" r="7" fill="#4f8b57" />
            <circle cx="11" cy="14" r="5" fill="#5f9a66" />
            <circle cx="21" cy="14" r="5" fill="#5f9a66" />
            <rect x="14" y="17" width="4" height="10" rx="1.5" fill="#79543b" />
          </svg>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "18px", flex: 1, justifyContent: "center" }}>
        <Link
          to="/dashboard"
          style={{ textDecoration: "none", color: "#4c5d53", fontWeight: 600 }}
        >
          Dashboard
        </Link>
        <Link
          to="/quiz"
          style={{ textDecoration: "none", color: "#4c5d53", fontWeight: 600 }}
        >
          Quiz
        </Link>
        <Link
          to="/learn"
          style={{ textDecoration: "none", color: "#4c5d53", fontWeight: 600 }}
        >
          Educational
        </Link>
      </div>

      <NavDropdown />
    </header>
  );
};

export default TopNav;
