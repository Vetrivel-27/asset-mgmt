import "./App.css";
import LogIn from "./components/LogIn.js";
import ForgotPassword from "./components/ForgotPassword.js";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "./components/Admin/AdminDashboard.js";
import AdminAssets from "./components/Admin/AdminAssets.js";
import AdminEmployees from "./components/Admin/AdminEmployees.js";
import AdminAssignments from "./components/Admin/AdminAssignments.js";
import AdminReports from "./components/Admin/AdminReports.js";
import AdminRoles from "./components/Admin/AdminRoles.js";
import AdminRequests from "./components/Admin/AdminRequests.js";
import EmployeeAssets from "./components/Employee/EmployeeAssets.js";
import EmployeeStatus from "./components/Employee/EmployeeStatus.js";
import EmployeeReport from "./components/Employee/EmployeeReport.js";
import EmployeeHistory from "./components/Employee/EmployeeHistory.js";
import ProtectedRoute from "./components/ProtectedRoute.js";
import PublicRoute from "./components/PublicRoute.js";
import DashboardLayout from "./components/DashboardLayout.js";
import PermissionRoute from "./components/PermissionRoute.js";

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
            <Route element={<PermissionRoute permission={["assign_asset", "view_asset"]} />}>
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

        {/* Catch-all: send to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
