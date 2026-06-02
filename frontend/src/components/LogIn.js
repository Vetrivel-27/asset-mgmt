import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LogIn({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const ADMIN_EMAIL = "admin@gmail.com";
  const ADMIN_PASSWORD = "admin123";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      // const payload = { email, password };
      // TODO: call your login API
      // const data = await authService.login(payload);
      // onLogin(data);
      const EMPLOYEE_EMAIL = "employee@gmail.com";
      const EMPLOYEE_PASSWORD = "emp123";

      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        localStorage.setItem("userRole", "admin");
        localStorage.setItem("userEmail", email);
        navigate("/admin");
        if (onLogin) onLogin({ email, role: "admin" });
      } else if (email === EMPLOYEE_EMAIL && password === EMPLOYEE_PASSWORD) {
        localStorage.setItem("userRole", "employee");
        localStorage.setItem("userEmail", email);
        localStorage.setItem("employeeEmail", email);
        navigate("/employee");
        if (onLogin) onLogin({ email, role: "employee" });
      } else {
        setError("Invalid email or password");
      }
    } catch (err) {
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-[#d9dddc]">
      <div className="w-full max-w-md bg-white rounded-tl-[150px] rounded-br-[150px] rounded-tr-none rounded-bl-none px-8 py-10 pb-24 shadow-[0_24px_60px_rgba(0,0,0,0.18)] ">
        <div className="flex justify-center mb-6">
          <img src="/logo192.png" alt="logo" className="h-16 w-auto" />
        </div>

        <h1 className="text-3xl font-semibold text-center text-slate-900">
          Login Page
        </h1>

        <p className="mt-4 text-sm leading-7 text-slate-600 text-center">
          Welcome
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <div className="relative mt-2">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-24 text-sm text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-slate-600"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <a
              href="/forgot-password"
              className="text-sm font-medium text-[#0066cc] hover:text-blue-700"
            >
              Forgot password?
            </a>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#ffe200] px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-[#f4d400] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        {/* <div className="mt-6 flex flex-col items-center gap-1 text-sm text-slate-600 ">
          <span>Don't have an All-Access Account?</span>
          <a
            href="/signup"
            className="font-semibold text-[#0066cc] hover:text-blue-700"
          >
            Sign Up
          </a>
        </div> */}

        {/* <div className="mt-8 border-t border-slate-200 pt-6 text-center text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Online Users</p>
          <p className="mt-2">hello</p>
        </div> */}
      </div>
    </div>
  );
}

export default LogIn;
