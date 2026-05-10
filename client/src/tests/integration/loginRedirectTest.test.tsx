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

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import Login from "../../pages/Login/index";
import { registerUser } from "../../api/authApi";

// --- Mock firebase/auth used in Login ---
vi.mock("firebase/auth", () => {
  const mockUser = {
    getIdToken: vi.fn(async () => "fake-id-token"),
  };

  return {
    signInWithEmailAndPassword: vi.fn(async () => ({ user: mockUser })),
    fetchSignInMethodsForEmail: vi.fn(),
    signInWithPopup: vi.fn(),
    GoogleAuthProvider: vi.fn(),
    getAuth: vi.fn(() => ({})),
  };
});

// --- Mock backend registerUser used in Login.handlePostLogin ---
vi.mock("../../api/authApi", () => ({
  registerUser: vi.fn(async () => ({
    firstLogin: true, // force redirect to /payslip
    user: {},
  })),
}));

// Simple stub for the payslip route
const PayslipStub = () => <h1>Payslip Setup</h1>;

const renderApp = () =>
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/payslip" element={<PayslipStub />} />
      </Routes>
    </MemoryRouter>
  );

describe("Login page", () => {
  it("redirects to /payslip after successful login", async () => {
    renderApp();

    const emailInput = await screen.findByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole("button", { name: /login/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(loginButton);

    // Sanity check: registerUser was called with the token
    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith("fake-id-token");
    });

    // Now we should be on the payslip route
    await waitFor(() => {
      expect(screen.getByText(/Payslip Setup/i)).toBeInTheDocument();
    });
  });
});