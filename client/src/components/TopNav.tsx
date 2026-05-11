import { Link, useLocation } from "react-router-dom";
import NavDropdown from "./NavDropdown";
import { COLORS, SHADOWS } from "../constants/theme";

const NAV_HEIGHT = 92;

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
        .topnav-root {
          width: 100%;
        }
        .topnav-link {
          position: relative;
          text-decoration: none;
          font-weight: 600;
          font-size: 15px;
          padding: 8px 12px;
          border-radius: 999px;
          transition: color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
          letter-spacing: 0.1px;
          white-space: nowrap;
        }
        .topnav-link::after {
          content: "";
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 2px;
          border-radius: 99px;
          background: linear-gradient(90deg, ${COLORS.purple500} 0%, ${COLORS.gold} 100%);
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
          background: rgba(139, 111, 212, 0.14);
          transform: translateY(-1px);
        }
        .topnav-link.active {
          color: ${COLORS.purple600} !important;
          background: rgba(232, 221, 253, 0.95);
          box-shadow: 0 8px 16px rgba(92, 63, 163, 0.18);
        }

        .topnav-brand-title {
          transition: transform 0.2s ease;
          background-image: linear-gradient(92deg, ${COLORS.purple600} 0%, ${COLORS.purple500} 48%, ${COLORS.gold} 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .topnav-brand-title:hover {
          transform: translateY(-1px);
        }

        @media (max-width: 900px) {
          .topnav-root {
            padding: 8px 12px !important;
            gap: 10px !important;
          }
          .topnav-brand-logo {
            width: 56px !important;
            height: 56px !important;
          }
          .topnav-brand-title {
            font-size: 15px !important;
            margin-left: -6px !important;
            letter-spacing: 0.8px !important;
          }
          .topnav-links {
            gap: 14px !important;
          }
          .topnav-link {
            font-size: 14px;
          }
        }

        @media (max-width: 640px) {
          .topnav-root {
            flex-wrap: wrap;
            justify-content: center !important;
            padding: 8px 10px !important;
          }
          .topnav-brand {
            width: 100%;
            justify-content: center;
          }
          .topnav-links {
            width: 100%;
            justify-content: center !important;
            gap: 12px !important;
            flex-wrap: wrap;
          }
        }
      `}</style>
      <header
        className="topnav-root"
        style={{
          width: "100%",
          backgroundColor: "rgba(250, 247, 255, 0.97)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: `1px solid ${COLORS.purple300}`,
          padding: "8px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "'Manrope', 'Segoe UI', Arial, sans-serif",
          gap: "20px",
          boxSizing: "border-box",
          boxShadow: `${SHADOWS.nav}, 0 14px 24px rgba(37, 24, 76, 0.14)`,
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        }}
      >
        {/* Brand */}
        <div className="topnav-brand" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>
          <img
            src="/gecko-transparent.png?v=2"
            alt="G.E.C.K.O logo"
            className="topnav-brand-logo"
            style={{ width: "78px", height: "78px", objectFit: "contain", background: "transparent", display: "block" }}
          />
          <Link
            to="/dashboard"
            data-onboarding="nav-brand"
            className="topnav-brand-title"
            style={{
              display: "inline-flex",
              alignItems: "center",
              marginLeft: "-10px",
              textDecoration: "none",
              fontSize: "18px",
              fontWeight: 700,
              lineHeight: 1,
              color: "transparent",
              letterSpacing: "1.4px",
            }}
          >
            G.E.C.K.O
          </Link>
        </div>

        {/* Primary nav links */}
        <nav
          className="topnav-links"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flex: 1,
            justifyContent: "center",
            border: `1px solid ${COLORS.purple300}`,
            borderRadius: "999px",
            background: "#ffffff",
            padding: "6px 8px",
            maxWidth: "420px",
          }}
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

