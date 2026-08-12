import api from './axiosClient';

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};
