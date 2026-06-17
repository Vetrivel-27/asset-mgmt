import { api } from "./api";

export const bulkUploadService = {
  upload: (formData) => api.postForm("/api/bulk-upload", formData),
};
