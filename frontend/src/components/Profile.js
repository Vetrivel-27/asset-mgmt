import { useState, useEffect } from "react";
import { API_URL } from "../config";

function Profile() {
  const token = sessionStorage.getItem("authToken");

  const [profile, setProfile] = useState({ name: "", email: "", role: "" });
  const [form, setForm] = useState({ name: "", email: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [pwMessage, setPwMessage] = useState({ type: "", text: "" });
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/employees/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          const name = data.name || "";
          const email = data.userId?.email || "";
          const role = data.userId?.role?.name || sessionStorage.getItem("userRole") || "";
          setProfile({ name, email, role });
          setForm({ name, email });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setFetching(false);
      }
    }
    load();
  }, [token]);

  const initials = profile.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleProfileSave(e) {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await fetch(`${API_URL}/api/employees/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: form.name, email: form.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Failed to update");
      setProfile((p) => ({ ...p, name: form.name, email: form.email }));
      sessionStorage.setItem("userName", form.name);
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    setPwLoading(true);
    setPwMessage({ type: "", text: "" });
    try {
      const res = await fetch(`${API_URL}/api/employees/me/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Failed to update password");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPwMessage({ type: "success", text: "Password changed successfully." });
    } catch (err) {
      setPwMessage({ type: "error", text: err.message });
    } finally {
      setPwLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-page-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your personal details and password.</p>
      </div>

      {/* Avatar + role card */}
      <div className="flex items-center gap-5 rounded-2xl bg-white border border-slate-200 px-6 py-5 shadow-sm">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 text-xl font-bold text-slate-900 shadow-md shadow-yellow-400/30">
          {initials || "U"}
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-900">{profile.name || "—"}</p>
          <p className="text-sm text-slate-500">{profile.email || "—"}</p>
          <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-yellow-800">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
            {profile.role || "user"}
          </span>
        </div>
      </div>

      {/* Edit profile form */}
      <div className="rounded-2xl bg-white border border-slate-200 px-6 py-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-5">Personal Information</h2>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Enter your full name"
                required
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Enter your email"
                required
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-200"
              />
            </div>
          </div>

          {message.text && (
            <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              message.type === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-yellow-400 px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-yellow-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Change password form */}
      <div className="rounded-2xl bg-white border border-slate-200 px-6 py-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-1">Change Password</h2>
        <p className="text-xs text-slate-500 mb-5">Use a strong password you don't use elsewhere.</p>
        <form onSubmit={handlePasswordSave} className="space-y-4">
          {[
            { key: "current", label: "Current Password", field: "currentPassword" },
            { key: "new", label: "New Password", field: "newPassword" },
            { key: "confirm", label: "Confirm New Password", field: "confirmPassword" },
          ].map(({ key, label, field }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={showPw[key] ? "text" : "password"}
                  value={pwForm[field]}
                  onChange={(e) => setPwForm((f) => ({ ...f, [field]: e.target.value }))}
                  placeholder={`Enter ${label.toLowerCase()}`}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 pr-16 text-sm text-slate-900 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => ({ ...s, [key]: !s[key] }))}
                  className="absolute inset-y-0 right-4 flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                  {showPw[key] ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          ))}

          {pwMessage.text && (
            <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              pwMessage.type === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}>
              {pwMessage.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pwLoading}
              className="rounded-xl bg-yellow-400 px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-yellow-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {pwLoading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Profile;
