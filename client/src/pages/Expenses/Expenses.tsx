import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

type Props = {
  categories?: { name: string; value: number }[];
};

const Expenses = ({ categories }: Props) => {
  const { token } = useAuth();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryBudget, setNewCategoryBudget] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [availableCategories, setAvailableCategories] = useState<string[]>(
    categories?.map((item) => item.name) || [],
  );

  // Sync categories from dashboard → form
  useEffect(() => {
    if (!categories) return;

    const next = categories.map((c) => c.name);

    setAvailableCategories((prev) => Array.from(new Set([...prev, ...next])));

    if (!category && next.length > 0) {
      setCategory(next[0]);
    }
  }, [categories]);

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

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/expenses`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const createdCategory =
        category === "create-new" ? newCategoryName.trim() : category;

      if (category === "create-new") {
        setAvailableCategories((prev) =>
          prev.includes(createdCategory) ? prev : [...prev, createdCategory],
        );
      }

      // reset form
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

  return (
    <div className="card shadow-sm p-3">
      <h5 className="mb-3">Log Expense</h5>

      <form onSubmit={handleSubmit}>
        {/* Amount */}
        <div className="mb-2">
          <input
            className="form-control"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (£)"
            required
          />
        </div>

        {/* Category */}
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

        {/* Create new category */}
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

        {/* Date */}
        <div className="mb-2">
          <input
            type="date"
            className="form-control"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {/* Note */}
        <div className="mb-2">
          <input
            className="form-control"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note"
          />
        </div>

        {/* Feedback */}
        {formSuccess && (
          <div className="alert alert-success py-1">{formSuccess}</div>
        )}
        {formError && (
          <div className="alert alert-danger py-1">{formError}</div>
        )}

        {/* Submit */}
        <button className="btn btn-success w-100 mt-2">Save expense</button>
      </form>
    </div>
  );
};

export default Expenses;
