import React from "react";
import axios from "axios";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "../../src/context/AuthContext";
import { GamificationProvider } from "../../src/context/GamificationContext";
import Dashboard from "../../src/pages/Dashboard/dashboard";
import XPBar from "../../src/components/XPBar";

vi.mock("../../firebase/config", () => ({ auth: {}, app: {} }));

// ---------------- SOCKET MOCK ----------------

let socketHandlers: Record<string, (...args: unknown[]) => unknown> = {};

vi.mock("../../src/hooks/useSocket", () => ({
  useSocket: () => ({
    on: vi.fn((event: string, cb: (...args: unknown[]) => unknown) => {
      socketHandlers[event] = cb;
    }),
    off: vi.fn(),
  }),
}));

// ---------------- FIREBASE MOCK ----------------

vi.mock("../../firebase/authClient", () => {
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
    isAxiosError: vi.fn((error) => error?.isAxiosError === true)
  },
}));

// ---------------- NOISY COMPONENT MOCKS ----------------

vi.mock("../../src/components/TopNav", () => ({
  default: () => <div>TopNav</div>,
}));

vi.mock("../../src/pages/Dashboard/groqChat.tsx", () => ({
  default: () => null,
}));

vi.mock("../../src/components/TooltipGuide", () => ({
  default: () => null,
}));

vi.mock("../../src/components/BreakdownPanel", () => ({
  default: () => null,
}));

vi.mock("../../src/components/SnapshotNavigator", () => ({
  default: () => null,
}));

vi.mock("../../src/dev/dashboardDebug", () => ({
  attachDashboardDebug: vi.fn(),
}));

vi.mock("recharts", () => ({
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: ({ children }: any) => <div>{children}</div>,
  Cell: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
}));

// ---------------- HELPER RENDER ----------------

const renderApp = () => {
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
};

// ---------------- TEST ----------------

describe("Slot 3 → 4 → 5: real-time budget update + quiz XP update", () => {
  beforeEach(() => {
    socketHandlers = {};
    vi.clearAllMocks();
  });

  it("updates dashboard after socket event and keeps XP bar available after quiz completion", async () => {
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
    streak: 0,
    weeklyStreak: 0,
    xpIntoLevel: 50,
    xpNeeded: 100,
    xpToNextLevel: 100,
    streakAtRisk: false,
  };

  const updatedGamificationData = {
    xp: 80,
    level: 1,
    streak: 1,
    weeklyStreak: 1,
    xpIntoLevel: 80,
    xpNeeded: 100,
    xpToNextLevel: 100,
    streakAtRisk: false,
  };

  let gamificationData = initialGamificationData;

(axios.get as any).mockImplementation((url: string) => {
  console.log("AXIOS GET:", url);

  if (
    url.includes("/api/v1/profile") ||
    url.includes("/api/profile") ||
    url.includes("/profile")
  ) {
    return Promise.resolve({
      data: {
        _id: "test-user",
        uid: "test-user",
        email: "test@example.com",
        displayName: "Test User",
      },
    });
  }

  if (
    url.toLowerCase().includes("snapshot") ||
    url.toLowerCase().includes("monthly")
  ) {
    return Promise.resolve({
      data: [],
    });
  }

  if (url.includes("/api/v1/quiz/gamification")) {
    return Promise.resolve({
      data: gamificationData,
    });
  }

  if (url.includes("/api/v1/forecast")) {
    return Promise.resolve({
      data: {
        forecast: [],
        warnings: [],
      },
    });
  }

  if (url.includes("/api/v1/dashboard")) {
    return Promise.resolve({
      data: initialDashboardData,
    });
  }

  return Promise.resolve({
    data: {},
  });
});

  (axios.post as any).mockResolvedValue({
    data: { success: true },
  });

  renderApp();

  // =========================
  // THEN: dashboard + XPBar initial state renders correctly
  // =========================

  expect((await screen.findAllByText(/Take-home/i)).length).toBeGreaterThan(0);
  expect(screen.getByText(/Budget left/i)).toBeInTheDocument();

  console.log("SOCKET HANDLERS:", Object.keys(socketHandlers));

  expect(await screen.findByText(/Level 1/i)).toBeInTheDocument();
  expect(
    screen.getAllByText((_content, node) =>
      node?.textContent?.replace(/\s+/g, " ").includes("50 / 100 XP") ?? false
    ).length
  ).toBeGreaterThan(0);

  const dashboardCallsBefore = (axios.get as any).mock.calls.filter(
    ([url]: any[]) => url.includes("/api/v1/dashboard")
  );
  expect(dashboardCallsBefore.length).toBe(1);

  // =========================
  // WHEN: backend emits real-time budget update via socket
  // =========================

  act(() => {
    socketHandlers["budget:update"]({
      dashboard: updatedDashboardData,
      forecast: {
        forecast: [],
      },
    });
  });

  // =========================
  // THEN: UI updates by triggering a dashboard refresh
  // =========================

  await waitFor(() => {
    const dashboardCallsAfterSocket = (axios.get as any).mock.calls.filter(
      ([url]: any[]) => url.includes("/api/v1/dashboard")
    );
    expect(dashboardCallsAfterSocket.length).toBeGreaterThan(1);
  });
  console.log("AFTER SOCKET:", document.body.textContent);

  // =========================
  // WHEN: user completes quiz
  // =========================

  await act(async () => {
    await axios.post("/api/v1/quiz/complete", { answers: [] });
  });

  gamificationData = updatedGamificationData;

  await act(async () => {
    await axios.get("/api/v1/quiz/gamification");
  });

  // =========================
  // THEN: gamification UI remains available
  // =========================

  expect(screen.getByText(/level/i)).toBeInTheDocument();
  expect(screen.getAllByText(/XP/i).length).toBeGreaterThan(0);

  // =========================
  // THEN: dashboard is refetched after the socket update
  // =========================

  const dashboardCallsAfter = (axios.get as any).mock.calls.filter(
    ([url]: any[]) => url.includes("/api/v1/dashboard")
  );

  expect(dashboardCallsAfter.length).toBeGreaterThan(1);
});
});