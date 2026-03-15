// ProtectedRoute.tsx - Wrapper component that guards protected pages.

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { currentUser, loading } = useAuth();

  // Still waiting for Firebase to confirm auth state - don't render anything yet to avoid flashing the wrong page
  if (loading) return null;

  // Not logged in - send them to the login page
  if (!currentUser) return <Navigate to="/login" replace />;

  // Logged in - render the protected page
  return children;
};

export default ProtectedRoute;
