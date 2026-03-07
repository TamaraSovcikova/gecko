// App.tsx — Top-level route definitions.
// React Router v6 uses <Routes> + <Route> instead of the old <Switch>.
//
// How to add a new page:
//   1. Create the component in src/pages/YourPage/index.tsx
//   2. Import it here
//   3. Add a <Route path="/your-path" element={<YourPage />} /> below

import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Login />} />

      {/* Add routes here as pages are implemented */}
      {/* <Route path="/dashboard"    element={<Dashboard />} /> */}
      {/* <Route path="/payslip"      element={<PayslipSetup />} /> */}
      {/* <Route path="/learn"        element={<Learn />} /> */}
      {/* <Route path="/profile"      element={<Profile />} /> */}
    </Routes>
  );
}

export default App;
