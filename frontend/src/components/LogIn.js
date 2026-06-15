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

      // Defensively extract role — fall back to 'employee' if absent
      const roleName = (data.user?.roleName || data.user?.role?.name || "employee").toLowerCase();
      const permissions = Array.isArray(data.user?.permissions) ? data.user.permissions : [];

      sessionStorage.setItem("authToken", data.token);
      sessionStorage.setItem("userRole", roleName);
      sessionStorage.setItem("userEmail", data.user.email);
      sessionStorage.setItem("userPermissions", JSON.stringify(permissions));
      sessionStorage.setItem("userName", data.user.name || data.user.userId || data.user.email || "User");
      sessionStorage.setItem("userId", data.user.id || "");
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
        

        {/* Center Hero text */}
        <div className="flex-1 flex flex-col justify-center items-center text-center relative z-10">
          <h2 className="text-4xl font-black text-white leading-[1.15]">
            Shaping the world,<br /> We Imagine. <br />
            <span style={{
              background: "linear-gradient(135deg, #facc15 0%, #f59e0b 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Without Limits.
            </span>
          </h2>
        </div>

        {/* Spacer to balance the top brand spacing */}
        <div className="h-10 invisible" />

        {/* Footer */}
      </div>

      {/* ── Right form panel ──────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-yellow-400 px-6 py-12">
        <div className="w-full max-w-sm bg-slate-100 rounded-tl-[150px] rounded-br-[150px] rounded-tr-none rounded-bl-none px-6 py-5 pb-6 shadow-[0_20px_50px_rgba(0,0,0,0.18)] animate-slide-up">
          <div className="flex flex-col items-center w-full mt-4 mb-2">
            
            <img src="/esab-logo.png" alt="logo" className="h-16 w-auto mb-4" />
            
            <h1 className="text-2xl font-semibold text-slate-900 text-center">
              Login Page
            </h1>
            <p className="mt-1 text-sm text-slate-500 text-center">
              Welcome
            </p>

            <form onSubmit={handleSubmit} className="mt-5 flex flex-col items-center w-full">
              <div className="w-[275px] space-y-5">
                
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 ml-2 mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 ml-2 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-16 text-sm text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-4 flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="flex justify-end mt-1.5">
                    <a
                      href="/forgot-password"
                      className="text-sm font-medium text-[#0066cc] hover:text-blue-700 transition-colors"
                    >
                      Forgot password?
                    </a>
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex w-full justify-center pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-[150px] rounded-2xl bg-[#ffe200] px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-[#f4d400] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? "Logging in..." : "Log In"}
                  </button>
                </div>

              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LogIn;
