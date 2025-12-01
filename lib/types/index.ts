// Type Definitions
export interface Van {
  _id: string;
  name: string;
  capacity: number;
  pricePerDay: number;
  image?: string;
  available: boolean;
  features: string[];
}

export interface Booking {
  _id: string;
  vanId: string;
  userId: string;
  pickupDate: string;
  dropoffDate: string;
  pickupLocation: string;
  dropoffLocation: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
}
