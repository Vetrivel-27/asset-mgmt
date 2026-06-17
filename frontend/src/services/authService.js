import { api } from "./api";

export const authService = {
  login: (email, password) => api.post("/api/auth/login", { email, password }),
  logout: () => api.post("/api/auth/logout", {}),
  refresh: () => api.post("/api/auth/refresh", {}),
  forgotPassword: (email) => api.post("/api/auth/forgot-password", { email }),
  verifyResetOtp: (email, otp) => api.post("/api/auth/verify-reset-otp", { email, otp }),
  resetPasswordOtp: (email, otp, password) => api.post("/api/auth/reset-password-otp", { email, otp, password }),
  resetPassword: (token, password) => api.put(`/api/auth/reset-password/${token}`, { password }),
  getProfile: () => api.get("/api/employees/me"),
  updateProfile: (profileData) => api.put("/api/employees/me", profileData),
};
