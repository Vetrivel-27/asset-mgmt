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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-slate-100 via-yellow-50 to-slate-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-300 px-8 py-12 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-white shadow-lg mb-4">
              <svg
                className="h-8 w-8 text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Reset Password
            </h1>
            <p className="text-sm text-slate-700 mt-2">
              {step === "email" && "Enter your email to receive an OTP"}
              {step === "otp" && "Enter the OTP sent to your email"}
              {step === "reset" && "Create your new password"}
            </p>
          </div>

          <div className="px-8 py-10">
            {!token && (
              <div className="flex justify-between mb-8">
                <div
                  className={`flex-1 h-1 rounded-full ${
                    step === "email" || step === "otp" || step === "reset"
                      ? "bg-yellow-400"
                      : "bg-slate-200"
                  }`}
                />
                <div
                  className={`flex-1 h-1 rounded-full mx-2 ${
                    step === "otp" || step === "reset"
                      ? "bg-yellow-400"
                      : "bg-slate-200"
                  }`}
                />
                <div
                  className={`flex-1 h-1 rounded-full ${
                    step === "reset" ? "bg-yellow-400" : "bg-slate-200"
                  }`}
                />
              </div>
            )}

            {step === "email" && (
              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <label className="block">
                  <span className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                  />
                </label>
                {error && (
                  <div className="p-3 rounded-2xl bg-red-50 text-red-700 text-sm">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="p-3 rounded-2xl bg-green-50 text-green-700 text-sm">
                    {message}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-300 text-slate-900 font-semibold py-3 rounded-2xl hover:from-yellow-500 hover:to-yellow-400 transition disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={handleOtpSubmit} className="space-y-5">
                <label className="block">
                  <span className="block text-sm font-medium text-slate-700 mb-2">
                    Enter OTP
                  </span>
                  <input
                    type="text"
                    value={otp}
                    onChange={(event) =>
                      setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    maxLength="6"
                    required
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-center text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 tracking-widest font-mono text-2xl"
                  />
                </label>
                {error && (
                  <div className="p-3 rounded-2xl bg-red-50 text-red-700 text-sm">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="p-3 rounded-2xl bg-green-50 text-green-700 text-sm">
                    {message}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-300 text-slate-900 font-semibold py-3 rounded-2xl hover:from-yellow-500 hover:to-yellow-400 transition disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
              </form>
            )}

            {step === "reset" && (
              <form onSubmit={handleResetSubmit} className="space-y-5">
                <label className="block">
                  <span className="block text-sm font-medium text-slate-700 mb-2">
                    New Password
                  </span>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Enter new password"
                      required
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-20 text-sm text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-4 top-3 text-sm font-semibold text-slate-600 hover:text-slate-900"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>

                <label className="block">
                  <span className="block text-sm font-medium text-slate-700 mb-2">
                    Confirm Password
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Confirm new password"
                    required
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                  />
                </label>

                {error && (
                  <div className="p-3 rounded-2xl bg-red-50 text-red-700 text-sm">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="p-3 rounded-2xl bg-green-50 text-green-700 text-sm">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-300 text-slate-900 font-semibold py-3 rounded-2xl hover:from-yellow-500 hover:to-yellow-400 transition disabled:opacity-50"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            )}

            <button
              onClick={() => navigate("/login")}
              className="w-full mt-6 text-slate-600 hover:text-slate-900 text-sm font-medium"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
