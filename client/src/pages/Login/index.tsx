// pages/Login/index.tsx - Login page.
// Handles two sign-in methods:
//   1. Email + password via Firebase signInWithEmailAndPassword
//   2. Google Sign-In via Firebase signInWithPopup
//
// After a successful sign-in:
//   - Calls the backend /api/v1/auth/register to ensure a User doc exists in MongoDB
//   - If firstLogin is true  → redirect to /payslip
//   - If firstLogin is false → redirect to /dashboard

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  fetchSignInMethodsForEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../../firebase/config";
import { registerUser } from "../../api/authApi";
import Modal from "../../components/Modal";
import { DataPolicyContent, TermsContent } from "../../components/LegalContent";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("auth-page-bg");
    return () => {
      document.body.classList.remove("auth-page-bg");
    };
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<"data-policy" | "terms" | null>(null);

  // Shared post-login logic - called after either sign-in method succeeds.
  // Gets the ID token, registers the user with the backend,
  // then redirects based on whether it is their first login.
  const handlePostLogin = async (user: any) => {
    const token = await user.getIdToken();
    const data = await registerUser(token);
    if (data.firstLogin) {
      navigate("/payslip");
    } else {
      navigate("/dashboard");
    }
  };

  // Email + password sign-in
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password,
      );

      await handlePostLogin(result.user);
    } catch (err: any) {
      const errorCode = String(err?.code || "");
      if (errorCode === "auth/invalid-credential") {
        try {
          const methods = await fetchSignInMethodsForEmail(
            auth,
            email.trim().toLowerCase(),
          );
          if (methods.length === 0) {
            setError("No account found for that email address.");
          } else if (!methods.includes("password")) {
            setError(
              "This account does not use password sign-in. Try another sign-in method.",
            );
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

  // Google Sign-In
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await handlePostLogin(result.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card auth-card-premium">
        <p className="auth-kicker">Welcome Back</p>
        <div className="auth-brand-header">
          <img className="auth-logo" src="/gecko-transparent.png?v=3" alt="Gecko logo" />
        </div>
        <h2 className="auth-title auth-title-premium">Login</h2>
        <p className="auth-subtitle">Pick up where you left off and keep building your money confidence.</p>

        {error && <div className="app-note app-status-error auth-error-note">{error}</div>}

        <form onSubmit={handleEmailLogin} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              id="email"
              type="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              id="password"
              type="password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="gecko-pill-btn auth-primary-btn"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <button
          className="gecko-pill-btn auth-secondary-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          Sign in with Google
        </button>

        <p className="auth-switch" style={{ marginTop: "10px", fontSize: "0.9rem" }}>
          By continuing, you consent to data processing needed to provide this service,
          including secure authentication and API-powered features, in line with our{" "}
          <button
            type="button"
            onClick={() => setActiveLegalModal("data-policy")}
            style={{ border: "none", background: "none", padding: 0, color: "#5c3fa3", fontWeight: 700, cursor: "pointer" }}
          >
            Data Policy
          </button>{" "}
          and{" "}
          <button
            type="button"
            onClick={() => setActiveLegalModal("terms")}
            style={{ border: "none", background: "none", padding: 0, color: "#5c3fa3", fontWeight: 700, cursor: "pointer" }}
          >
            Terms &amp; Conditions
          </button>
          .
        </p>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
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
            <h2 style={{ marginTop: 0 }}>Terms & Conditions</h2>
            <TermsContent compact />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Login;
