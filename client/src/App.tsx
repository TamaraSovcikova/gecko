// App.tsx - Top-level route definitions.
// ProtectedRoute wraps any page that requires the user to be logged in.
// If an unauthenticated user hits a protected route they are redirected to /login.
//
// How to add a new page:
//   1. Create the component in src/pages/YourPage/index.tsx
//   2. Import it here
//   3. Add a <Route path="/your-path" element={<YourPage />} /> below

import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard/dashboard.tsx";
import Home from "./pages/Home";
import Profile from "./pages/Profile/index.tsx";
import ProtectedRoute from "./components/ProtectedRoute";
import PayslipSetup from "./pages/PayslipSetup";
import Expenses from "./pages/Expenses/Expenses";
import Learn from "./pages/Learn/index.tsx";
import Quiz from "./pages/Quiz";
import Terms from "./pages/Terms";
import SettingsPage from "./pages/Settings";
import ChangePasswordPage from "./pages/ChangePassword";
import DataPolicyPage from "./pages/DataPolicy";
import MainLayout from "./MainLayout";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* <Route path="/expenses" element={<Expenses />} /> 
      Route commented out -> choosing to embed the expenses form in the /Dashboard route*/}

      {/* LAYOUT WRAPPER (XP BAR LIVES HERE) */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* PROTECTED ROUTES INSIDE LAYOUT */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/payslip" element={<PayslipSetup />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
      </Route>

      {/* NON-LAYOUT PROTECTED ROUTES */}
      <Route path="/terms" element={<Terms />} />
      <Route path="/data-policy" element={<DataPolicyPage />} />
    </Routes>
  );
}

export default App;