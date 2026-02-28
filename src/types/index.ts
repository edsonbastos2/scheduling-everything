export type UserRole = 'admin' | 'client' | 'super_admin';

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
  opening_hours?: Record<string, string>;
  differentiators?: string[];
  detailed_history?: string;
  is_active: boolean;
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

export interface Review {
  id: string;
  client_id: string;
  salon_id: string;
  rating: number; // 1-5
  comment: string;
  created_at: string;
  client?: {
    full_name: string;
    avatar_url?: string;
  };
}
