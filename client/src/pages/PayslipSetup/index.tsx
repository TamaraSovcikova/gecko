import { FormEvent, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { registerUser } from "../../api/authApi";
import CategoryBuilder from "../../components/CategoryBuilder.jsx";
import PayslipBreakdown from "../../components/PayslipBreakdown.jsx";
import TopNav from "../../components/TopNav";

type Category = {
  name: string;
  amount: string; // string while typing; converted to budget number on submit
};

type JobOption = {
  title: string;
  label: string;
  count?: number;
};

type LocationOption = {
  title: string;
  label: string;
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
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [jobOptions, setJobOptions] = useState<JobOption[]>([]);
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [jobSearchLoading, setJobSearchLoading] = useState(false);
  const [locationSearchLoading, setLocationSearchLoading] = useState(false);
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [jobSearchQuery, setJobSearchQuery] = useState("");
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PayslipResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Load existing payslip on mount
  useEffect(() => {
    const loadExistingPayslip = async () => {
      if (!token) return;

      try {
        const response = await axios.get<PayslipResponse>(
          `${API_URL}/api/v1/payslip`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data) {
          setGrossSalary(response.data.grossSalary.toString());
          setIsEditing(true);
          setResult(response.data);

          if (response.data.categories && response.data.categories.length > 0) {
            setCategories(
              response.data.categories.map((cat) => ({
                name: cat.name,
                amount: cat.budget.toString(),
              }))
            );
          }
        }
      } catch (error) {
        if (!axios.isAxiosError(error) || error.response?.status !== 404) {
          console.error("Error loading payslip:", error);
        }
      }
    };

    loadExistingPayslip();
  }, [token]);

  // Fetch job titles from Adzuna when query changes
  useEffect(() => {
    if (!showJobDropdown || !token) return;

    const searchJobs = async () => {
      setJobSearchLoading(true);
      try {
        const res = await axios.get(
          `${API_URL}/api/v1/user/job-search`,
          {
            params: { query: jobSearchQuery },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setJobOptions(res.data.jobs || []);
      } catch (err) {
        console.error("Error searching jobs:", err);
      } finally {
        setJobSearchLoading(false);
      }
    };

    // Debounce the search
    const timer = setTimeout(searchJobs, 300);
    return () => clearTimeout(timer);
  }, [jobSearchQuery, showJobDropdown, token]);

  // Fetch locations from Adzuna when query changes
  useEffect(() => {
    if (!showLocationDropdown || !token) return;

    const searchLocations = async () => {
      setLocationSearchLoading(true);
      try {
        const res = await axios.get(
          `${API_URL}/api/v1/user/location-search`,
          {
            params: { query: locationSearchQuery },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setLocationOptions(res.data.locations || []);
      } catch (err) {
        console.error("Error searching locations:", err);
      } finally {
        setLocationSearchLoading(false);
      }
    };

    // Debounce the search
    const timer = setTimeout(searchLocations, 300);
    return () => clearTimeout(timer);
  }, [locationSearchQuery, showLocationDropdown, token]);

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
    const normalizedCategoryNames = categories
      .map((category) => category.name.trim().toLowerCase())
      .filter(Boolean);

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

    if (new Set(normalizedCategoryNames).size !== normalizedCategoryNames.length) {
      nextErrors.push("Category names must be unique.");
    }

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

      const payload = {
        grossSalary: Number(grossSalary),
        // Send `budget` to match the CategorySchema field name
        categories: categories.map((c) => ({
          name: c.name.trim(),
          budget: Number(c.amount),
        })),
      };

      if (isEditing) {
        // Update existing payslip
        const response = await axios.put<PayslipResponse>(
          `${API_URL}/api/v1/payslip`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setResult(response.data);
        setApiError("");

        // Also update user profile with job title and location if provided
        if (jobTitle || location) {
          await axios.patch(
            `${API_URL}/api/v1/user/profile`,
            {
              payslipData: {
                grossSalary: Number(grossSalary),
                jobTitle: jobTitle,
                location: location
              }
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      } else {
        // Create new payslip
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
            setIsEditing(true);
            setGrossSalary(existing.data.grossSalary.toString());
            if (existing.data.categories) {
              setCategories(
                existing.data.categories.map((cat) => ({
                  name: cat.name,
                  amount: cat.budget.toString(),
                }))
              );
            }
            setApiError("");
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

        const submitPayslip = () =>
          axios.post<PayslipResponse>(
            `${API_URL}/api/v1/payslip`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } },
          );

        try {
          const response = await submitPayslip();
          setResult(response.data);
          setIsEditing(true);

          // Also update user profile with job title and location if provided
          if (jobTitle || location) {
            await axios.patch(
              `${API_URL}/api/v1/user/profile`,
              {
                payslipData: {
                  grossSalary: Number(grossSalary),
                  jobTitle: jobTitle,
                  location: location
                }
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }
        } catch (firstError: unknown) {
          if (!axios.isAxiosError(firstError)) {
            throw firstError;
          }

          // Client-side fallback only: ensure a User document exists, then retry once.
          if (firstError.response?.status === 500) {
            // If backend saved payslip but failed after write, recover via GET.
            try {

            // Also update user profile with job title and location if provided
            if (jobTitle || location) {
              await axios.patch(
                `${API_URL}/api/v1/user/profile`,
                {
                  payslipData: {
                    grossSalary: Number(grossSalary),
                    jobTitle: jobTitle,
                    location: location
                  }
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );
            }
              const existingAfterFailure = await fetchExistingPayslip();
              if (existingAfterFailure.data) {
                setResult(existingAfterFailure.data);
                setIsEditing(true);
                setApiError("Payslip appears saved. Refresh or continue to dashboard.");
                return;
              }
            } catch {
              // Ignore and continue fallback path.
            }

            await registerUser(token);
            const retryResponse = await submitPayslip();
            setResult(retryResponse.data);
            setIsEditing(true);
            return;
          }

          throw firstError;
        }
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
      <TopNav />

      <div className="row justify-content-center">
        <div className="col-12 col-lg-9">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4 p-md-5">
              <h1 className="h3 mb-2">Payslip {isEditing ? "Details" : "Setup"}</h1>
              <p className="text-muted mb-4">
                {isEditing
                  ? "Update your gross salary and category allocations."
                  : "Add your gross salary and category allocations to build your monthly breakdown."}
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

                {/* Tips Box for Job Title & Location */}
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "16px",
                    backgroundColor: "#fef9e7",
                    border: "2px solid #fcc200",
                    borderRadius: "8px",
                  }}
                >
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div style={{ fontSize: "24px", minWidth: "30px" }}>💡</div>
                    <div>
                      <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600", color: "#333" }}>
                        Add Job Title & Location for Tips
                      </h4>
                      <p style={{ margin: "0", fontSize: "13px", color: "#666", lineHeight: "1.5" }}>
                        Providing your job title and location unlocks personalized financial insights, salary comparisons with market data, and tailored tips on your dashboard.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Job Title Dropdown */}
                <div className="mb-3" style={{ position: "relative" }}>
                  <label htmlFor="jobTitle" className="form-label">
                    Job Title (Optional)
                  </label>
                  <input
                    id="jobTitle"
                    type="text"
                    className="form-control"
                    placeholder="Search or type job title..."
                    value={jobSearchQuery}
                    onChange={(e) => {
                      setJobSearchQuery(e.target.value);
                      setShowJobDropdown(true);
                    }}
                    onFocus={() => setShowJobDropdown(true)}
                  />

                  {/* Job options dropdown */}
                  {showJobDropdown && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        backgroundColor: "#fff",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        maxHeight: "200px",
                        overflowY: "auto",
                        zIndex: 10,
                        marginTop: "2px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                      }}
                    >
                      {jobSearchLoading ? (
                        <div style={{ padding: "10px", color: "#999", fontSize: "12px" }}>
                          Loading jobs...
                        </div>
                      ) : jobOptions.length > 0 ? (
                        jobOptions.map((job, index) => (
                          <div
                            key={index}
                            onClick={() => {
                              setJobTitle(job.title);
                              setJobSearchQuery(job.label);
                              setShowJobDropdown(false);
                            }}
                            style={{
                              padding: "10px 12px",
                              borderBottom: "1px solid #f0f0f0",
                              cursor: "pointer",
                              backgroundColor: "transparent",
                              transition: "background-color 0.2s"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#f5f5f5";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "transparent";
                            }}
                          >
                            <div style={{ fontSize: "14px", color: "#333", fontWeight: "500" }}>
                              {job.label}
                            </div>
                            {job.count && (
                              <div style={{ fontSize: "12px", color: "#999" }}>
                                {job.count} jobs available
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: "10px", color: "#999", fontSize: "12px" }}>
                          No jobs found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Location Dropdown */}
                <div className="mb-3" style={{ position: "relative" }}>
                  <label htmlFor="location" className="form-label">
                    Location (Optional)
                  </label>
                  <input
                    id="location"
                    type="text"
                    className="form-control"
                    placeholder="Search or type location..."
                    value={locationSearchQuery}
                    onChange={(e) => {
                      setLocationSearchQuery(e.target.value);
                      setShowLocationDropdown(true);
                    }}
                    onFocus={() => setShowLocationDropdown(true)}
                  />

                  {/* Location options dropdown */}
                  {showLocationDropdown && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        backgroundColor: "#fff",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        maxHeight: "200px",
                        overflowY: "auto",
                        zIndex: 10,
                        marginTop: "2px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                      }}
                    >
                      {locationSearchLoading ? (
                        <div style={{ padding: "10px", color: "#999", fontSize: "12px" }}>
                          Loading locations...
                        </div>
                      ) : locationOptions.length > 0 ? (
                        locationOptions.map((loc, index) => (
                          <div
                            key={index}
                            onClick={() => {
                              setLocation(loc.title);
                              setLocationSearchQuery(loc.label);
                              setShowLocationDropdown(false);
                            }}
                            style={{
                              padding: "10px 12px",
                              borderBottom: "1px solid #f0f0f0",
                              cursor: "pointer",
                              backgroundColor: "transparent",
                              transition: "background-color 0.2s"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#f5f5f5";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "transparent";
                            }}
                          >
                            <div style={{ fontSize: "14px", color: "#333", fontWeight: "500" }}>
                              {loc.label}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: "10px", color: "#999", fontSize: "12px" }}>
                          No locations found
                        </div>
                      )}
                    </div>
                  )}
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
                    {loading ? (isEditing ? "Updating..." : "Saving...") : (isEditing ? "Update Payslip" : "Save Payslip")}
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
