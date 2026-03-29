import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

type Props = {
  categories? : {name: string, value: number}[]
};

type ExpenseRecord = {
  _id: string;
  amount: number;
  category: string;
  date: string;
  note?: string;
};

const Expenses = ({categories}: Props) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const isStandalonePage = !categories;

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>(categories?.map((item) => item.name) || []);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [pageError, setPageError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ amount: "", category: "", date: "", note: "" });

  useEffect(() => {
    if (!categories) {
      return;
    }

    const nextCategories = categories.map((item) => item.name);
    setAvailableCategories(nextCategories);
    if (!category && nextCategories.length > 0) {
      setCategory(nextCategories[0]);
    }
  }, [categories, category]);

  useEffect(() => {
    if (!isStandalonePage || !token) {
      return;
    }

    const fetchBudgetManagerData = async () => {
      setLoadingExpenses(true);
      setPageError("");

      try {
        const [expenseResponse, payslipResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/v1/expenses`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/v1/payslip`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setExpenses(expenseResponse.data?.expenses || []);
        const nextCategories = (payslipResponse.data?.categories || []).map((item: { name: string }) => item.name);
        setAvailableCategories(nextCategories);
        setCategory(nextCategories[0] || "");
      } catch (error) {
        console.error(error);
        setPageError("Unable to load budget manager data.");
      } finally {
        setLoadingExpenses(false);
      }
    };

    fetchBudgetManagerData();
  }, [isStandalonePage, token]);

  const filteredExpenses = useMemo(() => {
    if (selectedCategory === "all") {
      return expenses;
    }

    return expenses.filter((expense) => expense.category === selectedCategory);
  }, [expenses, selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/expenses`,
        {
          amount: Number(amount),
          category,
          date,
          note,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAmount("");
      setDate("");
      setNote("");
      if (availableCategories.length > 0) {
        setCategory(availableCategories[0]);
      }
      setFormSuccess("Expense saved.");

      if (isStandalonePage && response.data?.expense) {
        setExpenses((prev) => [response.data.expense, ...prev]);
      }
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        setFormError(err.response?.data?.error || "Failed to add expense");
      } else {
        setFormError("Failed to add expense");
      }
    }
  };

  const beginEdit = (expense: ExpenseRecord) => {
    setEditingId(expense._id);
    setEditDraft({
      amount: String(expense.amount),
      category: expense.category,
      date: expense.date.slice(0, 10),
      note: expense.note || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({ amount: "", category: "", date: "", note: "" });
  };

  const saveEdit = async (expenseId: string) => {
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/v1/expenses/${expenseId}`,
        {
          amount: Number(editDraft.amount),
          category: editDraft.category,
          date: editDraft.date,
          note: editDraft.note,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setExpenses((prev) => prev.map((expense) => (
        expense._id === expenseId ? response.data.expense : expense
      )));
      cancelEdit();
    } catch (error) {
      console.error(error);
      if (axios.isAxiosError(error)) {
        setPageError(error.response?.data?.error || "Failed to update expense.");
      } else {
        setPageError("Failed to update expense.");
      }
    }
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/expenses/${expenseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setExpenses((prev) => prev.filter((expense) => expense._id !== expenseId));
    } catch (error) {
      console.error(error);
      if (axios.isAxiosError(error)) {
        setPageError(error.response?.data?.error || "Failed to delete expense.");
      } else {
        setPageError("Failed to delete expense.");
      }
    }
  };

  const formCategories = availableCategories;

  return (
    <div style={{ padding: isStandalonePage ? "0" : "20px" }}>
      {isStandalonePage ? (
        <div style={{ maxWidth: "1120px", margin: "30px auto", fontFamily: "Arial, sans-serif" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <p style={{ margin: 0, color: "#7e887e", textTransform: "uppercase", letterSpacing: "0.08em" }}>Dashboard tools</p>
              <h1 style={{ margin: "8px 0 0", color: "#355f46", fontSize: "40px", fontWeight: 300 }}>Edit Budget</h1>
            </div>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              style={{ padding: "10px 16px", borderRadius: "999px", border: "1px solid #d6d0c8", backgroundColor: "#fff", color: "#355f46", fontWeight: 600 }}
            >
              Cancel
            </button>
          </div>

          {pageError && <p style={{ color: "#b54848" }}>{pageError}</p>}

          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "24px" }}>
            <div style={{ backgroundColor: "#fff", border: "1px solid #e5dfd6", borderRadius: "14px", padding: "20px" }}>
              <h2 style={{ marginTop: 0, color: "#355f46", fontSize: "22px" }}>Log expense</h2>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "12px" }}>
                  <label>Amount</label>
                  <input value={amount} onChange={(e) => setAmount(e.target.value)} required style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d6d0c8" }} />
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <label>Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d6d0c8" }}>
                    <option value="">Select category</option>
                    {formCategories.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <label>Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d6d0c8" }} />
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <label>Note</label>
                  <input value={note} onChange={(e) => setNote(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d6d0c8" }} />
                </div>
                {formSuccess && <p style={{ color: "#3c7b52" }}>{formSuccess}</p>}
                {formError && <p style={{ color: "#b54848" }}>{formError}</p>}
                <button type="submit" style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #8db095", backgroundColor: "#dcebdc", color: "#2d5237", fontWeight: 600 }}>
                  Save expense
                </button>
              </form>
            </div>

            <div style={{ backgroundColor: "#fff", border: "1px solid #e5dfd6", borderRadius: "14px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "20px" }}>
                <h2 style={{ margin: 0, color: "#355f46", fontSize: "22px" }}>Expenses</h2>
                <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #d6d0c8" }}>
                  <option value="all">All categories</option>
                  {formCategories.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {loadingExpenses ? (
                <p>Loading expenses...</p>
              ) : filteredExpenses.length === 0 ? (
                <p style={{ color: "#7d7a72" }}>No expenses found for this filter.</p>
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {filteredExpenses.map((expense) => {
                    const isEditing = editingId === expense._id;

                    return (
                      <div key={expense._id} style={{ border: "1px solid #ece6dc", borderRadius: "12px", padding: "14px" }}>
                        {isEditing ? (
                          <>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                              <input value={editDraft.amount} onChange={(event) => setEditDraft((prev) => ({ ...prev, amount: event.target.value }))} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #d6d0c8" }} />
                              <select value={editDraft.category} onChange={(event) => setEditDraft((prev) => ({ ...prev, category: event.target.value }))} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #d6d0c8" }}>
                                {formCategories.map((name) => (
                                  <option key={name} value={name}>{name}</option>
                                ))}
                              </select>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                              <input type="date" value={editDraft.date} onChange={(event) => setEditDraft((prev) => ({ ...prev, date: event.target.value }))} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #d6d0c8" }} />
                              <input value={editDraft.note} onChange={(event) => setEditDraft((prev) => ({ ...prev, note: event.target.value }))} placeholder="Note" style={{ padding: "10px", borderRadius: "8px", border: "1px solid #d6d0c8" }} />
                            </div>
                            <div style={{ display: "flex", gap: "10px" }}>
                              <button type="button" onClick={() => saveEdit(expense._id)} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #8db095", backgroundColor: "#dcebdc", color: "#2d5237", fontWeight: 600 }}>
                                Save
                              </button>
                              <button type="button" onClick={cancelEdit} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #d6d0c8", backgroundColor: "#fff", color: "#5f625c" }}>
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "16px" }}>
                              <div>
                                <strong style={{ color: "#355f46" }}>{expense.category}</strong>
                                <p style={{ margin: "6px 0 0", color: "#4d504f" }}>£{Number(expense.amount).toFixed(2)}</p>
                                <p style={{ margin: "6px 0 0", color: "#7d7a72", fontSize: "13px" }}>{new Date(expense.date).toLocaleDateString()}</p>
                                {expense.note && <p style={{ margin: "6px 0 0", color: "#5f625c", fontSize: "13px" }}>{expense.note}</p>}
                              </div>
                              <div style={{ display: "flex", gap: "10px" }}>
                                <button type="button" onClick={() => beginEdit(expense)} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #d6d0c8", backgroundColor: "#fff", color: "#355f46", fontWeight: 600 }}>
                                  Edit
                                </button>
                                <button type="button" onClick={() => deleteExpense(expense._id)} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #ecc3c3", backgroundColor: "#fff5f5", color: "#9a4545", fontWeight: 600 }}>
                                  Delete
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: "20px" }}>
          <h2>Log Expense</h2>

          <form onSubmit={handleSubmit}>
            <div>
              <label>Amount:</label>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>

            <div>
              <label>Category:</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Select category</option>

                {formCategories.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Date:</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            <div>
              <label>Note:</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            {formSuccess && <p style={{ color: "#3c7b52" }}>{formSuccess}</p>}
            {formError && <p style={{ color: "#b54848" }}>{formError}</p>}

            <button type="submit">Add Expense</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Expenses;