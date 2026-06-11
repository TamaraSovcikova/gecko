import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Target, Trash2, PiggyBank, Calendar, TrendingUp, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiClient } from "../../api/client";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Alert } from "../../components/ui/alert";
import { cn } from "../../lib/utils";

type Contribution = { _id: string; amount: number; note: string; createdAt: string };
type SavingsGoal = {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  category: string;
  emoji: string;
  color: string;
  isCompleted: boolean;
  completedAt: string | null;
  progressPct: number;
  remainingAmount: number;
  monthsToTarget: number | null;
  contributions: Contribution[];
};

const CATEGORY_LABELS: Record<string, string> = {
  emergency: "Emergency Fund",
  travel: "Travel",
  purchase: "Purchase",
  education: "Education",
  home: "Home",
  retirement: "Retirement",
  other: "Other",
};

const EMOJI_OPTIONS = ["🎯", "🏖️", "🏠", "🚗", "📚", "💍", "🌍", "💰", "🎓", "🏋️"];
const COLOR_OPTIONS = ["#8b6fd4", "#f0b429", "#5bb8c4", "#e05c5c", "#5bb88a", "#f07843"];

export default function SavingsPage() {
  const { token } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [contributingGoal, setContributingGoal] = useState<string | null>(null);
  const [contribAmount, setContribAmount] = useState("");
  const [contribNote, setContribNote] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    targetDate: "",
    category: "other",
    emoji: "🎯",
    color: "#8b6fd4",
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const fetchGoals = async () => {
    if (!token) return;
    try {
      const res = await apiClient.get("/api/v1/savings");
      setGoals(res.data);
    } catch {
      setError("Failed to load savings goals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    try {
      await apiClient.post("/api/v1/savings", {
        name: formData.name,
        targetAmount: Number(formData.targetAmount),
        targetDate: formData.targetDate || null,
        category: formData.category,
        emoji: formData.emoji,
        color: formData.color,
      });
      setFormData({ name: "", targetAmount: "", targetDate: "", category: "other", emoji: "🎯", color: "#8b6fd4" });
      setShowForm(false);
      setFormSuccess("Goal created!");
      await fetchGoals();
    } catch (err: any) {
      setFormError(err?.response?.data?.error || "Failed to create goal");
    }
  };

  const handleContribute = async (goalId: string) => {
    if (!contribAmount) return;
    try {
      const res = await apiClient.post(`/api/v1/savings/${goalId}/contribute`, {
        amount: Number(contribAmount),
        note: contribNote,
      });
      setGoals((prev) => prev.map((g) => (g._id === goalId ? res.data : g)));
      setContributingGoal(null);
      setContribAmount("");
      setContribNote("");
    } catch (err: any) {
      alert(err?.response?.data?.error || "Failed to add contribution");
    }
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm("Delete this goal?")) return;
    try {
      await apiClient.delete(`/api/v1/savings/${goalId}`);
      setGoals((prev) => prev.filter((g) => g._id !== goalId));
    } catch {
      alert("Failed to delete goal");
    }
  };

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);

  if (loading) {
    return (
      <div className="app-page">
        <div className="max-w-screen-lg mx-auto space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="app-page">
      <div className="max-w-screen-lg mx-auto pb-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-6 mt-2 flex-wrap gap-4">
          <div>
            <p className="app-section-eyebrow">Savings</p>
            <h1 className="app-page-title mt-2">Savings Goals</h1>
          </div>
          <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4 mr-1" />
            New Goal
          </Button>
        </div>

        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}
        {formSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
            <Alert variant="success">{formSuccess}</Alert>
          </motion.div>
        )}

        {/* Summary */}
        {goals.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-gecko-muted uppercase tracking-wider mb-1">Total saved</p>
              <p className="text-xl font-bold text-gray-900">
                {"\xA3"}
                {totalSaved.toFixed(2)}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-gecko-muted uppercase tracking-wider mb-1">Total targets</p>
              <p className="text-xl font-bold text-gray-900">
                {"\xA3"}
                {totalTarget.toFixed(2)}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-gecko-muted uppercase tracking-wider mb-1">Goals active</p>
              <p className="text-xl font-bold text-gray-900">{goals.filter((g) => !g.isCompleted).length}</p>
            </div>
          </div>
        )}

        {/* New goal form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">New savings goal</h3>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gecko-muted uppercase tracking-wider mb-1 block">
                        Goal name
                      </label>
                      <input
                        className="w-full px-3 py-2.5 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        value={formData.name}
                        onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
                        placeholder="e.g. Holiday fund"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gecko-muted uppercase tracking-wider mb-1 block">
                        Target amount ({"\xA3"})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="w-full px-3 py-2.5 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        value={formData.targetAmount}
                        onChange={(e) => setFormData((d) => ({ ...d, targetAmount: e.target.value }))}
                        placeholder="1000"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gecko-muted uppercase tracking-wider mb-1 block">
                        Target date (optional)
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2.5 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        value={formData.targetDate}
                        onChange={(e) => setFormData((d) => ({ ...d, targetDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gecko-muted uppercase tracking-wider mb-1 block">
                        Category
                      </label>
                      <select
                        className="w-full px-3 py-2.5 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        value={formData.category}
                        onChange={(e) => setFormData((d) => ({ ...d, category: e.target.value }))}
                      >
                        {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gecko-muted uppercase tracking-wider mb-2 block">
                      Emoji
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {EMOJI_OPTIONS.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => setFormData((d) => ({ ...d, emoji: e }))}
                          className={cn(
                            "text-xl p-1.5 rounded-md border-2 transition-colors",
                            formData.emoji === e
                              ? "border-purple-500 bg-purple-50"
                              : "border-transparent hover:border-gray-200"
                          )}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gecko-muted uppercase tracking-wider mb-2 block">
                      Color
                    </label>
                    <div className="flex gap-2">
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setFormData((d) => ({ ...d, color: c }))}
                          className={cn(
                            "h-7 w-7 rounded-full border-2 transition-transform",
                            formData.color === c ? "border-gray-700 scale-125" : "border-transparent"
                          )}
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  </div>
                  {formError && <Alert variant="danger">{formError}</Alert>}
                  <div className="flex gap-3">
                    <Button type="submit" variant="primary">
                      Create goal
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Goals list */}
        {goals.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <PiggyBank className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-2">No savings goals yet</h3>
            <p className="text-sm text-gecko-muted mb-6">Create your first goal to start tracking your progress.</p>
            <Button variant="primary" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" /> Create first goal
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {goals.map((goal, index) => (
              <motion.div
                key={goal._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "bg-white border rounded-lg p-5 relative overflow-hidden",
                  goal.isCompleted ? "border-emerald-200" : "border-gray-200"
                )}
              >
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: goal.color }} />

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{goal.emoji}</span>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{goal.name}</h4>
                      <p className="text-xs text-gecko-muted">{CATEGORY_LABELS[goal.category]}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {goal.isCompleted && <Badge variant="success">Completed</Badge>}
                    <button
                      onClick={() => handleDelete(goal._id)}
                      className="p-1.5 rounded-md text-gecko-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-gray-900">
                      {"\xA3"}
                      {goal.currentAmount.toFixed(2)} saved
                    </span>
                    <span className="text-gecko-muted">
                      of {"\xA3"}
                      {goal.targetAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full transition-all"
                      style={{ background: goal.color, width: `${goal.progressPct}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${goal.progressPct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gecko-muted">{goal.progressPct.toFixed(1)}% complete</span>
                    {goal.isCompleted ? (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Done!
                      </span>
                    ) : (
                      <span className="text-xs text-gecko-muted">
                        {"\xA3"}
                        {goal.remainingAmount.toFixed(2)} to go
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2">
                  {goal.targetDate && (
                    <span className="flex items-center gap-1 text-xs text-gecko-muted">
                      <Calendar className="h-3 w-3" />
                      {new Date(goal.targetDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                      {goal.monthsToTarget !== null && ` (${goal.monthsToTarget} mo)`}
                    </span>
                  )}
                  {!goal.isCompleted && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setContributingGoal(contributingGoal === goal._id ? null : goal._id)}
                    >
                      <TrendingUp className="h-3.5 w-3.5 mr-1" /> Add funds
                    </Button>
                  )}
                </div>

                {/* Contribution form */}
                <AnimatePresence>
                  {contributingGoal === goal._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-3 pt-3 border-t border-gray-100"
                    >
                      <div className="flex gap-2 flex-wrap">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          className="flex-1 min-w-24 px-3 py-2 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
                          value={contribAmount}
                          onChange={(e) => setContribAmount(e.target.value)}
                          placeholder="Amount"
                        />
                        <input
                          className="flex-[2] min-w-32 px-3 py-2 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
                          value={contribNote}
                          onChange={(e) => setContribNote(e.target.value)}
                          placeholder="Note (optional)"
                        />
                        <Button variant="primary" size="sm" onClick={() => handleContribute(goal._id)}>
                          Save
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
