import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "../../firebase/authClient";
import { auth } from "../../firebase/config";
import { registerUser } from "../../api/authApi";
import Modal from "../../components/Modal";
import { DataPolicyContent, TermsContent } from "../../components/LegalContent";
import { motion } from "framer-motion";
import { Mail, Lock, User, AlertCircle, CheckCircle, PiggyBank, TrendingUp, BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";

const BRAND_BULLETS = [
  { icon: PiggyBank, text: "Budget built from your payslip in seconds" },
  { icon: TrendingUp, text: "Forecasting and health score update in real time" },
  { icon: BookOpen, text: "Guided learning for the UK tax and pension system" },
];

const strengthInfo = (password: string) => {
  if (!password) return { text: "Enter a password", level: 0, color: "text-gray-400" };
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[!@#$%^&*]/.test(password),
  ].filter(Boolean).length;
  if (checks >= 4) return { text: "Strong", level: checks, color: "text-emerald-600" };
  if (checks >= 3) return { text: "Good", level: checks, color: "text-amber-600" };
  return { text: "Weak - 8+ chars, upper, lower, number, symbol", level: checks, color: "text-red-600" };
};

const FormInput = ({
  label,
  id,
  type,
  value,
  onChange,
  required,
  icon: Icon,
  placeholder,
  className: extraClass,
}: {
  label: string;
  id: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  icon: React.ElementType;
  placeholder?: string;
  className?: string;
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
        className={cn(
          "w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all",
          extraClass
        )}
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

const Register = () => {
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<"data-policy" | "terms" | null>(null);

  useEffect(() => {
    document.body.style.background = "#F7F8FA";
    return () => {
      document.body.style.background = "";
    };
  }, []);

  const strength = strengthInfo(password);
  const passwordStrongEnough = useMemo(() => {
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*]/.test(password),
    ].filter(Boolean).length;
    return checks >= 4;
  }, [password]);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!passwordStrongEnough) {
      setError("Password is not strong enough.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });
      const token = await result.user.getIdToken();
      await registerUser(token, displayName.trim());
      navigate("/payslip");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      await registerUser(token);
      navigate("/payslip");
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
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#7C3AED 1px, transparent 1px), linear-gradient(to right, #7C3AED 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)" }}
        />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 no-underline mb-16">
            <img src="/gecko-transparent.png?v=3" alt="Gecko" className="w-9 h-9 object-contain" />
            <span className="text-base font-bold text-white">Gecko</span>
          </Link>
          <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-4">Get started free</p>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4" style={{ maxWidth: "16ch" }}>
            Take control of your money from day one.
          </h1>
          <p className="text-gray-400 text-base leading-relaxed mb-10" style={{ maxWidth: "36ch" }}>
            Enter your payslip, log expenses, and build financial confidence - all free, set up in under two minutes.
          </p>
          <div className="space-y-4">
            {BRAND_BULLETS.map(({ icon: Icon, text }) => (
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
          <p className="text-xs text-gray-600">University of Surrey &bull; COM2042 &bull; Team Zoar</p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-white overflow-y-auto">
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

            <h2 className="text-2xl font-bold text-gray-900 mb-1">Create account</h2>
            <p className="text-sm text-gray-500 mb-7">
              Already have an account?{" "}
              <Link to="/login" className="text-purple-600 font-semibold hover:text-purple-700 transition-colors">
                Log in
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

            <form onSubmit={handleEmailRegister} className="space-y-4 mb-5">
              <FormInput
                label="Display name"
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                icon={User}
                placeholder="Your name"
              />
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

              {/* Password with strength */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Create a strong password"
                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
                  />
                </div>
                {password && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-0.5 flex-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-1 flex-1 rounded-full transition-colors",
                            i <= strength.level
                              ? strength.level >= 4
                                ? "bg-emerald-500"
                                : strength.level >= 3
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              : "bg-gray-100"
                          )}
                        />
                      ))}
                    </div>
                    <span className={cn("text-xs font-medium shrink-0", strength.color)}>
                      {strength.level >= 4 ? "Strong" : strength.level >= 3 ? "Good" : "Weak"}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
                  Confirm password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {confirmPassword && passwordsMatch ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repeat password"
                    className={cn(
                      "w-full pl-10 pr-3 py-2.5 bg-white border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all",
                      confirmPassword && !passwordsMatch
                        ? "border-red-300 focus:ring-red-400/30"
                        : "border-gray-200 focus:ring-purple-500/30 focus:border-purple-400"
                    )}
                  />
                </div>
                {confirmPassword && !passwordsMatch && <p className="text-xs text-red-600">Passwords do not match.</p>}
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={loading}
                disabled={loading || !passwordStrongEnough || !passwordsMatch}
              >
                {loading ? "Creating account..." : "Create account"}
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
              onClick={handleGoogleRegister}
              disabled={loading}
              className={cn(
                "w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700",
                "hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <GoogleIcon />
              Sign up with Google
            </button>

            <p className="mt-6 text-xs text-gray-400 text-center leading-relaxed">
              By creating an account you agree to our{" "}
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

export default Register;
