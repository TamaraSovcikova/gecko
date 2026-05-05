// client/src/tests/authContextTest.test.tsx
import "@testing-library/jest-dom";
import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider, useAuth } from "../src/context/AuthContext";

// -------------------- Mocks --------------------

// axios mock
vi.mock("axios", () => {
  return {
    default: {
      get: vi.fn(),
      isAxiosError: (err: unknown): err is any =>
        typeof err === "object" && err !== null && "isAxiosError" in (err as any),
    },
  };
});

// firebase/auth mock
vi.mock("firebase/auth", () => {
  const mockUnsubscribe = vi.fn();
  const mockOnIdTokenChanged = vi.fn((_auth, callback) => {
    (mockOnIdTokenChanged as any)._callback = callback;
    return mockUnsubscribe;
  });

  return {
    onIdTokenChanged: mockOnIdTokenChanged,
  };
});

// firebase/config mock
vi.mock("../src/firebase/config", () => {
  const mockCurrentUser: any = {
    uid: "test-uid",
    getIdToken: vi.fn(),
  };

  return {
    auth: {
      currentUser: mockCurrentUser,
    },
  };
});

// Helpers to access mocks at runtime
const getMockOnIdTokenChanged = async () => {
  const mod = await import("firebase/auth");
  return (mod as any).onIdTokenChanged as any;
};

const getMockCurrentUser = async () => {
  const mod = await import("../src/firebase/config");
  return (mod as any).auth.currentUser as any;
};

const getAxios = async () => {
  const mod = await import("axios");
  return mod.default as any;
};

// -------------------- Wrapper --------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

// -------------------- Tests --------------------

describe("AuthContext (frontend, Vitest)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts in loading state before Firebase responds", () => {
    // GIVEN the AuthProvider is mounted and Firebase has not yet called back
    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    // THEN the context should indicate that auth state is still loading
    expect(result.current.loading).toBe(true);
    expect(result.current.currentUser).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  it("updates context to authenticated user and profile after Firebase login", async () => {
    // GIVEN Firebase will return a valid user and the backend will return a profile
    const axios = await getAxios();
    const mockCurrentUser = await getMockCurrentUser();
    const mockOnIdTokenChanged = await getMockOnIdTokenChanged();

    (axios.get as any).mockResolvedValueOnce({
      data: {
        displayName: "Test User",
        email: "test@example.com",
        financialOnboarding: { completedPages: ["welcome", "income"] },
        newsletterOptIn: true,
      },
    });

    (mockCurrentUser.getIdToken as any).mockResolvedValueOnce("fake-token");

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    // WHEN Firebase notifies that a user is logged in
    const callback = (mockOnIdTokenChanged as any)._callback as (
      user: any | null,
    ) => Promise<void> | void;

    await callback(mockCurrentUser);

    // THEN the context should expose the authenticated user, token, and profile
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.currentUser).toBe(mockCurrentUser);
    expect(result.current.token).toBe("fake-token");
    expect(result.current.profile).toEqual({
      displayName: "Test User",
      email: "test@example.com",
      onboardingCompletedPages: ["welcome", "income"],
      newsletterOptIn: true,
    });
  });

  it("resets context when Firebase reports logged-out user", async () => {
    // GIVEN the AuthProvider is mounted
    const mockOnIdTokenChanged = await getMockOnIdTokenChanged();

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    // WHEN Firebase notifies that there is no authenticated user
    const callback = (mockOnIdTokenChanged as any)._callback as (
      user: any | null,
    ) => Promise<void> | void;

    await callback(null);

    // THEN the context should reset to an unauthenticated state
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.currentUser).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.profile).toBeNull();
  });
});