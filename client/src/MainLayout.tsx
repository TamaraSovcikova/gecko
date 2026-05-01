// client/src/MainLayout.tsx
// shows XP bar in every page
// seperate from App.tsx which stores routes

import XPBar from "./components/XPBar";
import BadgePopup from "./components/BadgePopup";
import { BADGES } from "./components/Badge";
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useGamification } from "./context/GamificationContext";

export default function MainLayout() {
  const { data } = useGamification();
  const [popupBadge, setPopupBadge] = useState<any>(null);

  useEffect(() => {
    if (!data) return;

    const unlockedBadges = BADGES.filter((b) => data.level >= b.level);

    for (const badge of unlockedBadges) {
      const key = `badge_shown_level_${badge.level}`;

      // if !localStorage
      // if localStorage to keep seeing it on screen
      if (!localStorage.getItem(key)) {
        setPopupBadge(badge);
        localStorage.setItem(key, "true");
        break;
      }
    }
  }, [data]);

  return (
    <>
      {popupBadge && (
        <BadgePopup badge={popupBadge} onClose={() => setPopupBadge(null)} />
      )}
      <XPBar />
      <Outlet />
    </>
  );
}