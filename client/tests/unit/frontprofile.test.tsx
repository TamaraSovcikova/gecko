// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import Profile from "../../src/pages/Profile";
import React from "react";

vi.mock("axios");
vi.mock("../../src/firebase/config", () => ({auth: {}, app: {}}));
vi.mock("firebase/auth", () => ({signOut: vi.fn().mockResolvedValue(undefined)}));
vi.mock("../../src/context/AuthContext", () => ({
    useAuth: () => ({
        currentUser: { uid: "testuser", email: "test@example.com" },
        token: "fake-token",
        loading: false,
    })
}));
vi.mock("../../src/components/TopNav", () => ({default: () => <div>Mocked TopNav</div>}));
vi.mock("../../src/components/ProfileAvatar", () => ({default: () => <div>Mocked ProfileAvatar</div>}));
vi.mock("../../src/components/TooltipGuide", () => ({default: () => <div>Mocked TooltipGuide</div>}));
vi.mock("../../src/hooks/usePageOnboarding", () => ({
    usePageOnboarding: () => ({
        isOpen: false,
        activeStepNumber: 0,
        steps: [],
        closeGuide: vi.fn(),
        completeGuide: vi.fn(),
        goToStep: vi.fn(),
    })
}));
describe("Frontend: Profile deletion cofirmation", () => {beforeEach(() => {vi.clearAllMocks()});

    it("ensure confirmation message appears on screen after 'delete account' button pressed", async () => {
        // GIVEN: all components of profile and valid authenticated user
        (axios.get as any).mockResolvedValue({
            data: {displayName: "Test User",
                email: "test@example.com",
                createdAt: new Date().toISOString(),
                xpTotal: 0,
                payslipData: {grossSalary: 0, jobTitle: "Software Engineer Intern", location: "London"}
            }
        });

        const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

        // WHEN: The user clicks the Delete Profile button
        render(
            <MemoryRouter>
                <Profile />
            </MemoryRouter>
        );

        const deleteButton = await screen.findByRole("button", {name: /delete profile/i,});
        fireEvent.click(deleteButton);

        // THEN: The confirmation message should be shown to the user where they can decide to delete or not
        expect(confirmSpy).toHaveBeenCalledWith("Deleting your account is irreversible. This will permanently remove your profile and associated data, including monthly snapshots and newsletter subscriptions ");
    })
});