import { api } from "./api";

export const reportService = {
  getAll: () => api.get("/api/reports"),
  getMyReports: () => api.get("/api/reports/my-reports"),
  create: (reportData) => api.post("/api/reports", reportData),
  updateStatus: (id, statusData) => api.put(`/api/reports/${id}/status`, statusData),
  delete: (id) => api.delete(`/api/reports/${id}`),
};
