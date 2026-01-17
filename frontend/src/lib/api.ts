import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080/api/v1",
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith("/login")) {
      // Biarkan ProtectedRoute / AuthProvider menangani state login.
      // Redirect manual hanya jika user berada di luar halaman login.
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
