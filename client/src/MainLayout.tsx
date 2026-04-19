// client/src/MainLayout.tsx
// shows XP bar in every page
// seperate from App.tsx which stores routes

import XPBar from "./components/XPBar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <>
      <XPBar />
      <Outlet />
    </>
  );
}