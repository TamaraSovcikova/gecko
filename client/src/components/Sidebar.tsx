import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGamification } from "../context/GamificationContext";
import { signOut } from "../firebase/authClient";
import { auth } from "../firebase/config";
import ProfileAvatar from "./ProfileAvatar";
import { LayoutDashboard, Target, Calendar, TrendingUp, BookOpen, Settings, LogOut } from "lucide-react";
import { cn } from "../lib/utils";

const NAV_LINKS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/savings", icon: Target, label: "Savings" },
  { to: "/bills", icon: Calendar, label: "Bills" },
  { to: "/forecast", icon: TrendingUp, label: "Forecast" },
  { to: "/learn", icon: BookOpen, label: "Learn" },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { data } = useGamification();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {}
    navigate("/login");
  };

  const level = data?.level ?? 1;
  const xpIntoLevel = data?.xpIntoLevel ?? 0;
  const xpNeeded = data?.xpNeeded ?? 100;
  const progress = xpNeeded > 0 ? Math.min((xpIntoLevel / xpNeeded) * 100, 100) : 0;
  const displayName = currentUser?.displayName || currentUser?.email?.split("@")[0] || "User";

  const isActive = (to: string) => location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col bg-gray-900 h-screen sticky top-0 z-30">
      {/* Logo */}
      <div className="px-5 h-16 flex items-center border-b border-white/10 flex-shrink-0">
        <Link to="/dashboard" data-onboarding="nav-brand" className="flex items-center gap-2.5 no-underline">
          <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white text-[11px] font-extrabold">
            G
          </div>
          <span className="text-white font-bold text-[15px] tracking-tight">Gecko</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-600">Navigation</p>
        <ul data-onboarding="nav-primary-links" className="space-y-0.5 list-none p-0 m-0">
          {NAV_LINKS.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium no-underline transition-all",
                  isActive(to) ? "bg-purple-600 text-white" : "text-gray-400 hover:text-gray-100 hover:bg-white/[0.06]"
                )}
              >
                <Icon className="w-[17px] h-[17px] shrink-0" />
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-600">Account</p>
          <Link
            to="/profile"
            data-onboarding="nav-account-menu"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium no-underline transition-all",
              isActive("/profile") || isActive("/settings") || isActive("/change-password")
                ? "bg-purple-600 text-white"
                : "text-gray-400 hover:text-gray-100 hover:bg-white/[0.06]"
            )}
          >
            <Settings className="w-[17px] h-[17px] shrink-0" />
            Settings &amp; Profile
          </Link>
        </div>
      </nav>

      {/* XP bar */}
      {data && (
        <div className="px-4 py-3 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-gray-400">Level {level}</span>
            <span className="text-[11px] text-gray-600">
              <span className="font-bold" style={{ color: "#f0b429" }}>
                {xpIntoLevel}
              </span>
              {" / "}
              {xpNeeded} XP
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* User footer */}
      <div className="px-4 py-3.5 border-t border-white/10 flex items-center gap-3 flex-shrink-0">
        <ProfileAvatar size={30} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white truncate leading-tight">{displayName}</p>
          <p className="text-[11px] text-gray-500 truncate leading-tight">{currentUser?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex-shrink-0 p-1.5 rounded text-gray-600 hover:text-red-400 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
