import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { authService } from "../../services/authService";

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
      await authService.forgotPassword(email);
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

      await authService.verifyResetOtp(email, otp);
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
        await authService.resetPassword(token, newPassword);
      } else {
        await authService.resetPasswordOtp(email, otp, newPassword);
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
      </div>

      {/* ── Right form panel ──────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-yellow-400 px-6 py-12">
        <div className="w-full max-w-sm bg-slate-100 rounded-tl-[150px] rounded-br-[150px] rounded-tr-none rounded-bl-none px-6 py-5 pb-6 shadow-[0_20px_50px_rgba(0,0,0,0.18)] animate-slide-up">
          <div className="flex flex-col items-center w-full mt-4 mb-2">
            <img src="/esab-logo.png" alt="logo" className="h-16 w-auto mb-4" />
            
            <h1 className="text-2xl font-semibold text-slate-900 text-center">
              Reset Password
            </h1>
            <p className="mt-1 text-sm text-slate-500 text-center max-w-[260px]">
              {step === "email" && "Enter your email to receive an OTP"}
              {step === "otp" && "Enter the OTP sent to your email"}
              {step === "reset" && "Create your new password"}
            </p>

            <div className="mt-5 flex flex-col items-center w-full">
              <div className="w-[275px] space-y-5">
                {/* Steps indicator */}
                {!token && (
                  <div className="flex justify-between px-2 mb-2">
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
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 ml-2 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                      />
                    </div>
                    {error && (
                      <div className="p-3 rounded-2xl bg-red-50 text-red-700 text-xs border border-red-100">
                        {error}
                      </div>
                    )}
                    {message && (
                      <div className="p-3 rounded-2xl bg-green-50 text-green-700 text-xs border border-green-100">
                        {message}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#ffe200] hover:bg-[#f4d400] text-slate-900 font-semibold py-3 rounded-2xl transition disabled:opacity-50 text-sm shadow-sm"
                    >
                      {loading ? "Sending..." : "Send OTP"}
                    </button>
                  </form>
                )}

                {step === "otp" && (
                  <form onSubmit={handleOtpSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 ml-2 mb-1.5">
                        Enter OTP
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
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-center text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 tracking-widest font-mono text-xl"
                      />
                    </div>
                    {error && (
                      <div className="p-3 rounded-2xl bg-red-50 text-red-700 text-xs border border-red-100">
                        {error}
                      </div>
                    )}
                    {message && (
                      <div className="p-3 rounded-2xl bg-green-50 text-green-700 text-xs border border-green-100">
                        {message}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#ffe200] hover:bg-[#f4d400] text-slate-900 font-semibold py-3 rounded-2xl transition disabled:opacity-50 text-sm shadow-sm"
                    >
                      {loading ? "Verifying..." : "Verify OTP"}
                    </button>
                  </form>
                )}

                {step === "reset" && (
                  <form onSubmit={handleResetSubmit} className="space-y-4">
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
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-16 text-sm text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute right-4 top-3 text-sm font-semibold text-slate-600 hover:text-slate-900"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 ml-2 mb-1.5">
                        Confirm Password
                      </label>
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
                    </div>

                    {error && (
                      <div className="p-3 rounded-2xl bg-red-50 text-red-700 text-xs border border-red-100">
                        {error}
                      </div>
                    )}
                    {message && (
                      <div className="p-3 rounded-2xl bg-green-50 text-green-700 text-xs border border-green-100">
                        {message}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#ffe200] hover:bg-[#f4d400] text-slate-900 font-semibold py-3 rounded-2xl transition disabled:opacity-50 text-sm shadow-sm"
                    >
                      {loading ? "Resetting..." : "Reset Password"}
                    </button>
                  </form>
                )}

                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => navigate("/login")}
                    className="text-sm font-semibold text-[#0066cc] hover:text-blue-700 transition-colors"
                  >
                    Back to Login
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
