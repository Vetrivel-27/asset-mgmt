import { api } from "./api";

export const assignmentService = {
  getAll: () => api.get("/api/assignments"),
  create: (assignmentData) => api.post("/api/assignments/assign", assignmentData),
  returnAsset: (id, condition) => api.put(`/api/assignments/return/${id}`, { condition }),
  getMyAssignments: () => api.get("/api/assignments/my-assignments"),
};
