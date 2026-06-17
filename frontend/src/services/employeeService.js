import { api } from "./api";

export const employeeService = {
  getAll: () => api.get("/api/employees"),
  create: (employeeData) => api.post("/api/employees", employeeData),
  update: (id, employeeData) => api.put(`/api/employees/${id}`, employeeData),
  delete: (id) => api.delete(`/api/employees/${id}`),
  getRoles: () => api.get("/api/roles"),
};
