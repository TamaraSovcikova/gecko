// pages/Login/index.tsx - Login page.
// Handles two sign-in methods:
//   1. Email + password via Firebase signInWithEmailAndPassword
//   2. Google Sign-In via Firebase signInWithPopup
//
// After a successful sign-in:
//   - Calls the backend /api/v1/auth/register to ensure a User doc exists in MongoDB
//   - If firstLogin is true  → redirect to /payslip
//   - If firstLogin is false → redirect to /dashboard

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  fetchSignInMethodsForEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../../firebase/config";
import { registerUser } from "../../api/authApi";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div
      className="container d-flex justify-content-center align-items-center min-vh-100"
      style={{
        maxWidth: "100%",
        background:
          "radial-gradient(circle at 14% 10%, #eaf4e5 0%, rgba(234, 244, 229, 0) 32%), radial-gradient(circle at 90% 88%, #e8f0f6 0%, rgba(232, 240, 246, 0) 36%), #f7f5ef",
      }}
    >
      <div
        className="card p-4 shadow"
        style={{
          width: "100%",
          maxWidth: "440px",
          borderRadius: "18px",
          border: "1px solid #d8d3c7",
          background: "linear-gradient(145deg, #fdfaf7 0%, #f7f4ee 62%, #f2eee6 100%)",
          boxShadow: "0 20px 30px rgba(55, 63, 51, 0.12)",
        }}
      >
        <h2 className="text-center mb-4" style={{ color: "#2b5127", fontWeight: 700, letterSpacing: "0.6px" }}>Login</h2>

        {error && <div className="alert alert-danger">{error}</div>}

        {/* Something form something*/}
        <form onSubmit={handleEmailLogin}>
          <div className="mb-3">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ borderColor: "#c6d3c8", backgroundColor: "#fcfdfb" }}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ borderColor: "#c6d3c8", backgroundColor: "#fcfdfb" }}
              required
            />
          </div>
          <button
            type="submit"
            className="btn w-100"
            style={{ backgroundColor: "#2f5a3a", color: "#fffdf8", border: "1px solid #2a5034", fontWeight: 700 }}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        {/* Something form something*/}

        <div className="text-center my-3 text-muted">or</div>

        <button
          className="btn w-100"
          style={{ border: "1px solid #b7cbb8", color: "#2f5a3a", backgroundColor: "#f4f8f1", fontWeight: 600 }}
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          Sign in with Google
        </button>

        <p className="text-center mt-3 mb-0">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
