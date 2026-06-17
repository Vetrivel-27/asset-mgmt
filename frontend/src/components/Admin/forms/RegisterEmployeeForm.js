import { useEffect, useState } from "react";
import { employeeService } from "../../../services/employeeService";
import Button from "../../ui/Button";

/**
 * Quick-action form for registering a new user/employee from the Admin Dashboard.
 * Supports both "User Only" and "User + Employee" creation modes.
 * Extracted from AdminDashboard.js — no logic or design changes.
 */
export default function RegisterEmployeeForm({ roles, dbDepartments = [], onSuccess, onCancel }) {
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [customDepartment, setCustomDepartment] = useState("");
  const [roleId, setRoleId] = useState("");
  const [isEmployee, setIsEmployee] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalDepartment = department === "CUSTOM" ? customDepartment.trim() : department.trim();
    if (!name.trim() || !email.trim() || !roleId) {
      setError("Name, email, and role are required."); return;
    }
    if (isEmployee && (!employeeId.trim() || !finalDepartment)) {
      setError("ID and department are required for an employee."); return;
    }
    setSubmitting(true); setError("");
    try {
      const data = await employeeService.create({ 
        name: name.trim(), 
        employeeId: isEmployee ? employeeId.trim() : undefined, 
        email: email.trim(), 
        department: isEmployee ? finalDepartment : undefined, 
        roleId,
        isEmployee
      });
      
      // Reset form states
      setName("");
      setEmployeeId("");
      setEmail("");
      setDepartment("");
      setCustomDepartment("");
      setRoleId("");

      onSuccess(`Employee "${data.name || name}" registered! A welcome email has been sent.`);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleCancel = () => {
    setName("");
    setEmployeeId("");
    setEmail("");
    setDepartment("");
    setCustomDepartment("");
    setRoleId("");
    setError("");
    onCancel();
  };

  const inputCls = "w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100";
  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      
      <div className="flex gap-4 p-1 bg-slate-100 rounded-xl mb-1 w-fit">
        <button
          type="button"
          onClick={() => setIsEmployee(false)}
          className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
            !isEmployee ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Create User Only
        </button>
        <button
          type="button"
          onClick={() => setIsEmployee(true)}
          className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
            isEmployee ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Create Employee Profile
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Full Name</span>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" disabled={submitting} className={`mt-1 ${inputCls}`} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Email</span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@company.com" disabled={submitting} className={`mt-1 ${inputCls}`} />
        </label>
        
        {isEmployee && (
          <>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">User ID</span>
              <input value={employeeId} onChange={e => setEmployeeId(e.target.value)} placeholder="EMP-042" disabled={submitting} className={`mt-1 ${inputCls}`} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Department</span>
              <select value={department} onChange={e => setDepartment(e.target.value)} disabled={submitting} className={`mt-1 ${inputCls}`}>
                <option value="">Select Department</option>
                {dbDepartments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                <option value="CUSTOM">Custom department...</option>
              </select>
              {department === "CUSTOM" && (
                <input value={customDepartment} onChange={e => setCustomDepartment(e.target.value)} placeholder="e.g. Data Science" disabled={submitting} className={`mt-2 ${inputCls}`} />
              )}
            </label>
          </>
        )}

        <label className={isEmployee ? "block sm:col-span-2" : "block"}>
          <span className="text-xs font-medium text-slate-600">Role</span>
          <select value={roleId} onChange={e => setRoleId(e.target.value)} disabled={submitting} className={`mt-1 ${inputCls}`}>
            <option value="">Select Role</option>
            {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
        </label>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={submitting} variant="primary" size="sm" className="!bg-slate-900 !text-white hover:!bg-slate-800">
          Register User
        </Button>
        <Button type="button" variant="subtle" onClick={handleCancel} disabled={submitting} size="sm">
          Cancel
        </Button>
      </div>
    </form>
  );
}
