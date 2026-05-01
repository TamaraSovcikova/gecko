import { Link, useLocation } from "react-router-dom";
import NavDropdown from "./NavDropdown";
import { COLORS, SHADOWS } from "../constants/theme";

const NAV_HEIGHT = 116;

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/quiz",      label: "Quiz"      },
  { to: "/learn",     label: "Learn"     },
];

const TopNav = () => {
  const location = useLocation();

  return (
    <>
      <style>{`
        .topnav-link {
          position: relative;
          text-decoration: none;
          font-weight: 600;
          font-size: 15px;
          padding: 4px 2px;
          transition: color 0.2s ease;
          letter-spacing: 0.1px;
        }
        .topnav-link::after {
          content: "";
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 2px;
          border-radius: 99px;
          background: linear-gradient(90deg, ${COLORS.purple500}, ${COLORS.gold});
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.24s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .topnav-link:hover::after,
        .topnav-link.active::after {
          transform: scaleX(1);
        }
        .topnav-link:hover {
          color: ${COLORS.purple600} !important;
        }
        .topnav-link.active {
          color: ${COLORS.purple600} !important;
        }
      `}</style>
      <header
        style={{
          width: "100%",
          backgroundColor: "rgba(250, 249, 253, 0.88)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: `1px solid ${COLORS.purple300}`,
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
          gap: "20px",
          boxSizing: "border-box",
          boxShadow: SHADOWS.nav,
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        }}
      >
        {/* Brand */}
        <div style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>
          <img
            src="/gecko-transparent.png?v=2"
            alt="G.E.C.K.O logo"
            style={{ width: "96px", height: "96px", objectFit: "contain", background: "transparent", display: "block" }}
          />
          <Link
            to="/dashboard"
            data-onboarding="nav-brand"
            style={{
              display: "inline-flex",
              alignItems: "center",
              marginLeft: "-14px",
              textDecoration: "none",
              fontSize: "19px",
              fontWeight: 800,
              lineHeight: 1,
              color: COLORS.purple600,
              letterSpacing: "1.2px",
            }}
          >
            G.E.C.K.O
          </Link>
        </div>

        {/* Primary nav links */}
        <nav
          style={{ display: "flex", alignItems: "center", gap: "28px", flex: 1, justifyContent: "center" }}
          data-onboarding="nav-primary-links"
        >
          {NAV_LINKS.map(({ to, label }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`topnav-link${isActive ? " active" : ""}`}
                style={{ color: isActive ? COLORS.purple600 : COLORS.textSecondary }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <NavDropdown />
      </header>
      <div aria-hidden="true" style={{ height: `${NAV_HEIGHT}px` }} />
    </>
  );
};

export default TopNav;

