// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Index from "../../src/pages/PayslipSetup/index";
import axios from "axios";
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

describe("PayslipSetup: Dynamic Categories", () => {
    // Helper function to render the component and return the userEvent instance
    function setup(){
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <Index />
            </MemoryRouter>
        );
        return { user };
    }

    beforeEach(() => {
        vi.clearAllMocks();
        // mock axios.get to render the page
        (axios.get as any).mockResolvedValueOnce({
            data: {
                grossSalary: "",
                takeHomePay: null,
                taxPaid: null,
                niPaid: null,
                categories: [],
            },
        });
    });

    it("preserves existing category values when new rows are added", async () => {
        // GIVEN: Existing catgeory values and a new category row is added
        // Call the setup function to render the component and get the userEvent instance
        const { user } = setup();
        
        // Find the first category name and amount input
        const categoryNameInput = await screen.findAllByPlaceholderText(/category name/i);
        const categoryAmountInput = await screen.findAllByPlaceholderText(/amount/i);

        // WHEN: The user sets the first category name and amount the clicks the "Add Category" button
        await user.type(categoryNameInput[0], "Rent");
        await user.type(categoryAmountInput[0], "500");
        const addButton = screen.getByRole("button", { name: /add category/i });
        await user.click(addButton);
        const categoryNameInputsAfter = await screen.findAllByPlaceholderText(/category name/i);
        const categoryAmountInputsAfter = await screen.findAllByPlaceholderText(/amount/i);

        // THEN: The previous rows still contain the added category values when re-queried
        expect(categoryNameInputsAfter).toHaveLength(2);
        expect(categoryAmountInputsAfter).toHaveLength(2);

        expect(categoryNameInputsAfter[0]).toHaveValue("Rent");
        expect(categoryAmountInputsAfter[0]).toHaveValue(500);

        expect(categoryNameInputsAfter[1]).toHaveValue("");
        expect(categoryAmountInputsAfter[1]).toHaveValue(null);
    });
});

