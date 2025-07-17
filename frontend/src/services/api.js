import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/api/auth/register', userData),
  registerAdmin: (userData) => api.post('/api/auth/register/admin', userData),
  login: (credentials) => api.post('/api/auth/login', credentials),
  getProfile: () => api.get('/api/auth/me'),
  updateProfile: (profileData) => api.put('/api/auth/profile', profileData),
  getUsers: () => api.get('/api/auth/users'),
};

// Polls API
export const pollsAPI = {
  getAll: (params = {}) => api.get('/api/polls', { params }),
  getById: (id) => api.get(`/api/polls/${id}`),
  create: (pollData) => api.post('/api/polls', pollData),
  update: (id, pollData) => api.put(`/api/polls/${id}`, pollData),
  delete: (id) => api.delete(`/api/polls/${id}`),
  close: (id) => api.post(`/api/polls/${id}/close`),
  reopen: (id) => api.post(`/api/polls/${id}/reopen`),
  getResults: (id) => api.get(`/api/polls/${id}/results`),
  getAdminResults: (id) => api.get(`/api/polls/${id}/admin-results`),
};

// Votes API
export const votesAPI = {
  cast: (voteData) => api.post('/api/votes', voteData),
  getUserVote: (pollId) => api.get(`/api/votes/poll/${pollId}`),
  getUserVotes: (params = {}) => api.get('/api/votes/user', { params }),
  getPollStats: (pollId) => api.get(`/api/votes/poll/${pollId}/stats`),
  delete: (voteId) => api.delete(`/api/votes/${voteId}`),
};

export default api; 
