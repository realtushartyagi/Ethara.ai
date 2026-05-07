import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to include token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Add response interceptor for 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        // Avoid infinite redirect loop if already on login page
        if (!window.location.pathname.includes('/auth/login')) {
          import('sonner').then(({ toast }) => {
            toast.error('Session expired. Please login again.');
          });
          window.location.href = '/auth/login?expired=true';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
