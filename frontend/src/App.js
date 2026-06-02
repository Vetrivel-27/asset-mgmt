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
import EmployeeLayout from "./components/Employee/EmployeeLayout.js";
import EmployeeAssets from "./components/Employee/EmployeeAssets.js";
import EmployeeStatus from "./components/Employee/EmployeeStatus.js";
import EmployeeReport from "./components/Employee/EmployeeReport.js";
import EmployeeHistory from "./components/Employee/EmployeeHistory.js";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LogIn />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="assets" element={<AdminAssets />} />
          <Route path="employees" element={<AdminEmployees />} />
          <Route path="assignments" element={<AdminAssignments />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>
        <Route path="/employee" element={<EmployeeLayout />}>
          <Route index element={<EmployeeAssets />} />
          <Route path="status" element={<EmployeeStatus />} />
          <Route path="report" element={<EmployeeReport />} />
          <Route path="history" element={<EmployeeHistory />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
