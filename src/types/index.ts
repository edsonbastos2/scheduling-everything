export type UserRole = 'admin' | 'client';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
}

export interface Salon {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  image_url?: string;
}

export interface Service {
  id: string;
  salon_id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  is_active: boolean;
  image_url?: string;
  category?: string;
}

export interface Appointment {
  id: string;
  client_id: string;
  salon_id: string;
  service_id: string;
  start_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}
