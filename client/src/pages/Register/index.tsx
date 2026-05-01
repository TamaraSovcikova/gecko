// pages/Register/index.tsx - Register page.
// Very similar to the Login page but also collects a display name.
//
// Flow:
//   1. User fills in display name, email, and password
//   2. Firebase createUserWithEmailAndPassword creates the account
//   3. We update the Firebase profile with the display name
//   4. Call the backend /v1/auth/register to create a User doc in MongoDB
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
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div
        className="card p-4 shadow"
        style={{ width: "100%", maxWidth: "420px" }}
      >
        <h2 className="text-center mb-4">Create Account</h2>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleEmailRegister}>
          <div className="mb-3">
            <label className="form-label">Display Name</label>
            <input
              type="text"
              className="form-control"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <div className="text-center my-3 text-muted">or</div>

        <button
          className="btn btn-outline-danger w-100"
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
