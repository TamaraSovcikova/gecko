import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NavDropdown from "./NavDropdown";
import { cn } from "../lib/utils";

const NAV_HEIGHT = 72;

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/savings",   label: "Savings"   },
  { to: "/bills",     label: "Bills"     },
  { to: "/forecast",  label: "Forecast"  },
  { to: "/learn",     label: "Learn"     },
];

const TopNav = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-purple-50/95 backdrop-blur-sm border-b border-purple-300 shadow-nav"
        style={{ fontFamily: "Manrope, Segoe UI, Arial, sans-serif" }}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 h-18 max-w-screen-xl mx-auto">
          <div className="flex items-center shrink-0">
            <img src="/gecko-transparent.png?v=2" alt="G.E.C.K.O logo" className="w-14 h-14 object-contain" />
            <Link to="/dashboard"
              className="ml-[-8px] text-base font-bold tracking-widest hover:opacity-80 transition-opacity"
              style={{ background: "linear-gradient(90deg, #5c3fa3 0%, #8b6fd4 50%, #f0b429 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", textDecoration: "none" }}>
              G.E.C.K.O
            </Link>
          </div>
          <nav className="hidden sm:flex items-center gap-1 bg-white border border-purple-300 rounded-pill px-2 py-1.5 mx-4 flex-1 justify-center max-w-xs" aria-label="Primary navigation">
            {NAV_LINKS.map(({ to, label }) => {
              const isActive = location.pathname === to;
              return (
                <Link key={to} to={to}
                  className={cn("relative px-4 py-1.5 rounded-pill text-sm font-semibold transition-all duration-200 no-underline",
                    isActive ? "bg-purple-200 text-purple-700 shadow-sm" : "text-gecko-muted hover:text-purple-600 hover:bg-purple-100")}>
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block"><NavDropdown /></div>
            <button type="button" className="sm:hidden p-2 rounded-md text-purple-600 hover:bg-purple-100 transition-colors" onClick={() => setMobileOpen(v => !v)} aria-label="Toggle menu">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="sm:hidden overflow-hidden border-t border-purple-200 bg-white">
              <div className="px-4 py-3 space-y-1">
                {NAV_LINKS.map(({ to, label }) => {
                  const isActive = location.pathname === to;
                  return (
                    <Link key={to} to={to} onClick={() => setMobileOpen(false)}
                      className={cn("block px-4 py-2.5 rounded-md text-sm font-semibold no-underline transition-colors",
                        isActive ? "bg-purple-200 text-purple-700" : "text-gecko-muted hover:bg-purple-100 hover:text-purple-600")}>
                      {label}
                    </Link>
                  );
                })}
                <div className="pt-2 border-t border-purple-100"><NavDropdown /></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      <div aria-hidden="true" style={{ height: NAV_HEIGHT + "px" }} />
    </>
  );
};

export default TopNav;
