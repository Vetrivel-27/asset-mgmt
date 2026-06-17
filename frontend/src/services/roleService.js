import { api } from "./api";

export const roleService = {
  getAll: () => api.get("/api/roles"),
  getPermissions: () => api.get("/api/roles/permissions"),
  create: (roleData) => api.post("/api/roles", roleData),
  update: (id, roleData) => api.put(`/api/roles/${id}`, roleData),
  delete: (id) => api.delete(`/api/roles/${id}`),
};
