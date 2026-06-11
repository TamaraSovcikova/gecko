import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "../firebase/authClient";
import { auth } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { User, Settings, KeyRound, FileText, Shield, LogOut, LogIn } from "lucide-react";
import ProfileAvatar from "./ProfileAvatar";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

type MenuItem = {
  to?: string;
  label: string;
  icon: React.ElementType;
  authRequired?: boolean;
  onClick?: () => void;
  danger?: boolean;
  "data-onboarding"?: string;
};

const NavDropdown = () => {
  const [open, setOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
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
      setOpen(false);
      await signOut(auth);
      navigate("/", { replace: true });
    } catch (error) {
      setLogoutError("Unable to log out right now.");
    }
  };

  const isAuthenticated = Boolean(currentUser);

  const menuItems: MenuItem[] = [
    { to: "/profile", label: "Profile", icon: User, authRequired: true, "data-onboarding": "dropdown-profile-link" },
    { to: "/settings", label: "Edit Account", icon: Settings, authRequired: true, "data-onboarding": "dropdown-settings-link" },
    { to: "/change-password", label: "Change Password", icon: KeyRound, authRequired: true, "data-onboarding": "dropdown-change-password-link" },
    { to: "/terms", label: "Terms & Conditions", icon: FileText, "data-onboarding": "dropdown-terms-link" },
    { to: "/data-policy", label: "Data Policy", icon: Shield, "data-onboarding": "dropdown-data-policy-link" },
  ];

  return (
    <div ref={containerRef} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)}
        data-onboarding="nav-account-menu" aria-haspopup="menu" aria-expanded={open} aria-label="Open account menu"
        className="p-0 border-none bg-transparent rounded-full leading-none hover:ring-2 hover:ring-purple-300 transition-shadow">
        <ProfileAvatar size={42} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div role="menu" aria-label="Account options"
            initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-[calc(100%+10px)] w-56 bg-white border border-purple-200 rounded-xl shadow-lg p-1.5 z-[200]">
            {menuItems.map((item) => {
              if (item.authRequired && !isAuthenticated) return null;
              return (
                <Link key={item.label} to={item.to!} onClick={() => setOpen(false)}
                  data-onboarding={item["data-onboarding"]}
                  className={cn("flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm no-underline transition-colors",
                    "text-purple-700 hover:bg-purple-50 hover:text-purple-800")}>
                  <item.icon className="w-4 h-4 text-purple-400 shrink-0" />
                  {item.label}
                </Link>
              );
            })}

            <div className="my-1 border-t border-purple-100" />

            {isAuthenticated ? (
              <button type="button" onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors text-red-600 hover:bg-red-50 font-semibold">
                <LogOut className="w-4 h-4 shrink-0" />Logout
              </button>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm no-underline transition-colors text-purple-700 hover:bg-purple-50 font-semibold">
                <LogIn className="w-4 h-4 text-purple-400 shrink-0" />Log In
              </Link>
            )}
            {logoutError && (
              <p className="mx-3 mt-1 mb-0.5 text-xs text-red-600">{logoutError}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NavDropdown;
