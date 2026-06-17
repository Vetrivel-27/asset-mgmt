import { useEffect, useState } from "react";
import { authService } from "../../services/authService";

/**
 * User Profile modal — displays and edits name, email, department, password.
 * Supports Escape key and click-outside-to-close.
 * Extracted from DashboardLayout.js — no logic or design changes.
 */
export default function ProfileModal({ isOpen, onClose, onUpdate }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setSuccess("");
    setPassword("");
    setConfirmPassword("");
    
    authService.getProfile()
      .then((data) => {
        setName(data.name || data.userId?.displayName || "");
        setDepartment(data.department || "");
        setEmployeeId(data.employeeId || "");
        if (data.userId) {
          setEmail(data.userId.email || "");
          setRole(data.userId.role?.name || "");
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load profile details.");
      });
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (password && password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const body = { name, email, department, password };
      const data = await authService.updateProfile(body);
      
      setSuccess("Profile updated successfully!");
      onUpdate({
        name: data.name || data.userId?.displayName || "User",
        role: data.userId?.role?.name || "",
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div 
        className="w-full max-w-md rounded-[32px] bg-white shadow-2xl border border-slate-100 overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-bold text-slate-900">User Profile</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl bg-green-50 border border-green-100 p-3 text-xs text-green-600">
              {success}
            </div>
          )}

          {/* Employee ID & Role (Read-only) */}
          <div className={`grid gap-3 ${employeeId ? "grid-cols-2" : "grid-cols-1"}`}>
            {employeeId && (
              <div>
                <label className="text-xs font-semibold text-slate-500">Employee ID</label>
                <div className="mt-1.5 w-full rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200">
                  {employeeId}
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-slate-500">Role</label>
              <div className="mt-1.5 w-full rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 capitalize border border-slate-200">
                {role || "—"}
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="text-xs font-semibold text-slate-500">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-slate-500">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
            />
          </div>

          {/* Department */}
          <div>
            <label className="text-xs font-semibold text-slate-500">Department</label>
            <input
              type="text"
              required
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={loading}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
            />
          </div>

          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Change Password (Optional)</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Min 6 characters"
                  className="mt-1.5 w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Repeat new password"
                  className="mt-1.5 w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-2xl bg-yellow-400 py-3 text-sm font-bold text-slate-900 transition hover:bg-yellow-500 shadow-sm disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
