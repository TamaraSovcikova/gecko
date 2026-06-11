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
import { Mail, Lock, AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";

const AuthInput = ({ label, id, type, value, onChange, required, icon: Icon }: {
  label: string; id: string; type: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean; icon: React.ElementType;
}) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-semibold text-purple-800">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="w-4 h-4 text-purple-400" />
      </div>
      <input id={id} type={type} value={value} onChange={onChange} required={required}
        className="w-full pl-10 pr-3 py-2.5 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-900 placeholder-purple-300
          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" />
    </div>
  </div>
);

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("auth-page-bg");
    return () => { document.body.classList.remove("auth-page-bg"); };
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<"data-policy" | "terms" | null>(null);

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
            setError("This account does not use password sign-in. Try another sign-in method.");
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
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-purple-50 to-white flex items-center justify-center p-4"
      style={{ fontFamily: "Manrope, Segoe UI, Arial, sans-serif" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-purple-200 shadow-xl p-8">
          {/* Brand */}
          <div className="text-center mb-8">
            <img src="/gecko-transparent.png?v=3" alt="Gecko logo" className="w-16 h-16 object-contain mx-auto mb-3" />
            <p className="text-xs font-bold tracking-[0.2em] text-purple-400 uppercase mb-1">Welcome Back</p>
            <h1 className="text-2xl font-bold text-purple-900" style={{ fontFamily: "Sora, Manrope, sans-serif" }}>Login</h1>
            <p className="text-sm text-purple-500 mt-1">Pick up where you left off and keep building your money confidence.</p>
          </div>

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="mb-5 flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4 mb-4">
            <AuthInput label="Email" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required icon={Mail} />
            <AuthInput label="Password" id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required icon={Lock} />
            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-purple-100" /></div>
            <div className="relative flex justify-center"><span className="px-3 text-xs text-purple-400 bg-white">or</span></div>
          </div>

          <button type="button" onClick={handleGoogleLogin} disabled={loading}
            className={cn("w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-purple-200 rounded-lg text-sm font-semibold text-purple-700",
              "hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed")}>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>

          <p className="mt-5 text-xs text-purple-400 text-center leading-relaxed">
            By continuing, you consent to data processing in line with our{" "}
            <button type="button" onClick={() => setActiveLegalModal("data-policy")} className="text-purple-600 font-bold underline-offset-2 hover:underline">Data Policy</button>
            {" "}and{" "}
            <button type="button" onClick={() => setActiveLegalModal("terms")} className="text-purple-600 font-bold underline-offset-2 hover:underline">Terms & Conditions</button>.
          </p>

          <p className="mt-4 text-sm text-center text-purple-500">
            Don't have an account?{" "}
            <Link to="/register" className="text-purple-700 font-bold hover:text-purple-900 transition-colors">Register</Link>
          </p>
        </div>
      </motion.div>

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
            <h2 style={{ marginTop: 0 }}>Terms & Conditions</h2>
            <TermsContent compact />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Login;
