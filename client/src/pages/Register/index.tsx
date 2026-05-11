// pages/Register/index.tsx - Register page.
// Very similar to the Login page but also collects a display name.
//
// Flow:
//   1. User fills in display name, email, and password
//   2. Firebase createUserWithEmailAndPassword creates the account
//   3. We update the Firebase profile with the display name
//   4. Call the backend /api/v1/auth/register to create a User doc in MongoDB
//   5. Redirect to /payslip since this is always a first login

import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { auth } from "../../firebase/config";
import { registerUser } from "../../api/authApi";
import Modal from "../../components/Modal";
import { DataPolicyContent, TermsContent } from "../../components/LegalContent";

const strengthLabel = (password: string) => {
  if (!password) return { text: "Enter a password", color: "#7a6e99" };
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);

  const checks = [hasLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  if (checks >= 4) {
    return { text: "Strong", color: "#5bb8c4" };
  }
  if (checks >= 3) {
    return { text: "Good", color: "#c2872c" };
  }
  return { text: "Weak: use 8+ chars, uppercase, lowercase, number, and special character (!@#$%^&*)", color: "#e05c5c" };
};

const Register = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("auth-page-bg");
    return () => {
      document.body.classList.remove("auth-page-bg");
    };
  }, []);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<"data-policy" | "terms" | null>(null);

  const strength = strengthLabel(password);
  const passwordStrongEnough = useMemo(() => {
    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);
    const checks = [hasLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    return checks >= 4;
  }, [password]);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Email + password registration
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!passwordStrongEnough) {
      setError("Password is not strong enough. Use 8+ characters, uppercase, lowercase, number, and special character.");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // Create the Firebase account
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // Save the display name to the Firebase user profile
      await updateProfile(result.user, { displayName });

      // Tell the backend to create a User document in MongoDB
      const token = await result.user.getIdToken();
      await registerUser(token, displayName.trim());

      // Always a first login from Register - go to payslip setup
      navigate("/payslip");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In - display name comes from the Google account
  const handleGoogleRegister = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
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
    <div className="auth-shell">
      <div className="auth-card auth-card-premium">
        <p className="auth-kicker">Join Gecko</p>
        <div className="auth-brand-header">
          <img className="auth-logo" src="/gecko-transparent.png?v=3" alt="Gecko logo" />
        </div>
        <h2 className="auth-title auth-title-premium">Create Account</h2>
        <p className="auth-subtitle">Set up your account and start mastering your finances from day one.</p>

        {error && <div className="app-note app-status-error auth-error-note">{error}</div>}

        <form onSubmit={handleEmailRegister} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Display Name</label>
            <input
              type="text"
              className="auth-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
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
              type="password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: strength.color }}>
              {strength.text}
            </p>
          </div>
          <div className="auth-field">
            <label className="auth-label">Confirm Password</label>
            <input
              type="password"
              className="auth-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="gecko-pill-btn auth-primary-btn"
            disabled={loading || !passwordStrongEnough || !passwordsMatch}
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <button
          className="gecko-pill-btn auth-secondary-btn"
          onClick={handleGoogleRegister}
          disabled={loading}
        >
          Sign up with Google
        </button>

        <p className="auth-switch" style={{ marginTop: "10px", fontSize: "0.9rem" }}>
          By creating an account or signing in, you consent to data processing needed to
          operate this app, including secure authentication and API-powered features, as
          described in our{" "}
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
          Already have an account? <Link to="/login">Login</Link>
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

export default Register;
