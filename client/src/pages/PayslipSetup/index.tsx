import { FormEvent, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { registerUser } from "../../api/authApi";
import CategoryBuilder from "../../components/CategoryBuilder";
import PayslipBreakdown from "../../components/PayslipBreakdown";
import TooltipGuide from "../../components/TooltipGuide";
import { usePageOnboarding } from "../../hooks/usePageOnboarding";
import { motion, AnimatePresence } from "framer-motion";
import { PoundSterling, Briefcase, MapPin, Info, AlertCircle, Sparkles } from "lucide-react";
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

const DEFAULT_CATEGORIES: Category[] = [
  { name: "Housing", amount: "" },
  { name: "Food & Groceries", amount: "" },
  { name: "Transport", amount: "" },
  { name: "Savings", amount: "" },
  { name: "Other", amount: "" },
];

function estimateUKTakeHome(grossAnnual: number) {
  if (!grossAnnual || grossAnnual <= 0) return null;
  const pa = 12570;
  const basicTop = 50270;
  const higherTop = 125140;
  const taxable = Math.max(0, grossAnnual - pa);
  const basic = Math.min(taxable, basicTop - pa) * 0.2;
  const higher = Math.min(Math.max(0, taxable - (basicTop - pa)), higherTop - basicTop) * 0.4;
  const additional = Math.max(0, taxable - (higherTop - pa)) * 0.45;
  const tax = basic + higher + additional;
  const niPrimary = Math.max(0, Math.min(grossAnnual, basicTop) - pa) * 0.08;
  const niSecondary = Math.max(0, grossAnnual - basicTop) * 0.02;
  const ni = niPrimary + niSecondary;
  const takeHome = grossAnnual - tax - ni;
  return { monthly: takeHome / 12, tax, ni, takeHome, effectiveRate: ((tax + ni) / grossAnnual) * 100 };
}

const BUDGET_PRESETS = [
  {
    label: "50/30/20",
    description: "Needs 50%, Wants 30%, Savings 20%",
    build: (m: number) => {
      const base = Math.floor(m);
      const needs = Math.floor(base * 0.5);
      const wants = Math.floor(base * 0.3);
      return [
        { name: "Needs", amount: needs.toString() },
        { name: "Wants", amount: wants.toString() },
        { name: "Savings", amount: (base - needs - wants).toString() },
      ];
    },
  },
  {
    label: "60/20/20",
    description: "Needs 60%, Savings 20%, Wants 20%",
    build: (m: number) => {
      const base = Math.floor(m);
      const needs = Math.floor(base * 0.6);
      const savings = Math.floor(base * 0.2);
      return [
        { name: "Needs", amount: needs.toString() },
        { name: "Savings", amount: savings.toString() },
        { name: "Wants", amount: (base - needs - savings).toString() },
      ];
    },
  },
  {
    label: "Detailed",
    description: "Housing 35%, Food 15%, Transport 10%, Savings 20%, Other 20%",
    build: (m: number) => {
      const base = Math.floor(m);
      const housing = Math.floor(base * 0.35);
      const food = Math.floor(base * 0.15);
      const transport = Math.floor(base * 0.1);
      const savings = Math.floor(base * 0.2);
      return [
        { name: "Housing", amount: housing.toString() },
        { name: "Food & Groceries", amount: food.toString() },
        { name: "Transport", amount: transport.toString() },
        { name: "Savings", amount: savings.toString() },
        { name: "Other", amount: (base - housing - food - transport - savings).toString() },
      ];
    },
  },
];

const FieldInput = ({
  label,
  id,
  type,
  value,
  onChange,
  placeholder,
  icon: Icon,
  required,
  step,
  min,
  "data-onboarding": dataOnboarding,
}: {
  label: string;
  id: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  icon: React.ElementType;
  required?: boolean;
  step?: string;
  min?: string;
  "data-onboarding"?: string;
}) => (
  <div data-onboarding={dataOnboarding}>
    <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1.5">
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        step={step}
        min={min}
        className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
      />
    </div>
  </div>
);

const PayslipSetup = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [grossSalary, setGrossSalary] = useState("");
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
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
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    isOpen: isOnboardingOpen,
    activeStepNumber,
    steps: onboardingSteps,
    closeGuide,
    completeGuide,
    goToStep,
  } = usePageOnboarding("/payslip");

  useEffect(() => {
    const loadExistingPayslip = async () => {
      if (!token) return;
      try {
        const response = await axios.get<PayslipResponse>(`${API_URL}/api/v1/payslip`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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
        const res = await axios.get(`${API_URL}/api/v1/user/job-search`, {
          params: { query: jobSearchQuery },
          headers: { Authorization: `Bearer ${token}` },
        });
        setJobOptions(res.data.jobs || []);
      } catch {
        /* silent */
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
        const res = await axios.get(`${API_URL}/api/v1/user/location-search`, {
          params: { query: locationSearchQuery },
          headers: { Authorization: `Bearer ${token}` },
        });
        setLocationOptions(res.data.locations || []);
      } catch {
        /* silent */
      } finally {
        setLocationSearchLoading(false);
      }
    };
    const timer = setTimeout(searchLocations, 300);
    return () => clearTimeout(timer);
  }, [locationSearchQuery, showLocationDropdown, token]);

  const totalCategoryAmount = useMemo(
    () =>
      categories.reduce((sum, cat) => {
        const v = Number(cat.amount);
        return Number.isFinite(v) ? sum + v : sum;
      }, 0),
    [categories]
  );

  const liveEstimate = useMemo(() => estimateUKTakeHome(Number(grossSalary)), [grossSalary]);

  const isOverAllocated = liveEstimate != null && totalCategoryAmount > liveEstimate.monthly;

  const applyPreset = (preset: (typeof BUDGET_PRESETS)[0]) => {
    if (!liveEstimate) return;
    setCategories(preset.build(liveEstimate.monthly));
  };

  const addCategory = () => setCategories((prev) => [...prev, { name: "", amount: "" }]);
  const removeCategory = (index: number) => setCategories((prev) => prev.filter((_, i) => i !== index));
  const updateCategory = (index: number, field: "name" | "amount", value: string) => {
    setCategories((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const validate = () => {
    const nextErrors: string[] = [];
    const salary = Number(grossSalary);
    const normalizedNames = categories.map((c) => c.name.trim().toLowerCase()).filter(Boolean);
    if (!grossSalary || Number.isNaN(salary) || salary <= 0) nextErrors.push("Gross salary must be greater than 0.");
    categories.forEach((category, index) => {
      if (!category.name.trim()) nextErrors.push(`Category ${index + 1} needs a name.`);
      const amount = Number(category.amount);
      if (!category.amount || Number.isNaN(amount) || amount < 0)
        nextErrors.push(`Category ${index + 1} amount must be 0 or more.`);
    });
    if (new Set(normalizedNames).size !== normalizedNames.length) nextErrors.push("Category names must be unique.");
    const estimate = estimateUKTakeHome(salary);
    if (estimate && totalCategoryAmount > estimate.monthly)
      nextErrors.push(
        `Total category amounts (£${totalCategoryAmount.toFixed(0)}) exceed estimated monthly take-home (£${Math.round(estimate.monthly)}).`
      );
    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const saveProfile = async () => {
    if (jobTitle || location) {
      await axios.patch(
        `${API_URL}/api/v1/user/profile`,
        { payslipData: { grossSalary: Number(grossSalary), jobTitle, location } },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setApiError("");
    setSaveSuccess(false);
    if (!validate()) return;
    if (!token) {
      setApiError("You are not authenticated. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        grossSalary: Number(grossSalary),
        categories: categories.map((c) => ({ name: c.name.trim(), budget: Number(c.amount) })),
      };

      if (isEditing) {
        const response = await axios.put<PayslipResponse>(`${API_URL}/api/v1/payslip`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setResult(response.data);
        await saveProfile();
        setSaveSuccess(true);
      } else {
        const fetchExisting = () =>
          axios.get<PayslipResponse>(`${API_URL}/api/v1/payslip`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        try {
          const existing = await fetchExisting();
          if (existing.data) {
            setResult(existing.data);
            setIsEditing(true);
            setGrossSalary(existing.data.grossSalary.toString());
            if (existing.data.categories) {
              setCategories(existing.data.categories.map((cat) => ({ name: cat.name, amount: cat.budget.toString() })));
            }
            return;
          }
        } catch (existingError: unknown) {
          if (!axios.isAxiosError(existingError) || existingError.response?.status !== 404) throw existingError;
        }

        const submitPayslip = () =>
          axios.post<PayslipResponse>(`${API_URL}/api/v1/payslip`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
        try {
          const response = await submitPayslip();
          setResult(response.data);
          setIsEditing(true);
          await saveProfile();
          setSaveSuccess(true);
        } catch (firstError: unknown) {
          if (!axios.isAxiosError(firstError)) throw firstError;
          if (firstError.response?.status === 500) {
            try {
              await saveProfile();
              const existingAfterFailure = await fetchExisting();
              if (existingAfterFailure.data) {
                setResult(existingAfterFailure.data);
                setIsEditing(true);
                setApiError("Payslip saved. Review your breakdown below.");
                return;
              }
            } catch {
              /* ignore */
            }
            await registerUser(token);
            const retryResponse = await submitPayslip();
            setResult(retryResponse.data);
            setIsEditing(true);
            setSaveSuccess(true);
            return;
          }
          throw firstError;
        }
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setApiError(error.response?.data?.error || error.response?.data?.message || "Unable to save payslip.");
      } else {
        setApiError("Unable to save payslip.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (isFetchingPayslip) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-purple-600 animate-spin" />
          <p className="text-gray-500 text-sm">Loading payslip...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page">
      <main className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
            {isEditing ? "Edit" : "Setup"}
          </p>
          <h1 className="text-2xl font-bold text-gray-900">{isEditing ? "Update Payslip" : "Payslip Setup"}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEditing
              ? "Update your gross salary and budget categories."
              : "Enter your gross salary and allocate it across budget categories."}
          </p>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
          {/* Left: form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Gross salary */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
            >
              <FieldInput
                label="Annual gross salary"
                id="grossSalary"
                type="number"
                value={grossSalary}
                onChange={(e) => setGrossSalary(e.target.value)}
                placeholder="e.g. 36000"
                icon={PoundSterling}
                step="0.01"
                min="0"
                data-onboarding="payslip-gross"
              />
              <AnimatePresence>
                {liveEstimate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100 overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">Estimated monthly take-home</span>
                      <span className="text-sm font-bold text-gray-900">
                        ~£{Math.round(liveEstimate.monthly).toLocaleString("en-GB")}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] text-gray-400">
                      <div className="flex justify-between">
                        <span>Income tax</span>
                        <span>-£{Math.round(liveEstimate.tax / 12).toLocaleString("en-GB")}/mo</span>
                      </div>
                      <div className="flex justify-between">
                        <span>National Insurance</span>
                        <span>-£{Math.round(liveEstimate.ni / 12).toLocaleString("en-GB")}/mo</span>
                      </div>
                    </div>
                    <p className="mt-1.5 text-[10px] text-gray-300">
                      Effective rate {liveEstimate.effectiveRate.toFixed(1)}% · 2024/25 UK estimate only
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Job title + location */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4"
            >
              <div
                data-onboarding="payslip-profile-tip"
                className="flex gap-2.5 p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-600 leading-relaxed">
                  <span className="font-semibold text-gray-700">Optional:</span> Add your job title and location to
                  unlock salary benchmarks and personalised tips on your dashboard.
                </p>
              </div>

              {/* Job title */}
              <div className="relative">
                <label htmlFor="jobTitle" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Job title <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    id="jobTitle"
                    type="text"
                    placeholder="Search job title..."
                    value={jobSearchQuery}
                    onChange={(e) => {
                      setJobSearchQuery(e.target.value);
                      setShowJobDropdown(true);
                    }}
                    onFocus={() => setShowJobDropdown(true)}
                    onBlur={() => setTimeout(() => setShowJobDropdown(false), 150)}
                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
                  />
                </div>
                <AnimatePresence>
                  {showJobDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10"
                    >
                      {jobSearchLoading ? (
                        <p className="px-3 py-2.5 text-xs text-gray-400">Searching...</p>
                      ) : jobOptions.length > 0 ? (
                        jobOptions.map((job, index) => (
                          <button
                            key={index}
                            type="button"
                            onMouseDown={() => {
                              setJobTitle(job.title);
                              setJobSearchQuery(job.label);
                              setShowJobDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                          >
                            <div className="text-sm font-medium text-gray-900">{job.label}</div>
                            {job.count && <div className="text-xs text-gray-400">{job.count} jobs</div>}
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-2.5 text-xs text-gray-400">No results</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Location */}
              <div className="relative">
                <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Location <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    id="location"
                    type="text"
                    placeholder="Search location..."
                    value={locationSearchQuery}
                    onChange={(e) => {
                      setLocationSearchQuery(e.target.value);
                      setShowLocationDropdown(true);
                    }}
                    onFocus={() => setShowLocationDropdown(true)}
                    onBlur={() => setTimeout(() => setShowLocationDropdown(false), 150)}
                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
                  />
                </div>
                <AnimatePresence>
                  {showLocationDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10"
                    >
                      {locationSearchLoading ? (
                        <p className="px-3 py-2.5 text-xs text-gray-400">Searching...</p>
                      ) : locationOptions.length > 0 ? (
                        locationOptions.map((loc, index) => (
                          <button
                            key={index}
                            type="button"
                            onMouseDown={() => {
                              setLocation(loc.title);
                              setLocationSearchQuery(loc.label);
                              setShowLocationDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                          >
                            <div className="text-sm font-medium text-gray-900">{loc.label}</div>
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-2.5 text-xs text-gray-400">No results</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Category builder */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
              data-onboarding="payslip-categories"
            >
              {/* Budget presets */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Quick presets</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {BUDGET_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      disabled={!liveEstimate || loading}
                      onClick={() => applyPreset(preset)}
                      title={preset.description}
                      className="px-2.5 py-1 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-purple-400 hover:text-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                {!liveEstimate && (
                  <p className="mt-1.5 text-[11px] text-gray-400">Enter your salary above to enable presets</p>
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
                monthlyTakeHome={liveEstimate?.monthly}
              />
            </motion.div>

            {/* Errors */}
            <AnimatePresence>
              {errors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <ul className="text-sm text-red-700 space-y-0.5 list-none m-0 p-0">
                    {errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {apiError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {apiError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex gap-3">
              <Button type="submit" variant="primary" loading={loading} className="flex-1 sm:flex-none">
                {loading ? (isEditing ? "Updating..." : "Saving...") : isEditing ? "Update payslip" : "Save payslip"}
              </Button>
              {isEditing && (
                <Button type="button" variant="ghost" onClick={() => navigate("/dashboard")}>
                  Cancel
                </Button>
              )}
            </div>
          </form>

          {/* Right: breakdown panel */}
          <div className="lg:sticky lg:top-6">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="breakdown"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-gray-900">Your breakdown</p>
                    {saveSuccess && (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Saved
                      </span>
                    )}
                  </div>
                  <PayslipBreakdown result={result} onContinue={() => navigate("/dashboard")} />
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl border border-dashed border-gray-200 p-8 text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <PoundSterling className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Breakdown preview</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Save your details to see your tax breakdown, take-home pay, and monthly figures here.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <TooltipGuide
        isOpen={isOnboardingOpen}
        activeStepNumber={activeStepNumber}
        steps={onboardingSteps}
        onClose={closeGuide}
        onComplete={completeGuide}
        onGoToStep={goToStep}
      />
    </div>
  );
};

export default PayslipSetup;
