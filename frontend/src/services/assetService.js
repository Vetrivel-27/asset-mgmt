import { api } from "./api";

export const assetService = {
  getAll: () => api.get("/api/assets"),
  getAvailable: () => api.get("/api/assets?status=available"),
  getCategories: () => api.get("/api/assets/categories"),
  create: (assetData) => api.post("/api/assets", assetData),
  update: (id, assetData) => api.put(`/api/assets/${id}`, assetData),
  delete: (id) => api.delete(`/api/assets/${id}`),
};
