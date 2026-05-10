// client/src/tests/integration/gdprDeleteProfile.test.tsx

/*
Slots 3 -> 6 -> 1: GDPR Compliance Evidence

What it Tests:
Can a user securely wipe all their data?

Frontend Journey:
Render the Profile page. Mock the Delete Account API success. 

Assert that AuthContext is completely cleared (null) and the
router forcefully kicks the user back to /login.

*/

import React from "react";
import axios from "axios";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "../../context/AuthContext";
import Profile from "../../pages/Profile";
import Login from "../../pages/Login";

// ---------------- FIREBASE MOCK ----------------

let authStateCallback: ((user: any) => void) | null = null;

vi.mock("firebase/auth", () => {
  const mockUser = {
    uid: "test-user",
    email: "test@example.com",
    getIdToken: vi.fn(async () => "fake-id-token"),
  };

  return {
    getAuth: vi.fn(() => ({})),

    onIdTokenChanged: vi.fn((_auth, cb) => {
      authStateCallback = cb;
      setTimeout(() => cb(mockUser), 0);
      return vi.fn();
    }),

    signOut: vi.fn(async () => {
      // simulate firebase clearing the user after sign out
      if (authStateCallback) authStateCallback(null);
    }),
  };
});

// ---------------- AXIOS MOCK ----------------

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

// ---------------- NOISY COMPONENT MOCKS ----------------

vi.mock("../../components/TopNav", () => ({
  default: () => <div>TopNav</div>,
}));

vi.mock("../../components/ProfileAvatar", () => ({
  default: () => <div>Avatar</div>,
}));

vi.mock("../../components/TooltipGuide", () => ({
  default: () => null,
}));

vi.mock("../../hooks/usePageOnboarding", () => ({
  usePageOnboarding: () => ({
    isOpen: false,
    activeStepNumber: 0,
    steps: [],
    closeGuide: vi.fn(),
    completeGuide: vi.fn(),
    goToStep: vi.fn(),
  }),
}));

vi.mock("../../context/GamificationContext", () => ({
  useGamification: () => ({
    data: null,
  }),
}));

// ---------------- TEST RENDER ----------------

const renderApp = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Login />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );

// ---------------- TEST ----------------

describe("Slots 3 ➔ 6 ➔ 1: GDPR Compliance Evidence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("wipes all user data and forcefully logs the user out back to /login", async () => {
    // =========================
    // GIVEN: user profile loads correctly
    // =========================

    (axios.get as any).mockResolvedValue({
      data: {
        displayName: "Test User",
        email: "test@example.com",
        createdAt: new Date().toISOString(),
        payslipData: {
          grossSalary: 60000,
          jobTitle: "Developer",
          location: "London",
        },
      },
    });

    // GIVEN: GDPR delete endpoint succeeds
    (axios.delete as any).mockResolvedValue({ data: { success: true } });

    // GIVEN: confirm dialog returns true
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderApp();

    // THEN: profile page renders
    expect(await screen.findByText(/PROFILE/i)).toBeInTheDocument();
    expect(await screen.findByText(/Test User/i)).toBeInTheDocument();

    // =========================
    // WHEN: user deletes their profile
    // =========================

    const deleteButton = screen.getByRole("button", {
      name: /delete profile/i,
    });

    fireEvent.click(deleteButton);

    // =========================
    // THEN: backend delete endpoint is called
    // =========================

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/user/profile"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer fake-id-token",
          }),
        }),
      );
    });

    // =========================
    // THEN: user is logged out and redirected to login page
    // =========================

    expect(
        await screen.findByRole("button", { name: /^login$/i })
    ).toBeInTheDocument();
  });
});