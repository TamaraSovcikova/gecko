// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import Dashboard from "../src/pages/Dashboard/dashboard";

vi.mock("axios");
vi.mock("../src/firebase/config", () => ({app: {}, auth: {}}));
vi.mock("../src/context/AuthContext", () => ({useAuth: () => ({
        token: "fake-token",
        loading: false,
        currentUser: { uid: "test_user_id" },
    })}));
vi.mock("../src/context/SocketContext", () => ({useSocket: () => null}));
vi.mock("../src/pages/Dashboard/groqChat.tsx", () => ({default: () => <div>Mocked GroqChat</div>}));
vi.mock("recharts", () => ({
    PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
    Pie: ({ children }: any) => <div>{children}</div>,
    Cell: () => <div />,
    Tooltip: () => <div />,
    Legend: () => <div />
}));

describe("Frontend (Vitest): Empty dashboard charts", () => {beforeEach(() => {vi.clearAllMocks();});

    it("should render the dashboard without crashing when actualSpending is empty", async () => {
        // GIVEN: no actualSpending array data and authenticated user
        vi.mocked(axios.get).mockResolvedValue({
            data: {
                healthScore: 100,
                takeHome: 2000,
                budgetLeft: 2000,
                totalBudget: 0,
                actualSpending: [],
                budgetAllocation: [],
            }} as any);

        // WHEN: The Dashboard component is rendered
        render(
            <MemoryRouter initialEntries={["/dashboard"]}>
                <Dashboard />
            </MemoryRouter>
        );

        // THEN: The dashboard should still display its main UI, with default values
        // AND the component should not crash with empty chart data
        await waitFor(() => {
            expect(screen.getByText("Dashboard")).toBeInTheDocument();
            expect(screen.getByText("Actual Spending")).toBeInTheDocument();
            expect(screen.getByText("Budget Allocation")).toBeInTheDocument();
        });
    });
});