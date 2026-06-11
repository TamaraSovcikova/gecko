const BASE = import.meta.env.VITE_API_URL ?? "";

type FinancialProfilePatch = {
  studentLoan?: { plan?: string; balance?: number | null; startYear?: number | null };
  pensionSettings?: { employerMatchPct?: number | null; employeeContributionPct?: number | null };
  readinessCheck?: { completedAt?: string; score?: number; priorities?: string[]; answers?: Record<string, string> };
};

export async function saveFinancialProfile(data: FinancialProfilePatch, token: string): Promise<void> {
  const res = await fetch(`${BASE}/api/v1/user/financial-profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save financial profile");
}
