import Sidebar from "./components/Sidebar";
import BadgePopup from "./components/BadgePopup";
import { BADGES } from "./components/Badge";
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useGamification } from "./context/GamificationContext";
import { useAuth } from "./context/AuthContext";

export default function MainLayout() {
  const { data, markBadgeSeen } = useGamification();
  const { currentUser } = useAuth();
  const [popupBadge, setPopupBadge] = useState<any>(null);
  const [pendingBadgeLevel, setPendingBadgeLevel] = useState<number | null>(null);

  const userIdentity = (currentUser?.uid || currentUser?.email || "").toString().toLowerCase().trim();

  useEffect(() => {
    setPopupBadge(null);
    setPendingBadgeLevel(null);
  }, [userIdentity]);

  useEffect(() => {
    if (!data || !userIdentity) return;
    const badgeResetToken = (data.badgeResetToken || "base").trim() || "base";
    const unlockedBadges = BADGES.filter((b) => data.level >= b.level);
    const makeKey = (level: number) => `badge_shown_${userIdentity}_${badgeResetToken}_level_${level}`;
    const highestSeenKey = `badge_highest_seen_${userIdentity}_${badgeResetToken}`;
    const localHighestSeen = Number(localStorage.getItem(highestSeenKey) || "0");
    const serverHighestSeen = Number(data.highestSeenBadgeLevel || 0);
    const highestSeen = Math.max(localHighestSeen, serverHighestSeen);
    localStorage.setItem(highestSeenKey, String(highestSeen));
    const notShown = unlockedBadges.filter(
      (badge) => badge.level > highestSeen && !localStorage.getItem(makeKey(badge.level))
    );
    if (notShown.length === 0) return;
    const highestNewBadge = notShown[notShown.length - 1];
    setPopupBadge(highestNewBadge);
    setPendingBadgeLevel(highestNewBadge.level);
  }, [data, userIdentity]);

  const handleCloseBadgePopup = async () => {
    if (userIdentity && pendingBadgeLevel !== null) {
      const badgeResetToken = (data?.badgeResetToken || "base").trim() || "base";
      const highestSeenKey = `badge_highest_seen_${userIdentity}_${badgeResetToken}`;
      const previousHighest = Math.max(
        Number(localStorage.getItem(highestSeenKey) || "0"),
        Number(data?.highestSeenBadgeLevel || 0)
      );
      const nextHighest = Math.max(previousHighest, pendingBadgeLevel);
      localStorage.setItem(highestSeenKey, String(nextHighest));
      for (const badge of BADGES) {
        if (badge.level <= nextHighest) {
          localStorage.setItem(`badge_shown_${userIdentity}_${badgeResetToken}_level_${badge.level}`, "true");
        }
      }
      await markBadgeSeen(nextHighest);
    }
    setPopupBadge(null);
    setPendingBadgeLevel(null);
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F7F8FA" }}>
      {popupBadge && <BadgePopup badge={popupBadge} onClose={handleCloseBadgePopup} />}
      <Sidebar />
      <main className="flex-1 overflow-y-auto min-w-0 pt-14 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
