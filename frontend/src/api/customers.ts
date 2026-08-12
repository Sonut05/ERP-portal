import api from './axiosClient';

export const customersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; status?: string; type?: string }) =>
    api.get('/customers', { params }),

  getById: (id: number) =>
    api.get(`/customers/${id}`),

  create: (data: any) =>
    api.post('/customers', data),

  update: (id: number, data: any) =>
    api.put(`/customers/${id}`, data),

  addNote: (id: number, note: string) =>
    api.post(`/customers/${id}/notes`, { note }),
};
