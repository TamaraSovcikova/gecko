import { useEffect, useState, type ChangeEvent } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, Plus, ScanLine, CheckCircle2, AlertCircle, Tag, Calendar, FileText, PoundSterling } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ForecastPayload } from "../../types/forecast";
import TopNav from "../../components/TopNav";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Alert } from "../../components/ui/alert";
import { cn } from "../../lib/utils";

type DashboardData = {
  healthScore: number; takeHome: number; budgetLeft: number; totalBudget: number;
  actualSpending: { name: string; value: number }[];
  budgetAllocation: { name: string; value: number }[];
  averageSalary?: number;
  adzunaTips?: { type: string; title: string; description: string; priority: "high" | "medium" | "low" }[];
  healthBreakdown?: any;
  expenses?: { _id: string; category: string; amount: number; day: number; month: number; year: number; date: string; note?: string; createdAt: string }[];
};

type Props = {
  categories?: { name: string; value: number }[];
  onExpenseCreated?: (dashboard: DashboardData | undefined, forecast: ForecastPayload | undefined) => void;
};

const Expenses = ({ categories, onExpenseCreated }: Props) => {
  const { token } = useAuth();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryBudget, setNewCategoryBudget] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanSuccess, setScanSuccess] = useState("");
  const [availableCategories, setAvailableCategories] = useState<string[]>(
    categories?.map(item => item.name) || [],
  );

  const isStandalonePage = !categories;

  useEffect(() => {
    if (!categories) return;
    const next = categories.map(c => c.name);
    setAvailableCategories(prev => Array.from(new Set([...prev, ...next])));
    if (!category && next.length > 0) setCategory(next[0]);
  }, [categories, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    try {
      const payload: any = { amount: Number(amount), date, note };
      if (category === "create-new") {
        if (!newCategoryName.trim()) { setFormError("Category name is required"); return; }
        payload.newCategoryName = newCategoryName.trim();
        payload.newCategoryBudget = newCategoryBudget ? Number(newCategoryBudget) : 0;
        payload.category = newCategoryName.trim();
      } else {
        payload.category = category;
      }
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/expenses`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const created = category === "create-new" ? newCategoryName.trim() : category;
      if (category === "create-new") {
        setAvailableCategories(prev => prev.includes(created) ? prev : [...prev, created]);
      }
      if (onExpenseCreated) onExpenseCreated(res.data?.dashboard, res.data?.forecast);
      setCategory(created);
      setAmount("");
      setDate("");
      setNote("");
      setNewCategoryName("");
      setNewCategoryBudget("");
      setFormSuccess("Expense saved successfully.");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setFormError(err.response?.data?.error || "Failed to add expense");
      } else {
        setFormError("Failed to add expense");
      }
    }
  };

  const handleReceiptFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    const formData = new FormData();
    formData.append("image", file);
    setIsScanning(true);
    setScanError("");
    setScanSuccess("");
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/expenses/scan`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const scannedAmount = response.data?.amount;
      if (response.data?.success && scannedAmount) {
        setAmount(String(scannedAmount));
        if (!date) setDate(new Date().toISOString().slice(0, 10));
        setScanSuccess("Receipt scanned. Amount prefilled below.");
      } else {
        setScanError(response.data?.message || "Could not detect total.");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setScanError(err.response?.data?.message || err.response?.data?.error || "Failed to scan receipt.");
      } else {
        setScanError("Failed to scan receipt.");
      }
    } finally {
      setIsScanning(false);
      e.target.value = "";
    }
  };

  const formPanel = (
    <div className="bg-white border border-purple-200 rounded-lg p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 bg-purple-100 rounded-md">
          <Receipt className="h-4 w-4 text-purple-600" />
        </div>
        <h5 className="text-base font-semibold text-purple-700">Log Expense</h5>
      </div>

      <AnimatePresence>
        {(scanSuccess || scanError) && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4">
            {scanSuccess && <Alert variant="success">{scanSuccess}</Alert>}
            {scanError && <Alert variant="danger">{scanError}</Alert>}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount */}
        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-gecko-text flex items-center gap-1.5">
            <PoundSterling className="h-3.5 w-3.5 text-purple-500" />
            Amount
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            className={cn(
              "w-full px-3 py-2.5 rounded-md border border-purple-300 bg-white text-sm text-gecko-text",
              "focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all",
            )}
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        {/* Category */}
        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-gecko-text flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-purple-500" />
            Category
          </label>
          <select
            className={cn(
              "w-full px-3 py-2.5 rounded-md border border-purple-300 bg-white text-sm text-gecko-text",
              "focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all",
            )}
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="">Select category</option>
            {availableCategories.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
            <option value="create-new">+ Create new category</option>
          </select>
        </div>

        {/* New category fields */}
        <AnimatePresence>
          {category === "create-new" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden space-y-3 pl-3 border-l-2 border-purple-200"
            >
              <input
                className={cn("w-full px-3 py-2.5 rounded-md border border-purple-300 bg-white text-sm", "focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all")}
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="Category name (e.g. Gym)"
                required
              />
              <input
                type="number"
                className={cn("w-full px-3 py-2.5 rounded-md border border-purple-300 bg-white text-sm", "focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all")}
                value={newCategoryBudget}
                onChange={e => setNewCategoryBudget(e.target.value)}
                placeholder="Monthly budget (optional)"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Date */}
        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-gecko-text flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-purple-500" />
            Date
          </label>
          <input
            type="date"
            className={cn("w-full px-3 py-2.5 rounded-md border border-purple-300 bg-white text-sm text-gecko-text", "focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all")}
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
        </div>

        {/* Note */}
        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-gecko-text flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-purple-500" />
            Note <span className="text-gecko-muted font-normal">(optional)</span>
          </label>
          <input
            className={cn("w-full px-3 py-2.5 rounded-md border border-purple-300 bg-white text-sm text-gecko-text", "focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all")}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="What was this for?"
          />
        </div>

        {/* Receipt scan */}
        <div className="rounded-md border border-dashed border-purple-300 bg-purple-50/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ScanLine className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-semibold text-purple-700">Scan receipt</span>
            <span className="text-xs text-gecko-muted">(optional - auto-fills amount)</span>
          </div>
          <input
            type="file"
            accept="image/*"
            className="w-full text-sm text-gecko-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-pill file:border file:border-purple-300 file:text-xs file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 file:transition-colors file:cursor-pointer"
            onChange={handleReceiptFileChange}
            disabled={isScanning}
          />
          {isScanning && (
            <p className="mt-2 text-xs text-purple-500 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border-2 border-purple-500 border-r-transparent animate-spin" />
              Scanning receipt...
            </p>
          )}
        </div>

        <AnimatePresence>
          {(formSuccess || formError) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {formSuccess && (
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                  <CheckCircle2 className="h-4 w-4" /> {formSuccess}
                </div>
              )}
              {formError && (
                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  <AlertCircle className="h-4 w-4" /> {formError}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <Button type="submit" variant="primary" size="lg" className="w-full">
          <Plus className="h-4 w-4" />
          Save expense
        </Button>
      </form>
    </div>
  );

  if (isStandalonePage) {
    return (
      <div className="app-page">
        <TopNav />
        <div className="max-w-xl mx-auto px-4 mt-6">
          <div className="mb-6">
            <p className="app-section-eyebrow">Expenses</p>
            <h1 className="app-page-title mt-2">Track Spending</h1>
          </div>
          {formPanel}
        </div>
      </div>
    );
  }

  return formPanel;
};

export default Expenses;
