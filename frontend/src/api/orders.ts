import api from './axiosClient';

export const ordersApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get('/orders', { params }),

  getById: (id: number) =>
    api.get(`/orders/${id}`),

  create: (data: { customer_id: number; status: string; items: { product_id: number; quantity: number }[] }) =>
    api.post('/orders', data),

  updateStatus: (id: number, status: string) =>
    api.put(`/orders/${id}/status`, { status }),
};
