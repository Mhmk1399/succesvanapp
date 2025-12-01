// Vans API
import { apiClient } from './client';
import { API_ENDPOINTS } from '../config/api';
import { Van } from '../types';

export const vansApi = {
  getAll: async (): Promise<Van[]> => {
    return apiClient.get<Van[]>(API_ENDPOINTS.VANS);
  },

  getById: async (id: string): Promise<Van> => {
    return apiClient.get<Van>(`${API_ENDPOINTS.VANS}/${id}`);
  },

  getAvailable: async (startDate: string, endDate: string): Promise<Van[]> => {
    return apiClient.get<Van[]>(
      `${API_ENDPOINTS.VANS}/available?start=${startDate}&end=${endDate}`
    );
  },
};
