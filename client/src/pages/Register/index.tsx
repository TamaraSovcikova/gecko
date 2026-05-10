// pages/Register/index.tsx - Register page.
// Very similar to the Login page but also collects a display name.
//
// Flow:
//   1. User fills in display name, email, and password
//   2. Firebase createUserWithEmailAndPassword creates the account
//   3. We update the Firebase profile with the display name
//   4. Call the backend /api/v1/auth/register to create a User doc in MongoDB
//   5. Redirect to /payslip since this is always a first login

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { auth } from "../../firebase/config";
import { registerUser } from "../../api/authApi";

const Register = () => {
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Email + password registration
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
      await registerUser(token);

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
    <div
      className="container d-flex justify-content-center align-items-center min-vh-100"
      style={{
        maxWidth: "100%",
        background:
          "radial-gradient(circle at 14% 10%, #e8e0fa 0%, rgba(232, 224, 250, 0) 32%), radial-gradient(circle at 90% 88%, #f5f0fe 0%, rgba(245, 240, 254, 0) 36%), #f4f1fb",
      }}
    >
      <div
        className="card p-4 shadow"
        style={{
          width: "100%",
          maxWidth: "440px",
          borderRadius: "18px",
          border: "1px solid #c9bde8",
          background: "linear-gradient(145deg, #faf9fd 0%, #f4f1fb 62%, #ede8f8 100%)",
          boxShadow: "0 20px 30px rgba(92, 63, 163, 0.12)",
        }}
      >
        <h2 className="text-center mb-4" style={{ color: "#5c3fa3", fontWeight: 700, letterSpacing: "0.6px" }}>Create Account</h2>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleEmailRegister}>
          <div className="mb-3">
            <label className="form-label" style={{ color: "#4a3f6b", fontWeight: 600 }}>Display Name</label>
            <input
              type="text"
              className="form-control"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={{ borderColor: "#c9bde8", backgroundColor: "#faf9fd" }}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label" style={{ color: "#4a3f6b", fontWeight: 600 }}>Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ borderColor: "#c9bde8", backgroundColor: "#faf9fd" }}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label" style={{ color: "#4a3f6b", fontWeight: 600 }}>Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ borderColor: "#c9bde8", backgroundColor: "#faf9fd" }}
              required
            />
          </div>
          <button
            type="submit"
            className="btn w-100"
            style={{ backgroundColor: "#5c3fa3", color: "#ffffff", border: "1px solid #4e358f", fontWeight: 700 }}
            disabled={loading}
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <div className="text-center my-3 text-muted">or</div>

        <button
          className="btn w-100"
          style={{ border: "1px solid #c9bde8", color: "#5c3fa3", backgroundColor: "#ede8f8", fontWeight: 600 }}
          onClick={handleGoogleRegister}
          disabled={loading}
        >
          Sign up with Google
        </button>

        <p className="text-center mt-3 mb-0">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
