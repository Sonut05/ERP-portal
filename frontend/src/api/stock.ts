import api from './axiosClient';

export const stockApi = {
  createMovement: (data: { product_id: number; quantity: number; movement_type: 'IN' | 'OUT'; reason: string }) =>
    api.post('/stock/movement', data),

  getAll: (params?: { page?: number; limit?: number }) =>
    api.get('/stock/movements', { params }),
};
