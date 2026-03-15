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
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

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
