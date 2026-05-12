// client/src/MainLayout.tsx
// shows XP bar in every page
// seperate from App.tsx which stores routes

import XPBar from "./components/XPBar";
import BadgePopup from "./components/BadgePopup";
import { BADGES } from "./components/Badge";
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useGamification } from "./context/GamificationContext";
import { useAuth } from "./context/AuthContext";

const XP_BAR_CLEARANCE = 112;

export default function MainLayout() {
  const { data } = useGamification();
  const { currentUser } = useAuth();
  const [popupBadge, setPopupBadge] = useState<any>(null);

  useEffect(() => {
    setPopupBadge(null);
  }, [currentUser?.uid]);

  useEffect(() => {
    const userId = currentUser?.uid;
    if (!data || !userId) return;

    const unlockedBadges = BADGES.filter((b) => data.level >= b.level);
    const makeKey = (level: number) => `badge_shown_${userId}_level_${level}`;

    const notShown = unlockedBadges.filter(
      (badge) => !localStorage.getItem(makeKey(badge.level)),
    );

    if (notShown.length === 0) return;

    const highestNewBadge = notShown[notShown.length - 1];

    // If users jump multiple levels at once (e.g. seeded/demo accounts),
    // show the highest relevant badge first and mark lower unlocked levels as shown.
    for (const badge of unlockedBadges) {
      if (badge.level <= highestNewBadge.level) {
        localStorage.setItem(makeKey(badge.level), "true");
      }
    }

    setPopupBadge(highestNewBadge);
  }, [data, currentUser?.uid]);

  return (
    <>
      {popupBadge && (
        <BadgePopup badge={popupBadge} onClose={() => setPopupBadge(null)} />
      )}
      <XPBar />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          paddingBottom: `${XP_BAR_CLEARANCE}px`,
        }}
      >
        <Outlet />
      </div>
    </>
  );
}