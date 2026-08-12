import api from './axiosClient';

export const productsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; category?: string; lowStock?: boolean }) =>
    api.get('/products', { params }),

  getById: (id: number) =>
    api.get(`/products/${id}`),

  create: (data: any) =>
    api.post('/products', data),

  update: (id: number, data: any) =>
    api.put(`/products/${id}`, data),

  getStockMovements: (productId: number, params?: { page?: number; limit?: number }) =>
    api.get(`/products/${productId}/stock-movements`, { params }),
};
