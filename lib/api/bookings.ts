// Bookings API
import { apiClient } from './client';
import { API_ENDPOINTS } from '../config/api';
import { Booking } from '../types';

export const bookingsApi = {
  getAll: async (): Promise<Booking[]> => {
    return apiClient.get<Booking[]>(API_ENDPOINTS.BOOKINGS);
  },

  getById: async (id: string): Promise<Booking> => {
    return apiClient.get<Booking>(`${API_ENDPOINTS.BOOKINGS}/${id}`);
  },

  create: async (data: Omit<Booking, '_id' | 'createdAt'>): Promise<Booking> => {
    return apiClient.post<Booking>(API_ENDPOINTS.BOOKINGS, data);
  },

  cancel: async (id: string): Promise<Booking> => {
    return apiClient.put<Booking>(`${API_ENDPOINTS.BOOKINGS}/${id}/cancel`, {});
  },
};
