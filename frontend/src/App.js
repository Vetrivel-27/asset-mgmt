import "./App.css";
import LogIn from "./components/LogIn.js";
import ForgotPassword from "./components/ForgotPassword.js";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/Admin/AdminLayout.js";
import AdminDashboard from "./components/Admin/AdminDashboard.js";
import AdminAssets from "./components/Admin/AdminAssets.js";
import AdminEmployees from "./components/Admin/AdminEmployees.js";
import AdminAssignments from "./components/Admin/AdminAssignments.js";
import AdminReports from "./components/Admin/AdminReports.js";
import AdminRoles from "./components/Admin/AdminRoles.js";
import EmployeeLayout from "./components/Employee/EmployeeLayout.js";
import EmployeeAssets from "./components/Employee/EmployeeAssets.js";
import EmployeeStatus from "./components/Employee/EmployeeStatus.js";
import EmployeeReport from "./components/Employee/EmployeeReport.js";
import EmployeeHistory from "./components/Employee/EmployeeHistory.js";
import ProtectedRoute from "./components/ProtectedRoute.js";
import PublicRoute from "./components/PublicRoute.js";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public-only routes: redirect to dashboard if already logged in */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LogIn />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/forgot-password/:token" element={<ForgotPassword />} />
        </Route>

        {/* Admin-only protected routes */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="assets" element={<AdminAssets />} />
            <Route path="employees" element={<AdminEmployees />} />
            <Route path="assignments" element={<AdminAssignments />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="roles" element={<AdminRoles />} />
          </Route>
        </Route>

        {/* Employee protected routes (any non-admin authenticated role) */}
        <Route element={<ProtectedRoute requiredRole="employee" />}>
          <Route path="/employee" element={<EmployeeLayout />}>
            <Route index element={<EmployeeAssets />} />
            <Route path="status" element={<EmployeeStatus />} />
            <Route path="report" element={<EmployeeReport />} />
            <Route path="history" element={<EmployeeHistory />} />
          </Route>
        </Route>

        {/* Catch-all: send to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
