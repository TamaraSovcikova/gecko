import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  fetchSignInMethodsForEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "../../firebase/authClient";
import { auth } from "../../firebase/config";
import { registerUser } from "../../api/authApi";
import Modal from "../../components/Modal";
import { DataPolicyContent, TermsContent } from "../../components/LegalContent";
import { motion } from "framer-motion";
import { Mail, Lock, AlertCircle, BarChart3, BookOpen, Target, ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";

const BRAND_FEATURES = [
  { icon: BarChart3, text: "Budget dashboard with real-time health score" },
  { icon: BookOpen, text: "Structured learning modules for the UK" },
  { icon: Target, text: "AI chat grounded in your actual spending" },
];

const FormInput = ({
  label,
  id,
  type,
  value,
  onChange,
  required,
  icon: Icon,
  placeholder,
}: {
  label: string;
  id: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  icon: React.ElementType;
  placeholder?: string;
}) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-semibold text-gray-700">
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
      />
    </div>
  </div>
);

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<"data-policy" | "terms" | null>(null);

  useEffect(() => {
    document.body.style.background = "#F7F8FA";
    return () => {
      document.body.style.background = "";
    };
  }, []);

  const handlePostLogin = async (user: any) => {
    const token = await user.getIdToken();
    const data = await registerUser(token);
    if (data.firstLogin) {
      navigate("/payslip");
    } else {
      navigate("/dashboard");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      await handlePostLogin(result.user);
    } catch (err: any) {
      const errorCode = String(err?.code || "");
      if (errorCode === "auth/invalid-credential") {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, email.trim().toLowerCase());
          if (methods.length === 0) {
            setError("No account found for that email address.");
          } else if (!methods.includes("password")) {
            setError("This account does not use password sign-in. Try another method.");
          } else {
            setError("Invalid email or password.");
          }
        } catch {
          setError("Invalid email or password.");
        }
      } else {
        setError(err.message || "Unable to sign in.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      await handlePostLogin(result.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "Manrope, Segoe UI, Arial, sans-serif" }}>
      {/* Left panel - brand */}
      <div
        className="hidden lg:flex lg:w-[46%] flex-col justify-between p-12 relative overflow-hidden shrink-0"
        style={{ background: "#0A0A0F" }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#7C3AED 1px, transparent 1px), linear-gradient(to right, #7C3AED 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Glow */}
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)" }}
        />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 no-underline mb-16">
            <img src="/gecko-transparent.png?v=3" alt="Gecko" className="w-9 h-9 object-contain" />
            <span className="text-base font-bold text-white">Gecko</span>
          </Link>
          <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-4">Welcome back</p>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4" style={{ maxWidth: "18ch" }}>
            Your financial journey continues here.
          </h1>
          <p className="text-gray-400 text-base leading-relaxed mb-10" style={{ maxWidth: "36ch" }}>
            Pick up where you left off. Your dashboard, budget, and learning progress are all here waiting.
          </p>
          <div className="space-y-4">
            {BRAND_FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(124,58,237,0.15)" }}
                >
                  <Icon className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-sm text-gray-300">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-gray-600">Originally built for University of Surrey &bull; COM2042</p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-sm">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors no-underline mb-8"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </Link>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-7 lg:hidden">
              <img src="/gecko-transparent.png?v=3" alt="Gecko" className="w-8 h-8 object-contain" />
              <span className="text-base font-bold text-gray-900">Gecko</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-1">Log in</h2>
            <p className="text-sm text-gray-500 mb-7">
              Don't have an account?{" "}
              <Link to="/register" className="text-purple-600 font-semibold hover:text-purple-700 transition-colors">
                Create one free
              </Link>
            </p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-4 mb-5">
              <FormInput
                label="Email"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                icon={Mail}
                placeholder="you@example.com"
              />
              <FormInput
                label="Password"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                icon={Lock}
                placeholder="Your password"
              />
              <Button type="submit" variant="primary" className="w-full" loading={loading}>
                {loading ? "Signing in..." : "Log in"}
              </Button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs text-gray-400 bg-white">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className={cn(
                "w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700",
                "hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <p className="mt-6 text-xs text-gray-400 text-center leading-relaxed">
              By continuing, you agree to our{" "}
              <button
                type="button"
                onClick={() => setActiveLegalModal("data-policy")}
                className="text-gray-600 font-semibold underline-offset-2 hover:underline"
              >
                Data Policy
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={() => setActiveLegalModal("terms")}
                className="text-gray-600 font-semibold underline-offset-2 hover:underline"
              >
                Terms &amp; Conditions
              </button>
              .
            </p>
          </motion.div>
        </div>
      </div>

      {activeLegalModal === "data-policy" && (
        <Modal onClose={() => setActiveLegalModal(null)}>
          <div className="app-prose">
            <p className="app-section-eyebrow">Last updated: 11 May 2026</p>
            <h2 style={{ marginTop: 0 }}>Data Policy</h2>
            <DataPolicyContent compact />
          </div>
        </Modal>
      )}
      {activeLegalModal === "terms" && (
        <Modal onClose={() => setActiveLegalModal(null)}>
          <div className="app-prose">
            <p className="app-section-eyebrow">Last updated: 11 May 2026</p>
            <h2 style={{ marginTop: 0 }}>Terms &amp; Conditions</h2>
            <TermsContent compact />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Login;
