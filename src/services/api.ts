import axios from 'axios';

// Get base URL considering local dev or production
export const api = axios.create({
  baseURL: window.location.origin,
});

// Interceptor to add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle unauthenticated sessions safely
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Avoid redirect loops by only redirecting if we are not already on login
      if (window.location.pathname !== '/admin/login' && window.location.pathname.startsWith('/admin')) {
        localStorage.removeItem('token');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);
