import { useEffect, useRef, useState, type ChangeEvent } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt,
  Plus,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  Tag,
  Calendar,
  FileText,
  PoundSterling,
  Camera,
  X,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ForecastPayload } from "../../types/forecast";
import { Button } from "../../components/ui/button";
import { Alert } from "../../components/ui/alert";
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], "receipt.jpg", { type: "image/jpeg" });
        onCapture(file);
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black flex flex-col">
      {/* Header */}
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
          {/* Viewfinder */}
          <div className="flex-1 relative overflow-hidden">
            {!preview ? (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                {/* Guide overlay */}
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

          {/* Controls */}
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
                  <RefreshCw className="w-4 h-4" />
                  Retake
                </button>
                <button
                  type="button"
                  onClick={usePhoto}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Use photo
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
  const [showCamera, setShowCamera] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>(categories?.map((item) => item.name) || []);

  const isStandalonePage = !categories;

  useEffect(() => {
    if (!categories) return;
    const next = categories.map((c) => c.name);
    setAvailableCategories((prev) => Array.from(new Set([...prev, ...next])));
    if (!category && next.length > 0) setCategory(next[0]);
  }, [categories, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    try {
      const payload: any = { amount: Number(amount), date, note };
      if (category === "create-new") {
        if (!newCategoryName.trim()) {
          setFormError("Category name is required");
          return;
        }
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
        setAvailableCategories((prev) => (prev.includes(created) ? prev : [...prev, created]));
      }
      if (onExpenseCreated) onExpenseCreated(res.data?.dashboard, res.data?.forecast);
      setCategory(created);
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
      const scannedAmount = response.data?.amount;
      if (response.data?.success && scannedAmount) {
        setAmount(String(scannedAmount));
        if (!date) setDate(new Date().toISOString().slice(0, 10));
        setScanSuccess("Receipt scanned - amount prefilled.");
      } else {
        setScanError(response.data?.message || "Could not detect a total.");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setScanError(err.response?.data?.message || err.response?.data?.error || "Failed to scan receipt.");
      } else {
        setScanError("Failed to scan receipt.");
      }
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

  const handleCameraCapture = async (file: File) => {
    setShowCamera(false);
    await processReceiptFile(file);
  };

  const formPanel = (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 bg-gray-100 rounded-md">
          <Receipt className="h-4 w-4 text-purple-600" />
        </div>
        <h5 className="text-base font-semibold text-gray-800">Log Expense</h5>
      </div>

      <AnimatePresence>
        {(scanSuccess || scanError) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4"
          >
            {scanSuccess && <Alert variant="success">{scanSuccess}</Alert>}
            {scanError && <Alert variant="danger">{scanError}</Alert>}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount */}
        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
            <PoundSterling className="h-3.5 w-3.5 text-purple-500" />
            Amount
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            className={cn(
              "w-full px-3 py-2.5 rounded-md border border-gray-200 bg-white text-sm text-gray-800",
              "focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            )}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        {/* Category */}
        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-purple-500" />
            Category
          </label>
          <select
            className={cn(
              "w-full px-3 py-2.5 rounded-md border border-gray-200 bg-white text-sm text-gray-800",
              "focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            )}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select category</option>
            {availableCategories.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
            <option value="create-new">+ Create new category</option>
          </select>
        </div>

        <AnimatePresence>
          {category === "create-new" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden space-y-3 pl-3 border-l-2 border-gray-200"
            >
              <input
                className={cn(
                  "w-full px-3 py-2.5 rounded-md border border-gray-200 bg-white text-sm",
                  "focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                )}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name (e.g. Gym)"
                required
              />
              <input
                type="number"
                className={cn(
                  "w-full px-3 py-2.5 rounded-md border border-gray-200 bg-white text-sm",
                  "focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                )}
                value={newCategoryBudget}
                onChange={(e) => setNewCategoryBudget(e.target.value)}
                placeholder="Monthly budget (optional)"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Date */}
        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-purple-500" />
            Date
          </label>
          <input
            type="date"
            className={cn(
              "w-full px-3 py-2.5 rounded-md border border-gray-200 bg-white text-sm text-gray-800",
              "focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            )}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {/* Note */}
        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-purple-500" />
            Note <span className="text-gecko-muted font-normal">(optional)</span>
          </label>
          <input
            className={cn(
              "w-full px-3 py-2.5 rounded-md border border-gray-200 bg-white text-sm text-gray-800",
              "focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            )}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What was this for?"
          />
        </div>

        {/* Receipt scan */}
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 p-3 space-y-2">
          <div className="flex items-center gap-1.5 mb-1">
            <ScanLine className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">Scan receipt</span>
            <span className="text-xs text-gray-400 whitespace-nowrap">— auto-fills amount</span>
          </div>
          <div className="flex gap-2">
            {/* Camera button */}
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <Camera className="h-3.5 w-3.5 text-gray-500" />
              Camera
            </button>
            {/* File upload */}
            <label
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-md bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer",
                isScanning && "opacity-50 cursor-not-allowed"
              )}
            >
              <ScanLine className="h-3.5 w-3.5 text-gray-500" />
              Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleReceiptFileChange}
                disabled={isScanning}
              />
            </label>
          </div>
          {isScanning && (
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full border-2 border-gray-400 border-r-transparent animate-spin" />
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

      {/* Camera modal */}
      <AnimatePresence>
        {showCamera && <CameraModal onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />}
      </AnimatePresence>
    </div>
  );

  if (isStandalonePage) {
    return (
      <div className="app-page">
        <div className="max-w-xl mx-auto">
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
