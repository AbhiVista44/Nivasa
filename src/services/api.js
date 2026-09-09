import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token and active society ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nivasa_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const societyId = localStorage.getItem('nivasa_society_id');
    if (societyId) {
      config.headers['x-society-id'] = societyId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthenticated sessions
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Session expired or unauthorized.');
    }
    return Promise.reject(error);
  }
);

export default api;
