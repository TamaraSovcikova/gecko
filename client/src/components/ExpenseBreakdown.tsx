import { useState } from "react";

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

  const totalPages = Math.ceil(expenses.length / EXPENSES_PER_PAGE);

  const pagedExpenses = expenses.slice(
    (expensePage - 1) * EXPENSES_PER_PAGE,
    expensePage * EXPENSES_PER_PAGE,
  );

  return (
    <div style={{ marginTop: "30px" }}>
      <h4>Expense Breakdown</h4>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #ccc" }}>
            <th style={{ textAlign: "left", padding: "8px" }}>Category</th>
            <th style={{ textAlign: "left", padding: "8px" }}>Value</th>
            <th style={{ textAlign: "left", padding: "8px" }}>Date</th>
            <th style={{ textAlign: "left", padding: "8px" }}>Notes</th>
            <th style={{ textAlign: "left", padding: "8px" }}>Edit</th>
            <th style={{ textAlign: "left", padding: "8px" }}>Delete</th>
          </tr>
        </thead>

        <tbody>
          {pagedExpenses.map((exp) => {
            const isEditing = editingExpenseId === exp._id;

            return (
              <tr key={exp._id} style={{ borderBottom: "1px solid #eee" }}>
                {/* CATEGORY */}
                <td style={{ padding: "8px" }}>
                  {isEditing ? (
                    <select
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
                <td style={{ padding: "8px" }}>
                  {isEditing ? (
                    <input
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
                <td style={{ padding: "8px" }}>
                  {isEditing ? (
                    <input
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
                <td style={{ padding: "8px" }}>
                  {isEditing ? (
                    <input
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
                <td style={{ padding: "8px" }}>
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => {
                          onUpdate(exp._id, editForm);
                          setEditingExpenseId(null);
                        }}
                      >
                        Save
                      </button>

                      <button onClick={() => setEditingExpenseId(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
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
                <td style={{ padding: "8px" }}>
                  {pendingDeleteId === exp._id ? (
                    <>
                      <button onClick={() => onDelete(exp._id)}>Confirm</button>
                      <button onClick={() => setPendingDeleteId(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setPendingDeleteId(exp._id)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: "12px", textAlign: "center" }}>
          <button
            onClick={() => setExpensePage((p) => Math.max(p - 1, 1))}
            disabled={expensePage === 1}
          >
            ◀
          </button>

          <span style={{ margin: "0 10px" }}>
            Page {expensePage} / {totalPages}
          </span>

          <button
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
