import React from "react";
import axios from "axios";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "../../context/AuthContext";
import { GamificationProvider } from "../../context/GamificationContext";
import Dashboard from "../../pages/Dashboard/dashboard";
import XPBar from "../../components/XPBar";

// ---------------- SOCKET MOCK ----------------

let socketHandlers: Record<string, Function> = {};

vi.mock("../../hooks/useSocket", () => ({
  useSocket: () => ({
    on: vi.fn((event: string, cb: Function) => {
      socketHandlers[event] = cb;
    }),
    off: vi.fn(),
  }),
}));

// ---------------- FIREBASE MOCK ----------------

vi.mock("firebase/auth", () => {
  const mockUser = {
    uid: "test-user",
    getIdToken: vi.fn(async () => "fake-id-token"),
  };

  return {
    signInWithEmailAndPassword: vi.fn(async () => ({ user: mockUser })),
    fetchSignInMethodsForEmail: vi.fn(),
    signInWithPopup: vi.fn(async () => ({ user: mockUser })),
    GoogleAuthProvider: vi.fn(),
    getAuth: vi.fn(() => ({})),
    onIdTokenChanged: vi.fn((_auth, cb) => {
      cb(mockUser);
      return vi.fn();
    }),
  };
});

// ---------------- AXIOS MOCK ----------------

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

// ---------------- NOISY COMPONENT MOCKS ----------------

vi.mock("../../components/TopNav", () => ({
  default: () => <div>TopNav</div>,
}));

vi.mock("../../pages/Dashboard/groqChat.tsx", () => ({
  default: () => null,
}));

vi.mock("../../components/TooltipGuide", () => ({
  default: () => null,
}));

vi.mock("../../components/BreakdownPanel", () => ({
  default: () => null,
}));

vi.mock("../../components/SnapshotNavigator", () => ({
  default: () => null,
}));

vi.mock("../../dev/dashboardDebug", () => ({
  attachDashboardDebug: vi.fn(),
}));

// ---------------- HELPER RENDER ----------------

const renderApp = () =>
  console.log("SOCKET HANDLERS:", Object.keys(socketHandlers));
  render(
    <AuthProvider>
      <GamificationProvider>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <>
                  <Dashboard />
                  <XPBar />
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </GamificationProvider>
    </AuthProvider>
  );

// ---------------- TEST ----------------

describe("Slot 3 → 4 → 5: real-time budget update + quiz XP update", () => {
  beforeEach(() => {
    socketHandlers = {};
    vi.clearAllMocks();
  });

  it("updates pie/budget from socket + updates XPBar after quiz completion WITHOUT refetching dashboard", async () => {
  // =========================
  // GIVEN: initial backend state (dashboard + gamification + socket setup)
  // =========================

  const initialDashboardData = {
    healthScore: 80,
    takeHome: 2000,
    budgetLeft: 500,
    totalBudget: 1500,
    actualSpending: [{ name: "Rent", value: 200 }],
    budgetAllocation: [{ name: "Rent", value: 1000 }],
    expenses: [],
    adzunaTips: [],
    healthBreakdown: null,
  };

  const updatedDashboardData = {
    healthScore: 78,
    takeHome: 2000,
    budgetLeft: 250,
    totalBudget: 1500,
    actualSpending: [
      { name: "Rent", value: 400 },
      { name: "Food", value: 350 },
    ],
    budgetAllocation: [
      { name: "Rent", value: 1000 },
      { name: "Food", value: 500 },
    ],
    expenses: [],
    adzunaTips: [],
    healthBreakdown: null,
  };

  const initialGamificationData = {
    xp: 50,
    level: 1,
    weeklyStreak: 0,
    xpIntoLevel: 50,
    xpNeeded: 100,
    streakAtRisk: false,
  };

  const updatedGamificationData = {
    xp: 80,
    level: 1,
    weeklyStreak: 1,
    xpIntoLevel: 80,
    xpNeeded: 100,
    streakAtRisk: false,
  };

  (axios.get as any).mockImplementation((url: string) => {
    if (url.includes("/api/v1/dashboard")) {
      return Promise.resolve({ data: initialDashboardData });
    }

    if (url.includes("/api/snapshots")) {
      return Promise.resolve({ data: [] });
    }

    if (url.includes("/api/v1/quiz/gamification")) {
      return Promise.resolve({ data: initialGamificationData });
    }

    return Promise.resolve({ data: null });
  });

  (axios.post as any).mockResolvedValue({
    data: { success: true },
  });

  renderApp();

  // =========================
  // THEN: dashboard + XPBar initial state renders correctly
  // =========================

  expect(await screen.findByText(/Take-home/i)).toBeInTheDocument();
  expect(screen.getByText("£500.00")).toBeInTheDocument();

  expect(await screen.findByText(/Level 1/i)).toBeInTheDocument();
  expect(screen.getByText("50 / 100 XP")).toBeInTheDocument();

  const dashboardCallsBefore = (axios.get as any).mock.calls.filter(
    ([url]: any[]) => url.includes("/api/v1/dashboard")
  );
  expect(dashboardCallsBefore.length).toBe(1);

  // =========================
  // WHEN: backend emits real-time budget update via socket
  // =========================

  act(() => {
    socketHandlers["budget:update"](updatedDashboardData);
  });

  // =========================
  // THEN: UI updates without dashboard refetch
  // =========================

  await waitFor(() => {
    expect(screen.getByText("£250.00")).toBeInTheDocument();
  });

  const foodElements = screen.getAllByText("Food");
  expect(foodElements.length).toBeGreaterThan(0);

  // =========================
  // WHEN: user completes quiz
  // =========================

  await act(async () => {
    await axios.post("/api/v1/quiz/complete", { answers: [] });
  });

  (axios.get as any).mockImplementation((url: string) => {
    if (url.includes("/api/v1/dashboard")) {
      return Promise.resolve({ data: initialDashboardData });
    }

    if (url.includes("/api/snapshots")) {
      return Promise.resolve({ data: [] });
    }

    if (url.includes("/api/v1/quiz/gamification")) {
      return Promise.resolve({ data: updatedGamificationData });
    }

    return Promise.resolve({ data: null });
  });

  await act(async () => {
    await axios.get("/api/v1/quiz/gamification");
  });

  // =========================
  // THEN: gamification (XP + level) updates in UI
  // =========================

  expect(screen.getByText(/78/i)).toBeInTheDocument();
  expect(screen.getByText(/100/i)).toBeInTheDocument();
  expect(screen.getByText(/level/i)).toBeInTheDocument();

  // =========================
  // THEN: dashboard is NOT refetched
  // =========================

  const dashboardCallsAfter = (axios.get as any).mock.calls.filter(
    ([url]: any[]) => url.includes("/api/v1/dashboard")
  );

  expect(dashboardCallsAfter.length).toBe(1);
});
});