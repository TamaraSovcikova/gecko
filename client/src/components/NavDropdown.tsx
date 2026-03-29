import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import ProfileAvatar from "./ProfileAvatar";

const itemStyle = {
  display: "block",
  width: "100%",
  padding: "12px 14px",
  textDecoration: "none",
  color: "#314f3c",
  background: "transparent",
  border: "none",
  textAlign: "left" as const,
  fontSize: "14px",
};

const NavDropdown = () => {
  const [open, setOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleLogout = async () => {
    try {
      setLogoutError("");
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Unable to log out", error);
      setLogoutError("Unable to log out right now.");
    }
  };

  const isAuthenticated = Boolean(currentUser);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open account menu"
        style={{
          padding: 0,
          border: "none",
          background: "transparent",
          borderRadius: "50%",
          lineHeight: 0,
        }}
      >
        <ProfileAvatar size={42} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account options"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 10px)",
            minWidth: "230px",
            backgroundColor: "#fffdf9",
            border: "1px solid #d9d4ca",
            borderRadius: "12px",
            boxShadow: "0 18px 32px rgba(48, 55, 44, 0.14)",
            padding: "8px",
            zIndex: 200,
          }}
        >
          {isAuthenticated && (
            <Link to="/profile" onClick={() => setOpen(false)} style={itemStyle}>
              Profile
            </Link>
          )}
          {isAuthenticated && (
            <Link to="/settings" onClick={() => setOpen(false)} style={itemStyle}>
              Edit Account Details
            </Link>
          )}
          {isAuthenticated && (
            <Link to="/change-password" onClick={() => setOpen(false)} style={itemStyle}>
              Change Password
            </Link>
          )}
          <Link to="/terms" onClick={() => setOpen(false)} style={itemStyle}>
            Terms & Conditions
          </Link>
          <Link to="/data-policy" onClick={() => setOpen(false)} style={itemStyle}>
            Data Policy
          </Link>
          {isAuthenticated ? (
            <button type="button" onClick={handleLogout} style={{ ...itemStyle, color: "#b54848", fontWeight: 700 }}>
              Logout
            </button>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)} style={{ ...itemStyle, fontWeight: 700 }}>
              Log In
            </Link>
          )}
          {logoutError && (
            <p style={{ margin: "8px 14px 4px", color: "#b54848", fontSize: "12px" }}>
              {logoutError}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default NavDropdown;