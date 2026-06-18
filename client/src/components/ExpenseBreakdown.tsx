import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

type Expense = {
  _id: string;
  category: string;
  amount: number;
  date: string;
  note?: string;
};

type ExpenseForm = {
  category: string;
  amount: number;
  date: string;
  note: string;
};

type Props = {
  expenses: Expense[];
  budgetAllocation: { name: string; value: number }[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, form: ExpenseForm) => void;
};

const EXPENSES_PER_PAGE = 7;

const ExpenseBreakdown = ({
  expenses,
  budgetAllocation,
  onDelete,
  onUpdate,
}: Props) => {
  const { token } = useAuth();
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [expensePage, setExpensePage] = useState(1);

  const [editForm, setEditForm] = useState<ExpenseForm>({
    category: "",
    amount: 0,
    date: "",
    note: "",
  });

  if (!expenses) return null;

  useEffect(() => {
    setExpensePage(1);
    setEditingExpenseId(null);
    setPendingDeleteId(null);
  }, [expenses]);

  const totalPages = Math.ceil(expenses.length / EXPENSES_PER_PAGE);

  const pagedExpenses = expenses.slice(
    (expensePage - 1) * EXPENSES_PER_PAGE,
    expensePage * EXPENSES_PER_PAGE,
  );

  const handleExport = (format: "csv" | "pdf") => {
    if (!token) return;
    const url = `${import.meta.env.VITE_API_URL}/api/v1/expenses/export?format=${format}`;
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", `gecko-expenses.${format}`);
    // Pass token via Authorization using fetch + blob download
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
      })
      .catch(console.error);
  };

  return (
    <div style={{ marginTop: "30px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <h4>Expense Breakdown</h4>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => handleExport("csv")}
            style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "6px", border: "1px solid #e5e7eb", background: "white", cursor: "pointer", color: "#374151" }}
          >
            Export CSV
          </button>
          <button
            onClick={() => handleExport("pdf")}
            style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "6px", border: "1px solid #e5e7eb", background: "white", cursor: "pointer", color: "#374151" }}
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="gecko-table-wrap">
        <table className="gecko-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Value</th>
              <th>Date</th>
              <th>Notes</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>

          <tbody>
            {pagedExpenses.map((exp) => {
              const isEditing = editingExpenseId === exp._id;

              return (
                <tr key={exp._id}>
                  {/* CATEGORY */}
                  <td>
                    {isEditing ? (
                      <select
                        className="gecko-input"
                        value={editForm.category}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            category: e.target.value,
                          }))
                        }
                      >
                        {budgetAllocation.map((cat) => (
                          <option key={cat.name} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      exp.category
                    )}
                  </td>

                  {/* VALUE */}
                  <td>
                    {isEditing ? (
                      <input
                        className="gecko-input"
                        type="number"
                        value={editForm.amount}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            amount: Number(e.target.value),
                          }))
                        }
                      />
                    ) : (
                      `£${exp.amount.toFixed(2)}`
                    )}
                  </td>

                  {/* DATE */}
                  <td>
                    {isEditing ? (
                      <input
                        className="gecko-input"
                        type="date"
                        value={editForm.date}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            date: e.target.value,
                          }))
                        }
                      />
                    ) : (
                      new Date(exp.date).toLocaleDateString("en-GB")
                    )}
                  </td>

                  {/* NOTE */}
                  <td>
                    {isEditing ? (
                      <input
                        className="gecko-input"
                        value={editForm.note}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            note: e.target.value,
                          }))
                        }
                      />
                    ) : (
                      exp.note || "-"
                    )}
                  </td>

                  {/* EDIT */}
                  <td>
                    {isEditing ? (
                      <>
                        <button
                          className="gecko-pill-btn"
                          onClick={() => {
                            onUpdate(exp._id, editForm);
                            setEditingExpenseId(null);
                          }}
                        >
                          Save
                        </button>

                        <button className="gecko-pill-btn" onClick={() => setEditingExpenseId(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className="gecko-pill-btn"
                        onClick={() => {
                          setEditingExpenseId(exp._id);
                          setEditForm({
                            category: exp.category,
                            amount: exp.amount,
                            date: exp.date,
                            note: exp.note || "",
                          });
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </td>

                  {/* DELETE */}
                  <td>
                    {pendingDeleteId === exp._id ? (
                      <>
                        <button className="gecko-pill-btn" onClick={() => onDelete(exp._id)}>Confirm</button>
                        <button className="gecko-pill-btn" onClick={() => setPendingDeleteId(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button className="gecko-pill-btn" onClick={() => setPendingDeleteId(exp._id)}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: "12px", textAlign: "center", display: "flex", justifyContent: "center", gap: "8px", alignItems: "center" }}>
          <button
            className="gecko-pill-btn"
            onClick={() => setExpensePage((p) => Math.max(p - 1, 1))}
            disabled={expensePage === 1}
          >
            ◀
          </button>

          <span style={{ margin: "0 10px" }}>
            Page {expensePage} / {totalPages}
          </span>

          <button
            className="gecko-pill-btn"
            onClick={() => setExpensePage((p) => Math.min(p + 1, totalPages))}
            disabled={expensePage === totalPages}
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
};

export default ExpenseBreakdown;
