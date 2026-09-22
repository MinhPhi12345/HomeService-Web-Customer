export interface AuthResponse {
  userId: number;
  fullName: string;
  email: string;
  role: number;
  accessToken: string;
  expiresAt: string;
}

export interface ServiceCategory {
  id: number;
  name: string;
  description?: string;
  basePrice: number;
  unit: string;
  iconUrl?: string;
  isActive: boolean;
}

export interface Booking {
  id: number;
  serviceCategoryName: string;
  customerId: number;
  customerName: string;
  taskerId?: number;
  taskerName?: string;
  scheduledTime: string;
  address: string;
  totalPrice: number;
  status: number;
  createdAt: string;
}
