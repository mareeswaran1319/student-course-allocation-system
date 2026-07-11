import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token automatically to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error || err.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export const studentAPI = {
  getAll: () => API.get('/students'),
  getById: (id) => API.get(`/students/${id}`),
  create: (data) => API.post('/students', data),
  update: (id, data) => API.put(`/students/${id}`, data),
  delete: (id) => API.delete(`/students/${id}`),
};

export const courseAPI = {
  getAll: () => API.get('/courses'),
  getById: (id) => API.get(`/courses/${id}`),
  create: (data) => API.post('/courses', data),
  update: (id, data) => API.put(`/courses/${id}`, data),
  delete: (id) => API.delete(`/courses/${id}`),
};

export const allocationAPI = {
  run: () => API.post('/allocations/run'),
  getAll: () => API.get('/allocations'),
  getStats: () => API.get('/allocations/stats'),
  reset: () => API.delete('/allocations/reset'),
};

export const aiAPI = {
  query: (question) => API.post('/ai/query', { question }),
};

export const authAPI = {
  login: (username, password) => API.post('/auth/login', { username, password }),
  changePassword: (currentPassword, newPassword) =>
    API.put('/auth/change-password', { currentPassword, newPassword }),
  verify: () => API.get('/auth/verify'),
};

export default API;

