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
import Profile from "./pages/Profile/index.tsx";
import ProtectedRoute from "./components/ProtectedRoute";
import PayslipSetup from "./pages/PayslipSetup";

{/* import Expenses from "./pages/Expenses/Expenses.tsx"; */}

import Expenses from "./pages/Expenses/Expenses";
import Learn from "./pages/Learn";
import Quiz from "./pages/Quiz";
import Terms from "./pages/Terms";
import SettingsPage from "./pages/Settings";
import ChangePasswordPage from "./pages/ChangePassword";
import DataPolicyPage from "./pages/DataPolicy";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Login />} />
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* <Route path="/expenses" element={<Expenses />} /> 
      Route commented out -> choosing to embed the expenses form in the /Dashboard route*/} 

      <Route
        path="/payslip"
        element={
          <ProtectedRoute>
            <PayslipSetup />
          </ProtectedRoute>
        }
      />

      <Route
        path="/expenses"
        element={
          <ProtectedRoute>
            <Expenses />
          </ProtectedRoute>
        }
      />

      <Route
        path="/learn"
        element={
          <ProtectedRoute>
            <Learn />
          </ProtectedRoute>
        }
      />

      <Route
        path="/quiz"
        element={
          <ProtectedRoute>
            <Quiz />
          </ProtectedRoute>
        }
      />

      <Route
        path="/terms"
        element={<Terms />}
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/data-policy"
        element={<DataPolicyPage />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Protected routes — redirect to /login if not authenticated */}
      {/* <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/payslip" element={
        <ProtectedRoute>
          <PayslipSetup />
        </ProtectedRoute>
      } />     
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } /> */}
    </Routes>
  );
}

export default App;
