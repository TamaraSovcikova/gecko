import { useEffect, useRef, useState, type ChangeEvent } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  FileText,
  PoundSterling,
  Camera,
  X,
  RefreshCw,
  Plus,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ForecastPayload } from "../../types/forecast";
import { cn } from "../../lib/utils";

type DashboardData = {
  healthScore: number;
  takeHome: number;
  budgetLeft: number;
  totalBudget: number;
  actualSpending: { name: string; value: number }[];
  budgetAllocation: { name: string; value: number }[];
  averageSalary?: number;
  adzunaTips?: { type: string; title: string; description: string; priority: "high" | "medium" | "low" }[];
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
  onExpenseCreated?: (dashboard: DashboardData | undefined, forecast: ForecastPayload | undefined) => void;
};

const today = () => new Date().toISOString().slice(0, 10);

// ---- Camera modal ----
const CameraModal = ({ onCapture, onClose }: { onCapture: (file: File) => void; onClose: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState("");

  const startCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setCameraError("Camera access denied or unavailable. Try uploading a photo instead.");
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    setPreview(canvas.toDataURL("image/jpeg", 0.92));
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const retake = () => {
    setPreview(null);
    startCamera();
  };

  const usePhoto = () => {
    canvasRef.current?.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(new File([blob], "receipt.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 shrink-0">
        <span className="text-white text-sm font-semibold">Scan receipt</span>
        <button
          type="button"
          onClick={() => {
            streamRef.current?.getTracks().forEach((t) => t.stop());
            onClose();
          }}
          className="p-2 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      {cameraError ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
          <AlertCircle className="w-12 h-12 text-white/50" />
          <p className="text-white/80 text-sm">{cameraError}</p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 relative overflow-hidden">
            {!preview ? (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[85%] max-w-sm aspect-[3/2] border-2 border-white/60 rounded-xl" />
                </div>
                <p className="absolute bottom-24 left-0 right-0 text-center text-white/70 text-xs">
                  Position the receipt within the frame
                </p>
              </>
            ) : (
              <img src={preview} alt="Captured receipt" className="w-full h-full object-contain bg-black" />
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="shrink-0 bg-black/80 px-6 py-5 flex items-center justify-center gap-5">
            {!preview ? (
              <button
                type="button"
                onClick={capture}
                className="w-16 h-16 rounded-full bg-white border-4 border-white/30 hover:scale-105 transition-transform active:scale-95 shadow-lg"
                aria-label="Capture"
              />
            ) : (
              <>
                <button
                  type="button"
                  onClick={retake}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <RefreshCw className="w-4 h-4" /> Retake
                </button>
                <button
                  type="button"
                  onClick={usePhoto}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" /> Use photo
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ---- Main Expenses component ----
const Expenses = ({ categories, onExpenseCreated }: Props) => {
  const { token } = useAuth();
  const amountRef = useRef<HTMLInputElement>(null);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryBudget, setNewCategoryBudget] = useState("");
  const [formError, setFormError] = useState("");
  const [justAdded, setJustAdded] = useState<{ amount: string; category: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanSuccess, setScanSuccess] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>(categories?.map((item) => item.name) || []);

  useEffect(() => {
    if (!categories) return;
    const next = categories.map((c) => c.name);
    setAvailableCategories((prev) => Array.from(new Set([...prev, ...next])));
    if (!category && next.length > 0) setCategory(next[0]);
  }, [categories, category]);

  // Auto-focus amount on mount
  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!amount || !category) {
      setFormError("Amount and category are required.");
      return;
    }
    setFormError("");
    const effectiveCategory = showNewCategory ? newCategoryName.trim() : category;
    if (showNewCategory && !effectiveCategory) {
      setFormError("Category name is required.");
      return;
    }
    try {
      const payload: any = { amount: Number(amount), date, note };
      if (showNewCategory) {
        payload.newCategoryName = effectiveCategory;
        payload.newCategoryBudget = newCategoryBudget ? Number(newCategoryBudget) : 0;
        payload.category = effectiveCategory;
      } else {
        payload.category = category;
      }
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/expenses`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (showNewCategory) {
        setAvailableCategories((prev) => (prev.includes(effectiveCategory) ? prev : [...prev, effectiveCategory]));
        setCategory(effectiveCategory);
        setShowNewCategory(false);
        setNewCategoryName("");
        setNewCategoryBudget("");
      }
      if (onExpenseCreated) onExpenseCreated(res.data?.dashboard, res.data?.forecast);
      setJustAdded({ amount, category: effectiveCategory });
      setAmount("");
      setNote("");
      setShowNote(false);
      setDate(today());
      setShowDatePicker(false);
      setScanSuccess("");
      setTimeout(() => {
        amountRef.current?.focus();
      }, 50);
    } catch (err) {
      setFormError(
        axios.isAxiosError(err) ? err.response?.data?.error || "Failed to add expense" : "Failed to add expense"
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && amount && category) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const processReceiptFile = async (file: File) => {
    if (!token) return;
    const formData = new FormData();
    formData.append("image", file);
    setIsScanning(true);
    setScanError("");
    setScanSuccess("");
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/expenses/scan`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data?.success && response.data?.amount) {
        setAmount(String(response.data.amount));
        setScanSuccess("Receipt scanned.");
      } else {
        setScanError(response.data?.message || "Could not detect a total.");
      }
    } catch (err) {
      setScanError(
        axios.isAxiosError(err) ? err.response?.data?.message || "Failed to scan receipt." : "Failed to scan receipt."
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleReceiptFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processReceiptFile(file);
    e.target.value = "";
  };

  const isDateToday = date === today();

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-gray-100">
          <div className="p-1.5 bg-gray-100 rounded-md">
            <Receipt className="h-3.5 w-3.5 text-purple-600" />
          </div>
          <h5 className="text-sm font-bold text-gray-800">Log Expense</h5>
          {/* Date toggle */}
          <button
            type="button"
            onClick={() => setShowDatePicker((v) => !v)}
            className="ml-auto flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isDateToday ? "Today" : date}
            <ChevronDown className={cn("w-3 h-3 transition-transform", showDatePicker && "rotate-180")} />
          </button>
        </div>

        {/* Date picker (hidden by default) */}
        <AnimatePresence>
          {showDatePicker && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden border-b border-gray-100"
            >
              <div className="px-4 py-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-4 pt-3 pb-4 space-y-3">
          {/* Category chips */}
          {availableCategories.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {availableCategories.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setCategory(name);
                    setShowNewCategory(false);
                    amountRef.current?.focus();
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-semibold transition-all border",
                    category === name && !showNewCategory
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-gray-100 text-gray-600 border-gray-100 hover:border-purple-300 hover:text-purple-700"
                  )}
                >
                  {name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setShowNewCategory(true);
                  setCategory("");
                }}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-semibold transition-all border flex items-center gap-1",
                  showNewCategory
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-gray-100 text-gray-500 border-gray-100 hover:border-gray-300"
                )}
              >
                <Plus className="w-3 h-3" /> New
              </button>
            </div>
          )}

          {/* New category inline */}
          <AnimatePresence>
            {showNewCategory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden space-y-2"
              >
                <input
                  className="w-full px-3 py-2 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name (e.g. Gym)"
                  autoFocus
                />
                <input
                  type="number"
                  className="w-full px-3 py-2 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  value={newCategoryBudget}
                  onChange={(e) => setNewCategoryBudget(e.target.value)}
                  placeholder="Monthly budget (optional)"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Amount */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">£</span>
            <input
              ref={amountRef}
              type="number"
              step="0.01"
              min="0"
              className="w-full pl-7 pr-3 py-3 rounded-md border border-gray-200 bg-white text-lg font-semibold text-gray-900 placeholder-gray-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="0.00"
            />
          </div>

          {/* Scan result feedback */}
          <AnimatePresence>
            {(scanSuccess || scanError) && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn("text-xs font-semibold", scanSuccess ? "text-emerald-600" : "text-red-500")}
              >
                {scanSuccess || scanError}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Note (hidden by default) */}
          <AnimatePresence>
            {showNote && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <input
                  className="w-full px-3 py-2 rounded-md border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What was this for?"
                  autoFocus
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {formError && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs font-semibold text-red-500"
              >
                {formError}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Actions row */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={!amount || (!category && !showNewCategory)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Add expense
            </button>
            <button
              type="button"
              onClick={() => setShowNote((v) => !v)}
              title="Add note"
              className={cn(
                "p-2.5 rounded-md border transition-colors",
                showNote
                  ? "border-purple-400 text-purple-600 bg-purple-50"
                  : "border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300"
              )}
            >
              <FileText className="w-4 h-4" />
            </button>
            <label
              title="Scan receipt"
              className={cn(
                "p-2.5 rounded-md border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors cursor-pointer",
                isScanning && "opacity-40 cursor-not-allowed"
              )}
            >
              <ScanLine className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleReceiptFileChange}
                disabled={isScanning}
              />
            </label>
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              disabled={isScanning}
              title="Scan with camera"
              className="p-2.5 rounded-md border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-40"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Just-added confirmation + add-another */}
          <AnimatePresence>
            {justAdded && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between pt-1"
              >
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />£{justAdded.amount} added to {justAdded.category}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setJustAdded(null);
                    amountRef.current?.focus();
                  }}
                  className="text-[11px] font-semibold text-purple-600 hover:text-purple-700 transition-colors"
                >
                  Add another
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Camera modal */}
      <AnimatePresence>
        {showCamera && (
          <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CameraModal
              onCapture={async (file) => {
                setShowCamera(false);
                await processReceiptFile(file);
              }}
              onClose={() => setShowCamera(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Expenses;
