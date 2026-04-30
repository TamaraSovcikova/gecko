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
      <div style={{ display: "inline-flex", alignItems: "center", gap: "0px", whiteSpace: "nowrap" }}>
        <img
          src="/gecko-transparent.png?v=2"
          alt="G.E.C.K.O logo"
          style={{
            width: "112px",
            height: "112px",
            objectFit: "contain",
            background: "transparent",
            display: "block",
          }}
        />
        <Link
          to="/dashboard"
          data-onboarding="nav-brand"
          style={{
            display: "inline-flex",
            alignItems: "center",
            marginLeft: "-18px",
            textDecoration: "none",
            fontSize: "20px",
            fontWeight: 700,
            lineHeight: 1,
            color: "#2b5127",
            letterSpacing: "1px",
          }}
        >
          G.E.C.K.O
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "18px", flex: 1, justifyContent: "center" }} data-onboarding="nav-primary-links">
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
