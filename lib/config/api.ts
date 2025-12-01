// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
  TIMEOUT: 10000,
};

export const API_ENDPOINTS = {
  VANS: '/vans',
  BOOKINGS: '/bookings',
  AUTH: '/auth',
};
