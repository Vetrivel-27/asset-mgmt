import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL } from "../config";

function ForgotPassword() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(token ? "reset" : "email");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requestJson = async (path, options) => {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || data.error || "Request failed");
    }

    return data;
  };

  const validatePassword = () => {
    if (!newPassword || !confirmPassword) {
      throw new Error("Please fill in all fields");
    }
    if (newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
    if (newPassword !== confirmPassword) {
      throw new Error("Passwords do not match");
    }
  };

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await requestJson("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setMessage("OTP sent to your email.");
      setStep("otp");
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (otp.length !== 6) {
        throw new Error("OTP must be 6 digits");
      }

      await requestJson("/api/auth/verify-reset-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      });
      setMessage("OTP verified. Create your new password.");
      setStep("reset");
    } catch (err) {
      setError(err.message || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      validatePassword();

      if (token) {
        await requestJson(`/api/auth/reset-password/${token}`, {
          method: "PUT",
          body: JSON.stringify({ password: newPassword }),
        });
      } else {
        await requestJson("/api/auth/reset-password-otp", {
          method: "POST",
          body: JSON.stringify({ email, otp, password: newPassword }),
        });
      }

      setMessage("Password reset successfully.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message || "Failed to reset password");
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
              Secure your account,<br />
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
      <div className="flex-1 flex items-center justify-center bg-yellow-400 px-6 py-12">
        <div className="w-full max-w-sm bg-slate-100 rounded-tl-[150px] rounded-br-[150px] rounded-tr-none rounded-bl-none px-6 py-5 pb-6 shadow-[0_20px_50px_rgba(0,0,0,0.18)] animate-slide-up">
          <div className="flex flex-col items-center w-full mt-4 mb-2">
            
            <img src="/esab-logo.png" alt="logo" className="h-16 w-auto mb-6" />
            
            <h1 className="text-3xl font-semibold text-slate-900 text-center">
              Reset Password
            </h1>
            <p className="mt-1 text-sm text-slate-500 text-center">
              {step === "email" && "Enter your email for a recovery code"}
              {step === "otp" && "Enter the 6-digit code sent to your email"}
              {step === "reset" && "Create a new, secure password"}
            </p>

            {!token && (
              <div className="flex justify-center gap-2 mt-6 px-8">
                <div
                  className={`w-8 h-1 rounded-full ${
                    step === "email" || step === "otp" || step === "reset"
                      ? "bg-yellow-400"
                      : "bg-slate-200"
                  } transition-colors duration-300`}
                />
                <div
                  className={`w-8 h-1 rounded-full ${
                    step === "otp" || step === "reset"
                      ? "bg-yellow-400"
                      : "bg-slate-200"
                  } transition-colors duration-300`}
                />
                <div
                  className={`w-8 h-1 rounded-full ${
                    step === "reset" ? "bg-yellow-400" : "bg-slate-200"
                  } transition-colors duration-300`}
                />
              </div>
            )}

            <div className="mt-8 flex flex-col items-center w-full">
              <div className="w-[275px]">
                {step === "email" && (
                  <form onSubmit={handleEmailSubmit} className="space-y-5">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-700 ml-2 mb-1.5">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="Enter your email"
                        required
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                      />
                    </div>

                    {error && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                      </div>
                    )}
                    {message && (
                      <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {message}
                      </div>
                    )}

                    <div className="flex w-full justify-center pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-[150px] rounded-2xl bg-[#ffe200] px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-[#f4d400] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {loading ? "Sending..." : "Send Code"}
                      </button>
                    </div>
                  </form>
                )}

                {step === "otp" && (
                  <form onSubmit={handleOtpSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 ml-2 mb-1.5">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(event) =>
                          setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        placeholder="000000"
                        maxLength="6"
                        required
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-xl font-mono tracking-[0.5em] text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                      />
                    </div>

                    {error && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                      </div>
                    )}
                    {message && (
                      <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {message}
                      </div>
                    )}

                    <div className="flex w-full justify-center pt-2">
                      <button
                        type="submit"
                        disabled={loading || otp.length !== 6}
                        className="w-[150px] rounded-2xl bg-[#ffe200] px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-[#f4d400] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {loading ? "Verifying..." : "Verify Code"}
                      </button>
                    </div>
                  </form>
                )}

                {step === "reset" && (
                  <form onSubmit={handleResetSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 ml-2 mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(event) => setNewPassword(event.target.value)}
                          placeholder="Enter new password"
                          required
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-16 text-sm text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute inset-y-0 right-4 flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 ml-2 mb-1.5">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          placeholder="Confirm new password"
                          required
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-16 text-sm text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                      </div>
                    )}
                    {message && (
                      <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {message}
                      </div>
                    )}

                    <div className="flex w-full justify-center pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-[150px] rounded-2xl bg-[#ffe200] px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-[#f4d400] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {loading ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                  </form>
                )}

                <div className="mt-8 text-center">
                  <button
                    onClick={() => navigate("/login")}
                    className="text-sm font-medium text-[#0066cc] hover:text-blue-700 transition-colors"
                  >
                    Return to Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
