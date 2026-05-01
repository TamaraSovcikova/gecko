import { useEffect, useState, type ChangeEvent } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { ForecastPayload } from "../../types/forecast";

type DashboardData = {
  healthScore: number;
  takeHome: number;
  budgetLeft: number;
  totalBudget: number;
  actualSpending: { name: string; value: number }[];
  budgetAllocation: { name: string; value: number }[];
  averageSalary?: number;
  adzunaTips?: {
    type: string;
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
  }[];
  healthBreakdown?: any;
  expenses?: {
    _id: string;
    category: string;
    amount: number;
    day: number;
    month: number;
    year: number;
    date: string;
    note?: string;
    createdAt: string;
  }[];
};

type Props = {
  categories?: { name: string; value: number }[];
  onExpenseCreated?: (
    dashboard: DashboardData | undefined,
    forecast: ForecastPayload | undefined,
  ) => void;
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
    categories?.map((item) => item.name) || [],
  );

  useEffect(() => {
    if (!categories) return;

    const next = categories.map((c) => c.name);

    setAvailableCategories((prev) => Array.from(new Set([...prev, ...next])));

    if (!category && next.length > 0) {
      setCategory(next[0]);
    }
  }, [categories, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    try {
      const payload: any = {
        amount: Number(amount),
        date,
        note,
      };

      if (category === "create-new") {
        if (!newCategoryName.trim()) {
          setFormError("Category name is required");
          return;
        }

        payload.newCategoryName = newCategoryName.trim();
        payload.newCategoryBudget = newCategoryBudget
          ? Number(newCategoryBudget)
          : 0;
        payload.category = newCategoryName.trim();
      } else {
        payload.category = category;
      }

      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/expenses`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const createdCategory =
        category === "create-new" ? newCategoryName.trim() : category;

      if (category === "create-new") {
        setAvailableCategories((prev) =>
          prev.includes(createdCategory) ? prev : [...prev, createdCategory],
        );
      }

      if (onExpenseCreated) {
        onExpenseCreated(res.data?.dashboard, res.data?.forecast);
      }

      setCategory(createdCategory);
      setAmount("");
      setDate("");
      setNote("");
      setNewCategoryName("");
      setNewCategoryBudget("");

      setFormSuccess("Expense saved.");
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
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const scannedAmount = response.data?.amount;
      if (response.data?.success && scannedAmount) {
        setAmount(String(scannedAmount));
        if (!date) {
          setDate(new Date().toISOString().slice(0, 10));
        }
        setScanSuccess("Receipt scanned. Amount added to the form.");
      } else {
        setScanError(response.data?.message || "Could not detect total.");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setScanError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to scan receipt.",
        );
      } else {
        setScanError("Failed to scan receipt.");
      }
    } finally {
      setIsScanning(false);
      e.target.value = "";
    }
  };

  return (
    <div
      className="p-3"
      style={{
        border: "1px solid #c9bde8",
        borderRadius: "14px",
        background: "linear-gradient(145deg, #faf9fd 0%, #f4f1fb 62%, #ede8f8 100%)",
        boxShadow: "0 4px 20px rgba(92, 63, 163, 0.08)",
      }}
    >
      <h5 className="mb-3" style={{ color: "#5c3fa3", fontWeight: 700 }}>
        Log Expense
      </h5>

      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <input
            className="form-control"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (£)"
            required
          />
        </div>

        <div className="mb-2">
          <select
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select category</option>

            {availableCategories.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}

            <option value="create-new">+ Create New</option>
          </select>
        </div>

        {category === "create-new" && (
          <>
            <div className="mb-2">
              <input
                className="form-control"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category name"
                required
              />
            </div>

            <div className="mb-2">
              <input
                type="number"
                className="form-control"
                value={newCategoryBudget}
                onChange={(e) => setNewCategoryBudget(e.target.value)}
                placeholder="Budget (optional)"
              />
            </div>
          </>
        )}

        <div className="mb-2">
          <input
            type="date"
            className="form-control"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="mb-2">
          <input
            className="form-control"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note"
          />
        </div>

        <div className="mb-2">
          <label className="form-label mb-1">Scan receipt (optional)</label>
          <input
            type="file"
            accept="image/*"
            className="form-control"
            onChange={handleReceiptFileChange}
            disabled={isScanning}
          />
        </div>

        {scanSuccess && <div className="alert alert-info py-1">{scanSuccess}</div>}
        {scanError && <div className="alert alert-warning py-1">{scanError}</div>}

        {formSuccess && (
          <div className="alert alert-success py-1">{formSuccess}</div>
        )}
        {formError && (
          <div className="alert alert-danger py-1">{formError}</div>
        )}

        <button
          className="btn w-100 mt-2"
          style={{
            backgroundColor: "#5c3fa3",
            border: "1px solid #4e358f",
            color: "#ffffff",
            fontWeight: 600,
          }}
        >
          Save expense
        </button>
      </form>
    </div>
  );
};

export default Expenses;