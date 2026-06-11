import { FormEvent, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { registerUser } from "../../api/authApi";
import CategoryBuilder from "../../components/CategoryBuilder.jsx";
import PayslipBreakdown from "../../components/PayslipBreakdown.jsx";
import TopNav from "../../components/TopNav";
import TooltipGuide from "../../components/TooltipGuide";
import { usePageOnboarding } from "../../hooks/usePageOnboarding";
import { motion, AnimatePresence } from "framer-motion";
import { PoundSterling, Briefcase, MapPin, Lightbulb, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";

type Category = {
  name: string;
  amount: string;
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

type PayslipResponse = {
  grossSalary: number;
  taxPaid: number;
  niPaid: number;
  takeHomePay: number;
  categories?: Array<{ name: string; budget: number }>;
};

const API_URL = import.meta.env.VITE_API_URL;

const FieldInput = ({ label, id, type, value, onChange, placeholder, icon: Icon, required, step, min, "data-onboarding": dataOnboarding }: {
  label: string; id: string; type: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; icon: React.ElementType; required?: boolean; step?: string; min?: string;
  "data-onboarding"?: string;
}) => (
  <div data-onboarding={dataOnboarding}>
    <label htmlFor={id} className="block text-sm font-semibold text-purple-800 mb-1.5">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="w-4 h-4 text-purple-400" />
      </div>
      <input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} step={step} min={min}
        className="w-full pl-10 pr-3 py-2.5 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-900 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" />
    </div>
  </div>
);

const PayslipSetup = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [grossSalary, setGrossSalary] = useState("");
  const [categories, setCategories] = useState<Category[]>([{ name: "", amount: "" }]);
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
  const [isFetchingPayslip, setIsFetchingPayslip] = useState(true);
  const { isOpen: isOnboardingOpen, activeStepNumber, steps: onboardingSteps, closeGuide, completeGuide, goToStep } = usePageOnboarding("/payslip");

  useEffect(() => {
    const loadExistingPayslip = async () => {
      if (!token) return;
      try {
        const response = await axios.get<PayslipResponse>(`${API_URL}/api/v1/payslip`, { headers: { Authorization: `Bearer ${token}` } });
        if (response.data) {
          setGrossSalary(response.data.grossSalary.toString());
          setIsEditing(true);
          setResult(response.data);
          if (response.data.categories && response.data.categories.length > 0) {
            setCategories(response.data.categories.map((cat) => ({ name: cat.name, amount: cat.budget.toString() })));
          }
        }
      } catch (error) {
        if (!axios.isAxiosError(error) || error.response?.status !== 404) {
          console.error("Error loading payslip:", error);
        }
      } finally {
        setIsFetchingPayslip(false);
      }
    };
    loadExistingPayslip();
  }, [token]);

  useEffect(() => {
    if (!showJobDropdown || !token) return;
    const searchJobs = async () => {
      setJobSearchLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/v1/user/job-search`, { params: { query: jobSearchQuery }, headers: { Authorization: `Bearer ${token}` } });
        setJobOptions(res.data.jobs || []);
      } catch (err) {
        console.error("Error searching jobs:", err);
      } finally {
        setJobSearchLoading(false);
      }
    };
    const timer = setTimeout(searchJobs, 300);
    return () => clearTimeout(timer);
  }, [jobSearchQuery, showJobDropdown, token]);

  useEffect(() => {
    if (!showLocationDropdown || !token) return;
    const searchLocations = async () => {
      setLocationSearchLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/v1/user/location-search`, { params: { query: locationSearchQuery }, headers: { Authorization: `Bearer ${token}` } });
        setLocationOptions(res.data.locations || []);
      } catch (err) {
        console.error("Error searching locations:", err);
      } finally {
        setLocationSearchLoading(false);
      }
    };
    const timer = setTimeout(searchLocations, 300);
    return () => clearTimeout(timer);
  }, [locationSearchQuery, showLocationDropdown, token]);

  const totalCategoryAmount = useMemo(() =>
    categories.reduce((sum, category) => { const value = Number(category.amount); return Number.isFinite(value) ? sum + value : sum; }, 0),
    [categories]);

  const isOverAllocated = grossSalary !== "" && !Number.isNaN(Number(grossSalary)) && totalCategoryAmount > Number(grossSalary);

  const addCategory = () => setCategories((prev) => [...prev, { name: "", amount: "" }]);
  const removeCategory = (index: number) => setCategories((prev) => prev.filter((_, i) => i !== index));
  const updateCategory = (index: number, field: "name" | "amount", value: string) => {
    setCategories((prev) => { const next = [...prev]; next[index] = { ...next[index], [field]: value }; return next; });
  };

  const validate = () => {
    const nextErrors: string[] = [];
    const salary = Number(grossSalary);
    const normalizedCategoryNames = categories.map((c) => c.name.trim().toLowerCase()).filter(Boolean);
    if (!grossSalary || Number.isNaN(salary) || salary <= 0) nextErrors.push("Gross salary must be greater than 0.");
    categories.forEach((category, index) => {
      if (!category.name.trim()) nextErrors.push(`Category ${index + 1} requires a name.`);
      const amount = Number(category.amount);
      if (!category.amount || Number.isNaN(amount) || amount < 0) nextErrors.push(`Category ${index + 1} amount must be 0 or more.`);
    });
    if (new Set(normalizedCategoryNames).size !== normalizedCategoryNames.length) nextErrors.push("Category names must be unique.");
    if (!Number.isNaN(salary) && totalCategoryAmount > salary) nextErrors.push("Total category amount cannot be more than gross salary.");
    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    console.log("SUBMIT ENTERED");
    console.log("TOKEN:", token);
    console.log("VALIDATION RESULT:", validate());
    console.log("GROSS SALARY:", grossSalary);
    console.log("CATEGORIES:", categories);
    console.log("TOTAL CATEGORY AMOUNT:", totalCategoryAmount);
    event.preventDefault();
    setApiError("");
    if (!validate()) return;
    if (!token) { setApiError("You are not authenticated. Please log in again."); return; }

    try {
      setLoading(true);
      const payload = { grossSalary: Number(grossSalary), categories: categories.map((c) => ({ name: c.name.trim(), budget: Number(c.amount) })) };

      if (isEditing) {
        const response = await axios.put<PayslipResponse>(`${API_URL}/api/v1/payslip`, payload, { headers: { Authorization: `Bearer ${token}` } });
        setResult(response.data);
        setApiError("");
        if (jobTitle || location) {
          await axios.patch(`${API_URL}/api/v1/user/profile`, { payslipData: { grossSalary: Number(grossSalary), jobTitle, location } }, { headers: { Authorization: `Bearer ${token}` } });
        }
        navigate("/dashboard");
      } else {
        const fetchExistingPayslip = async () => axios.get<PayslipResponse>(`${API_URL}/api/v1/payslip`, { headers: { Authorization: `Bearer ${token}` } });
        try {
          const existing = await fetchExistingPayslip();
          if (existing.data) {
            setResult(existing.data);
            setIsEditing(true);
            setGrossSalary(existing.data.grossSalary.toString());
            if (existing.data.categories) setCategories(existing.data.categories.map((cat) => ({ name: cat.name, amount: cat.budget.toString() })));
            setApiError("");
            return;
          }
        } catch (existingError: unknown) {
          if (!axios.isAxiosError(existingError) || existingError.response?.status !== 404) throw existingError;
        }

        const submitPayslip = () => axios.post<PayslipResponse>(`${API_URL}/api/v1/payslip`, payload, { headers: { Authorization: `Bearer ${token}` } });
        try {
          const response = await submitPayslip();
          setResult(response.data);
          setIsEditing(true);
          if (jobTitle || location) {
            await axios.patch(`${API_URL}/api/v1/user/profile`, { payslipData: { grossSalary: Number(grossSalary), jobTitle, location } }, { headers: { Authorization: `Bearer ${token}` } });
          }
          navigate("/dashboard");
        } catch (firstError: unknown) {
          if (!axios.isAxiosError(firstError)) throw firstError;
          if (firstError.response?.status === 500) {
            try {
              if (jobTitle || location) {
                await axios.patch(`${API_URL}/api/v1/user/profile`, { payslipData: { grossSalary: Number(grossSalary), jobTitle, location } }, { headers: { Authorization: `Bearer ${token}` } });
              }
              const existingAfterFailure = await fetchExistingPayslip();
              if (existingAfterFailure.data) {
                setResult(existingAfterFailure.data);
                setIsEditing(true);
                setApiError("Payslip appears saved. Refresh or continue to dashboard.");
                return;
              }
            } catch { /* ignore */ }
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
        setApiError(error.response?.data?.error || error.response?.data?.message || "Unable to save payslip setup.");
      } else {
        setApiError("Unable to save payslip setup.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (isFetchingPayslip) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-purple-300 border-t-purple-600 animate-spin" />
          <p className="text-purple-500 text-sm font-medium">Loading payslip...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50" style={{ fontFamily: "Manrope, Segoe UI, Arial, sans-serif" }}>
      <TopNav />
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-purple-900">{isEditing ? "Update Payslip" : "Payslip Setup"}</h1>
          <p className="text-sm text-purple-500 mt-1">
            {isEditing ? "Update your gross salary and category allocations." : "Add your gross salary and category allocations to build your monthly breakdown."}
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Gross salary */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-white rounded-xl border border-purple-200 shadow-sm p-5">
            <FieldInput label="Gross Salary (annual)" id="grossSalary" type="number" value={grossSalary} onChange={(e) => setGrossSalary(e.target.value)}
              placeholder="e.g. 36000" icon={PoundSterling} step="0.01" min="0" data-onboarding="payslip-gross" />
          </motion.div>

          {/* Job title + location */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-purple-200 shadow-sm p-5 space-y-5">
            {/* Tip banner */}
            <div data-onboarding="payslip-profile-tip" className="flex gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <Lightbulb className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-purple-800 mb-0.5">Add Job Title & Location for Tips</p>
                <p className="text-xs text-purple-600">Unlocks personalized financial insights, salary comparisons, and tailored tips on your dashboard.</p>
              </div>
            </div>

            {/* Job title with autocomplete */}
            <div className="relative">
              <label htmlFor="jobTitle" className="block text-sm font-semibold text-purple-800 mb-1.5">Job Title <span className="text-purple-400 font-normal">(optional)</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="w-4 h-4 text-purple-400" />
                </div>
                <input id="jobTitle" type="text" placeholder="Search or type job title..." value={jobSearchQuery}
                  onChange={(e) => { setJobSearchQuery(e.target.value); setShowJobDropdown(true); }} onFocus={() => setShowJobDropdown(true)}
                  className="w-full pl-10 pr-3 py-2.5 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-900 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" />
              </div>
              <AnimatePresence>
                {showJobDropdown && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-purple-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                    {jobSearchLoading ? (
                      <p className="px-3 py-2.5 text-xs text-purple-400">Loading jobs...</p>
                    ) : jobOptions.length > 0 ? jobOptions.map((job, index) => (
                      <button key={index} type="button" onClick={() => { setJobTitle(job.title); setJobSearchQuery(job.label); setShowJobDropdown(false); }}
                        className="w-full text-left px-3 py-2.5 hover:bg-purple-50 transition-colors border-b border-purple-50 last:border-0">
                        <div className="text-sm font-medium text-purple-900">{job.label}</div>
                        {job.count && <div className="text-xs text-purple-400">{job.count} jobs available</div>}
                      </button>
                    )) : <p className="px-3 py-2.5 text-xs text-purple-400">No jobs found</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Location with autocomplete */}
            <div className="relative">
              <label htmlFor="location" className="block text-sm font-semibold text-purple-800 mb-1.5">Location <span className="text-purple-400 font-normal">(optional)</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="w-4 h-4 text-purple-400" />
                </div>
                <input id="location" type="text" placeholder="Search or type location..." value={locationSearchQuery}
                  onChange={(e) => { setLocationSearchQuery(e.target.value); setShowLocationDropdown(true); }} onFocus={() => setShowLocationDropdown(true)}
                  className="w-full pl-10 pr-3 py-2.5 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-900 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" />
              </div>
              <AnimatePresence>
                {showLocationDropdown && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-purple-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                    {locationSearchLoading ? (
                      <p className="px-3 py-2.5 text-xs text-purple-400">Loading locations...</p>
                    ) : locationOptions.length > 0 ? locationOptions.map((loc, index) => (
                      <button key={index} type="button" onClick={() => { setLocation(loc.title); setLocationSearchQuery(loc.label); setShowLocationDropdown(false); }}
                        className="w-full text-left px-3 py-2.5 hover:bg-purple-50 transition-colors border-b border-purple-50 last:border-0">
                        <div className="text-sm font-medium text-purple-900">{loc.label}</div>
                      </button>
                    )) : <p className="px-3 py-2.5 text-xs text-purple-400">No locations found</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Category builder */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-xl border border-purple-200 shadow-sm p-5" data-onboarding="payslip-categories">
            <CategoryBuilder
              categories={categories}
              onAddCategory={addCategory}
              onRemoveCategory={removeCategory}
              onUpdateCategory={updateCategory}
              totalCategoryAmount={totalCategoryAmount}
              isOverAllocated={isOverAllocated}
              disabled={loading}
            />
          </motion.div>

          {/* Validation errors */}
          <AnimatePresence>
            {errors.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <ul className="text-sm text-red-700 space-y-0.5 list-none m-0 p-0">
                  {errors.map((error, index) => <li key={`error-${index}`}>{error}</li>)}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {apiError && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                <AlertCircle className="w-4 h-4 shrink-0" />{apiError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <div className="flex gap-3">
            <Button type="submit" variant="primary" loading={loading} className="flex-1 sm:flex-none">
              {loading ? (isEditing ? "Updating..." : "Saving...") : (isEditing ? "Update Payslip Details" : "Save Payslip Details")}
            </Button>
            {isEditing && (
              <Button type="button" variant="ghost" onClick={() => navigate("/dashboard")}>Cancel</Button>
            )}
          </div>
        </form>

        <PayslipBreakdown result={result} onContinue={() => navigate("/dashboard")} />
      </main>

      <TooltipGuide isOpen={isOnboardingOpen} activeStepNumber={activeStepNumber} steps={onboardingSteps} onClose={closeGuide} onComplete={completeGuide} onGoToStep={goToStep} />
    </div>
  );
};

export default PayslipSetup;
