import { FormEvent, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../firebase/config";
import { registerUser } from "../../api/authApi";
import CategoryBuilder from "../../components/CategoryBuilder.jsx";
import PayslipBreakdown from "../../components/PayslipBreakdown.jsx";

type Category = {
  name: string;
  amount: string; // string while typing; converted to budget number on submit
};

// Shape returned by POST /api/v1/payslip and GET /api/v1/payslip
type PayslipResponse = {
  grossSalary: number;
  taxPaid: number;
  niPaid: number;
  takeHomePay: number;
  categories?: Array<{ name: string; budget: number }>;
};

const API_URL = import.meta.env.VITE_API_URL;

const PayslipSetup = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [grossSalary, setGrossSalary] = useState("");
  const [categories, setCategories] = useState<Category[]>([
    { name: "", amount: "" },
  ]);
  const [errors, setErrors] = useState<string[]>([]);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [result, setResult] = useState<PayslipResponse | null>(null);

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await auth.signOut();
      navigate("/login", { replace: true });
    } catch {
      setApiError("Unable to log out right now. Please try again.");
    } finally {
      setLogoutLoading(false);
    }
  };

  const totalCategoryAmount = useMemo(() => {
    return categories.reduce((sum, category) => {
      const value = Number(category.amount);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);
  }, [categories]);

  const isOverAllocated =
    grossSalary !== "" && !Number.isNaN(Number(grossSalary)) && totalCategoryAmount > Number(grossSalary);

  const addCategory = () => {
    setCategories((prev) => [...prev, { name: "", amount: "" }]);
  };

  const removeCategory = (index: number) => {
    setCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCategory = (
    index: number,
    field: "name" | "amount",
    value: string,
  ) => {
    setCategories((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const validate = () => {
    const nextErrors: string[] = [];
    const salary = Number(grossSalary);

    if (!grossSalary || Number.isNaN(salary) || salary <= 0) {
      nextErrors.push("Gross salary must be greater than 0.");
    }

    categories.forEach((category, index) => {
      if (!category.name.trim()) {
        nextErrors.push(`Category ${index + 1} requires a name.`);
      }

      const amount = Number(category.amount);
      if (!category.amount || Number.isNaN(amount) || amount < 0) {
        nextErrors.push(`Category ${index + 1} amount must be 0 or more.`);
      }
    });

    if (!Number.isNaN(salary) && totalCategoryAmount > salary) {
      nextErrors.push("Total category amount cannot be more than gross salary.");
    }

    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setApiError("");

    if (!validate()) {
      return;
    }

    if (!token) {
      setApiError("You are not authenticated. Please log in again.");
      return;
    }

    try {
      setLoading(true);

      const fetchExistingPayslip = async () => {
        return axios.get<PayslipResponse>(
          `${API_URL}/api/v1/payslip`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
      };

      // Avoid creating duplicates when a payslip already exists.
      try {
        const existing = await fetchExistingPayslip();
        if (existing.data) {
          setResult(existing.data);
          setApiError("A payslip already exists for this account.");
          return;
        }
      } catch (existingError: unknown) {
        if (
          !axios.isAxiosError(existingError) ||
          existingError.response?.status !== 404
        ) {
          throw existingError;
        }
      }

      const payload = {
        grossSalary: Number(grossSalary),
        // Send `budget` to match the CategorySchema field name
        categories: categories.map((c) => ({
          name: c.name.trim(),
          budget: Number(c.amount),
        })),
      };

      const submitPayslip = () =>
        axios.post<PayslipResponse>(
          `${API_URL}/api/v1/payslip`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } },
        );

      try {
        const response = await submitPayslip();
        setResult(response.data);
      } catch (firstError: unknown) {
        if (!axios.isAxiosError(firstError)) {
          throw firstError;
        }

        const message =
          firstError.response?.data?.error ||
          firstError.response?.data?.message ||
          "";

        // Client-side fallback only: ensure a User document exists, then retry once.
        if (firstError.response?.status === 500) {
          // If backend saved payslip but failed after write, recover via GET.
          try {
            const existingAfterFailure = await fetchExistingPayslip();
            if (existingAfterFailure.data) {
              setResult(existingAfterFailure.data);
              setApiError("Payslip appears saved. Refresh or continue to dashboard.");
              return;
            }
          } catch {
            // Ignore and continue fallback path.
          }

          await registerUser(token);
          const retryResponse = await submitPayslip();
          setResult(retryResponse.data);
          return;
        }

        // If payslip already exists and backend enforces uniqueness, show a friendly message.
        if (/duplicate|E11000|already exists/i.test(message)) {
          setApiError("A payslip already exists for this account. Use the dashboard to continue.");
          return;
        }

        throw firstError;
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setApiError(
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Unable to save payslip setup."
        );
      } else {
        setApiError("Unable to save payslip setup.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4 py-md-5">
      <nav className="navbar justify-content-end bg-white border rounded-3 shadow-sm mb-3 px-3">
        <button
          type="button"
          className="btn btn-outline-danger btn-sm"
          onClick={handleLogout}
          disabled={logoutLoading}
        >
          {logoutLoading ? "Logging out..." : "Logout"}
        </button>
      </nav>

      <div className="row justify-content-center">
        <div className="col-12 col-lg-9">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4 p-md-5">
              <h1 className="h3 mb-2">Payslip Setup</h1>
              <p className="text-muted mb-4">
                Add your gross salary and category allocations to build your monthly
                breakdown.
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="grossSalary" className="form-label">
                    Gross Salary (annual)
                  </label>
                  <input
                    id="grossSalary"
                    type="number"
                    className="form-control"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 36000"
                    value={grossSalary}
                    onChange={(e) => setGrossSalary(e.target.value)}
                  />
                </div>

                <CategoryBuilder
                  categories={categories}
                  onAddCategory={addCategory}
                  onRemoveCategory={removeCategory}
                  onUpdateCategory={updateCategory}
                  totalCategoryAmount={totalCategoryAmount}
                  isOverAllocated={isOverAllocated}
                  disabled={loading}
                />

                {errors.length > 0 && (
                  <div className="alert alert-warning" role="alert">
                    <ul className="mb-0">
                      {errors.map((error, index) => (
                        <li key={`error-${index}`}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {apiError && <div className="alert alert-danger">{apiError}</div>}

                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Saving..." : "Save Payslip"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate("/dashboard")}
                  >
                    Go to Dashboard
                  </button>
                </div>
              </form>
            </div>
          </div>

          <PayslipBreakdown
            result={result}
            onContinue={() => navigate("/dashboard")}
          />
        </div>
      </div>
    </div>
  );
};

export default PayslipSetup;
