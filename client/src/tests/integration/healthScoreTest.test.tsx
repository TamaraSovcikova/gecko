// client/src/tests/integration/healthScoreTest.test.tsx

/*
FRONTEND Testing for slots 1 --> 2 --> 3

What it Tests:
Can a user register, input their finances and view them on the Dashboard? 


Frontend Journey:
Render the Login component. Mock a successful login. 

Assert the router redirects to /payslip-setup. Fill out the mocked form.
Assert the router redirects to /dashboard and displays the correct health score
based on the setup context.
*/
vi.stubEnv("VITE_DISABLE_FORECAST", "true");

import React from "react";
import axios from "axios";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "../../context/AuthContext";
import Login from "../../pages/Login/index";
import PayslipSetup from "../../pages/PayslipSetup/index";
import Dashboard from "../../pages/Dashboard/dashboard";
import { registerUser } from "../../api/authApi";
import { userEvent } from "@testing-library/user-event";
import { GamificationProvider } from "../../context/GamificationContext";


// --------- Mocks ---------
const listeners: ((user: any) => void)[] = [];

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

    // IMPORTANT: trigger auth callback immediately
    onIdTokenChanged: vi.fn((_auth, cb) => {
      listeners.push(cb);
      cb(mockUser);
      return vi.fn();
    }),
  };
});

vi.mock("../../api/authApi", () => ({
  registerUser: vi.fn(async () => ({
    firstLogin: true, // force redirect to /payslip
    user: {},
  })),
}));

/*
vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));
*/

vi.mock("axios", () => ({
  default: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/v1/dashboard")) {
        return Promise.resolve({
          data: {
            healthScore: 75,
            takeHome: 2500,
            budgetLeft: 500,
            totalBudget: 2000,
            actualSpending: [{ name: "Food", value: 300 }],
            budgetAllocation: [{ name: "Food", value: 400 }],
            expenses: [],
            adzunaTips: [],
          },
        });
      }

      if (url.includes("/api/snapshots")) {
        return Promise.resolve({
          data: {
            snapshots: [],
          },
        });
      }

      return Promise.resolve({ data: null });
    }),

    post: vi.fn().mockResolvedValue({
      data: { success: true },
    }),

    put: vi.fn().mockResolvedValue({
      data: { success: true },
    }),

    patch: vi.fn().mockResolvedValue({
      data: { success: true },
    }),
  },
}));


// --------- Helper ---------

const renderApp = (initialRoute = "/login") =>
  render(
    <AuthProvider>
      <GamificationProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/payslip" element={<PayslipSetup />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </MemoryRouter>
      </GamificationProvider>
    </AuthProvider>
  );

// --------- Test ---------

describe("Frontend journey: login → payslip → dashboard", () => {
  it("lets a user login and gets redirected to the payslip form", async () => {
    // GIVEN: the PayslipSetup page requests existing payslip data
    // THEN: return valid empty payslip data so the UI renders (not stuck on loading)
    (axios.get as any).mockResolvedValue({
      data: {
        grossSalary: 0,
        taxCode: "",
        categories: [],
      },
    });

    // GIVEN: the Dashboard page requests aggregated dashboard data
    // THEN: return mock dashboard values including a known healthScore
    (axios.get as any).mockImplementation((url: string) => {
      if (url.includes("/api/v1/dashboard")) {
        return Promise.resolve({
          data: {
            healthScore: 75,
            takeHome: 2500,
            budgetLeft: 500,
            totalBudget: 2000,
            actualSpending: [{ name: "Food", value: 300 }],
            budgetAllocation: [{ name: "Food", value: 400 }],
            expenses: [],
            adzunaTips: [],
            healthBreakdown: null,
          },
        });
      }



      // GIVEN: dashboard snapshot mode loads snapshot history
      // THEN: return an empty snapshot list so it does not break rendering
      if (url.includes("/api/snapshots")) {
        return Promise.resolve({ data: [] });
      }

        return Promise.resolve({
          data: {
            grossSalary: 0,
            taxCode: "",
            categories: [],
          },
        });
    });

    // GIVEN: the Login component is rendered
    renderApp("/login");

    // WHEN: the user enters valid login credentials and clicks login
    const emailInput = await screen.findByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole("button", { name: /login/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(loginButton);

    // THEN: the backend registerUser call should happen with the user's Firebase token
    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith("fake-id-token");
    });

    // THEN: the router should redirect to the payslip setup page and render the form
    const grossSalaryInput = await screen.findByLabelText(/gross salary/i);
    expect(grossSalaryInput).toBeInTheDocument();

    // WHEN: the user fills in their payslip salary and submits the form
    fireEvent.change(grossSalaryInput, { target: { value: "60000" } });

    const inputs = screen.getAllByRole("textbox");

    fireEvent.change(inputs[inputs.length - 1], {
      target: { value: "Food" },
    });

    const numberInputs = screen.getAllByRole("spinbutton");

    fireEvent.change(numberInputs[numberInputs.length - 1], {
      target: { value: "1000" },
    });

    // Save Payslip --> Update Payslip
    const savePayslipButton = screen.getByRole("button", {
      name: /Update Payslip/i,
    });

    await userEvent.click(savePayslipButton);
    // DEBUGGING
    console.log("CLICKED SUBMIT");

    // THEN: the router should redirect to /dashboard
    // AND the dashboard should render the expected UI based on mocked dashboard data
    await screen.findByText(/See breakdown/i);

    // THEN: the dashboard should display the correct take-home section
    const takeHomeElement = await screen.findByText(/Take-home/i);
    expect(takeHomeElement).toBeInTheDocument();

    // THEN: the dashboard should display the correct health score based on mocked context
    // (Health score = 75 from axios dashboard mock)
    const healthScoreElement = await screen.findByText("75");
    expect(healthScoreElement).toBeInTheDocument();
  });
});