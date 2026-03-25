import { useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

type Props = {
  categories? : {name: string, value: number}[]
};

const Expenses = ({categories}: Props) => {
  const { token } = useAuth();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await axios.post(
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

      alert("Expense added");
    } catch (err) {
      console.error(err);
      alert("Failed to add expense");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Log Expense</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Amount:</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Category:</label>
          <select value = {category} 
          onChange={(e) => setCategory(e.target.value)}>
            <option value = "">Select category</option>

            {categories && categories.map((cat) => (
              <option key={cat.name} value={cat.name}>{cat.name}</option>
            ))}
    
          </select>
        </div>

        <div>
          <label>Date:</label>
          <input
            type="date"
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Note:</label>
          <input onChange={(e) => setNote(e.target.value)} />
        </div>

        <button type="submit">Add Expense</button>
      </form>
    </div>
  );
};

export default Expenses;