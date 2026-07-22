import axios from 'axios';

// Create an axios instance with base URL
const api = axios.create({
  baseURL: '/api', // Proxy to backend
});

// Add a request interceptor to include token if needed (not implemented yet)
api.interceptors.request.use(
  (config) => {
    // Add auth token here
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;