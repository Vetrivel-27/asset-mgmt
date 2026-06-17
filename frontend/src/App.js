import "./App.css";
import LogIn from "./pages/Auth/LogIn.js";
import ForgotPassword from "./pages/Auth/ForgotPassword.js";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "./pages/Admin/AdminDashboard.js";
import AdminAssets from "./pages/Admin/AdminAssets.js";
import AdminEmployees from "./pages/Admin/AdminEmployees.js";
import AdminAssignments from "./pages/Admin/AdminAssignments.js";
import AdminReports from "./pages/Admin/AdminReports.js";
import AdminRoles from "./pages/Admin/AdminRoles.js";
import AdminRequests from "./pages/Admin/AdminRequests.js";
import EmployeeAssets from "./pages/Employee/EmployeeAssets.js";
import EmployeeStatus from "./pages/Employee/EmployeeStatus.js";
import EmployeeReport from "./pages/Employee/EmployeeReport.js";
import EmployeeHistory from "./pages/Employee/EmployeeHistory.js";
import ProtectedRoute from "./components/common/ProtectedRoute.js";
import PublicRoute from "./components/common/PublicRoute.js";
import DashboardLayout from "./components/DashboardLayout.js";
import PermissionRoute from "./components/common/PermissionRoute.js";
import SessionManager from "./components/common/SessionManager.js";
import { AuthProvider } from "./context/AuthContext.js";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SessionManager />
      <Routes>
        {/* Public-only routes: redirect to dashboard if already logged in */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LogIn />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/forgot-password/:token" element={<ForgotPassword />} />
        </Route>

        {/* Unified Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            {/* Admin-focused routes */}
            <Route element={<PermissionRoute permission="view_dashboard" />}>
              <Route index element={<AdminDashboard />} />
            </Route>
            <Route element={<PermissionRoute permission="approve_borrow" />}>
              <Route path="requests" element={<AdminRequests />} />
            </Route>
            <Route element={<PermissionRoute permission="manage_asset" />}>
              <Route path="assets" element={<AdminAssets />} />
            </Route>
            <Route element={<PermissionRoute permission="view_users" />}>
              <Route path="employees" element={<AdminEmployees />} />
            </Route>
            <Route element={<PermissionRoute permission="view_assignments" />}>
              <Route path="assignments" element={<AdminAssignments />} />
            </Route>
            <Route element={<PermissionRoute permission={["view_report", "manage_maintenance"]} />}>
              <Route path="reports" element={<AdminReports />} />
            </Route>
            <Route element={<PermissionRoute permission="manage_roles" />}>
              <Route path="roles" element={<AdminRoles />} />
            </Route>

            {/* Employee-focused routes */}
            <Route element={<PermissionRoute permission="view_asset" />}>
              <Route path="my-assets" element={<EmployeeAssets />} />
              <Route path="history" element={<EmployeeHistory />} />
            </Route>
            <Route element={<PermissionRoute permission="return_asset" />}>
              <Route path="status" element={<EmployeeStatus />} />
            </Route>
            <Route element={<PermissionRoute permission="report_damage" />}>
              <Route path="report" element={<EmployeeReport />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
