import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

function LogIn({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Invalid email or password");

      const roleName = data.user?.roleName?.toLowerCase();
      if (!roleName) throw new Error("Login response did not include a role.");

      sessionStorage.setItem("authToken", data.token);
      sessionStorage.setItem("userRole", roleName);
      sessionStorage.setItem("userEmail", data.user.email);
      sessionStorage.setItem("userPermissions", JSON.stringify(data.user.permissions || []));
      sessionStorage.setItem("userName", data.user.userId || data.user.email || "User");
      if (roleName !== "admin") sessionStorage.setItem("employeeEmail", data.user.email);

      navigate("/dashboard");
      if (onLogin) onLogin({ ...data.user, role: roleName, token: data.token });
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z",
      label: "Asset Inventory",
      desc: "Track every asset across your organisation in real-time",
    },
    {
      icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
      label: "Team Management",
      desc: "Register employees and assign roles with granular permissions",
    },
    {
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      label: "Reports & Analytics",
      desc: "Damage reports, assignment history, and usage analytics",
    },
  ];

  return (
    <div className="min-h-screen flex">

      {/* ── Left dark branding panel ──────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[460px] flex-shrink-0 p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(150deg, #0f172a 0%, #1e293b 55%, #0f172a 100%)" }}
      >
        {/* Ambient glow orbs */}
        <div
          className="absolute top-16 left-8 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(250,204,21,0.12) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-24 right-4 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)" }}
        />

        {/* Brand */}
        <div className="relative">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400"
              style={{ boxShadow: "0 8px 24px rgba(250,204,21,0.35)" }}
            >
              <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"/>
              </svg>
            </div>
            <span className="text-white font-bold text-xl tracking-wide">AMS</span>
          </div>

          {/* Hero text */}
          <div className="mt-14">
            <h2 className="text-4xl font-black text-white leading-[1.15]">
              Manage assets,<br />
              <span style={{
                background: "linear-gradient(135deg, #facc15 0%, #f59e0b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                effortlessly.
              </span>
            </h2>
            <p className="mt-5 text-slate-400 text-sm leading-relaxed max-w-xs">
              A unified platform for tracking inventory, managing employees, and generating reports — all in one place.
            </p>
          </div>

          {/* Feature list */}
          <div className="mt-10 space-y-5">
            {features.map((f) => (
              <div key={f.label} className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    {f.icon.split("M").filter(Boolean).map((seg, i) => (
                      <path key={i} strokeLinecap="round" strokeLinejoin="round" d={"M" + seg.trim()} />
                    ))}
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative text-xs text-slate-600">© 2026 AMS · All rights reserved.</p>
      </div>

      {/* ── Right form panel ──────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-sm animate-slide-up">

          {/* Mobile brand */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400">
              <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
              </svg>
            </div>
            <span className="text-slate-900 font-bold text-lg">AMS</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
          <p className="mt-1.5 text-sm text-slate-500">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                Email address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Password
                </label>
                <a href="/forgot-password" className="text-xs font-semibold text-yellow-600 hover:text-yellow-700 transition">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-16 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute inset-y-0 right-3.5 flex items-center text-xs font-semibold text-slate-400 hover:text-slate-700 transition"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 animate-fade-in">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-yellow-400 py-3.5 text-sm font-bold text-slate-900 shadow-md transition-all duration-200 hover:bg-yellow-300 hover:shadow-yellow-400/30 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in…
                </span>
              ) : "Sign In →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LogIn;
