import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined ? import.meta.env.VITE_API_BASE_URL : '';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 45000,
});

// Attach JWT token to requests if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('paryavaran_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired
      localStorage.removeItem('paryavaran_token');
      localStorage.removeItem('paryavaran_user');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  sendOTP: (data) => api.post('/auth/send-otp', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  register: (data) => api.post('/auth/register', data),
  verifyEmail: (data) => api.post('/auth/verify-otp', data),
  resendOTP: (data) => api.post('/auth/send-otp', data),
  login: (data) => api.post('/auth/login', data),
  adminLoginStep1: (data) => api.post('/auth/admin/login', data),
  adminLoginStep2: (data) => api.post('/auth/admin/verify-otp', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (email, otp, newPassword) => api.post('/auth/reset-password', { email, otp, new_password: newPassword }),
  getUsers: (params = {}) => api.get('/auth/users', { params }),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
  updateProfile: (data) => api.put('/auth/profile', data),
  getMe: () => api.get('/auth/me'),
};

export const eventAPI = {
  getAll: (params = {}) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  getMyRegistrations: () => api.get('/events/my/registrations'),
  register: (id, data = {}) => api.post(`/events/${id}/register`, data),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  getParticipants: (id) => api.get(`/events/${id}/participants`),
};

export const blogAPI = {
  getPublished: (params = {}) => api.get('/blogs', { params }),
  getById: (id) => api.get(`/blogs/${id}`),
  getAllAdmin: () => api.get('/blogs/admin/all'),
  create: (data) => api.post('/blogs', data),
  update: (id, data) => api.put(`/blogs/${id}`, data),
  delete: (id) => api.delete(`/blogs/${id}`),
};

export const newsletterAPI = {
  subscribe: (data) => api.post('/newsletter/subscribe', data),
  unsubscribe: (email) => api.post('/newsletter/unsubscribe', { email }),
  getSubscribers: () => api.get('/newsletter/subscribers'),
  deleteSubscriber: (id) => api.delete(`/newsletter/subscribers/${id}`),
  broadcast: (data) => api.post('/newsletter/broadcast', data),
};

export const wasteAPI = {
  predict: (formData) => api.post('/waste/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getHistory: (limit = 50) => api.get(`/waste/history?limit=${limit}`),
  clearHistory: () => api.delete('/waste/history'),
  deleteItem: (id) => api.delete(`/waste/history/${id}`),
};

export const binAPI = {
  getAll: (params = {}) => api.get('/bins', { params }),
  getById: (id) => api.get(`/bins/${id}`),
  getCollectors: () => api.get('/bins/collectors'),
  assignCollector: (binId, data) => api.post(`/bins/${binId}/assign`, data),
  simulateUpdate: () => api.post('/bins/simulate-update'),
  delete: (id) => api.delete(`/bins/${id}`),
};

export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
  getAnalytics: () => api.get('/dashboard/analytics'),
  getPriority: () => api.get('/dashboard/priority'),
};

export const collectionAPI = {
  getAll: (limit = 50) => api.get(`/collections?limit=${limit}`),
  markCollected: (binId, afterFill = 10.0) => api.post('/collections', { bin_id: binId, after_fill: afterFill }),
};

export const modelAPI = {
  getMetrics: () => api.get('/models/metrics'),
};

export const uploadAPI = {
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export const donationAPI = {
  createOrder: (data) => api.post('/donations/create-order', data),
  verifyPayment: (data) => api.post('/donations/verify', data),
  getMyDonations: () => api.get('/donations/my-donations'),
  getAllAdmin: () => api.get('/donations/all'),
};

export const contactAPI = {
  submit: (data) => api.post('/contact', data),
  getAll: () => api.get('/contact'),
  markRead: (id) => api.patch(`/contact/${id}/read`),
};

export default api;
