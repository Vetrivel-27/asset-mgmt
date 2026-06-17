/**
 * Centralized HTTP client for all API communication.
 * Reads base URL from config.js and automatically attaches auth headers.
 *
 * @module api/client
 */
import { API_URL } from "../config";

const getAuthHeaders = () => {
  const token = sessionStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || "An API error occurred");
  }
  return data;
};

export const api = {
  get: async (endpoint) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  post: async (endpoint, body) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  postForm: async (endpoint, formData) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });
    return handleResponse(res);
  },
  put: async (endpoint, body) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  delete: async (endpoint) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};
