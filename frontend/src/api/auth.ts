import api from './axiosClient';

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  getMe: () =>
    api.get('/auth/me'),

  updateProfile: (data: { name: string; email: string; mobile?: string | null; currentPassword?: string; newPassword?: string }) =>
    api.put('/auth/profile', data),
};
