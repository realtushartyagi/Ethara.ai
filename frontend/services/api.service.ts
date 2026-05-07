import api from '@/lib/api';

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  },
};

export const projectService = {
  getAll: async () => {
    const response = await api.get('/projects');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },
  getTasks: async (id: string) => {
    const response = await api.get(`/tasks?projectId=${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/projects', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.patch(`/projects/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },
};

export const taskService = {
  getAll: async (params?: any) => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/tasks', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.patch(`/tasks/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },
};

export const authService = {
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  login: async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
};

export const userService = {
  getMe: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
  updateProfile: async (data: any) => {
    const response = await api.patch('/users/me', data);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};
