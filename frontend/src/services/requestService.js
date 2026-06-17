import { api } from "./api";

export const requestService = {
  getAll: () => api.get("/api/requests"),
  getMyRequests: () => api.get("/api/requests/my-requests"),
  create: (requestData) => api.post("/api/requests", requestData),
  updateStatus: (id, status, details) => api.put(`/api/requests/${id}/status`, { status, ...details }),
  delete: (id) => api.delete(`/api/requests/${id}`),
};
