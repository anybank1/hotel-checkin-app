export type RoomType =
  | 'Standard Double Bed'
  | 'Standard Twin Beds'
  | 'Double Bed with Terrace'
  | 'Twin Beds with Terrace'
  | 'Triple Bed';

export const ROOM_PRICES: Record<RoomType, number> = {
  'Standard Double Bed': 550,
  'Standard Twin Beds': 600,
  'Double Bed with Terrace': 650,
  'Twin Beds with Terrace': 650,
  'Triple Bed': 750,
};

export const DEFAULT_ROOM_TYPE: RoomType = 'Standard Double Bed';

export const APP_PASSWORD = '202712';
export const ADMIN_PASSWORD = '1112';

export interface GuestRecord {
  id: number;
  full_name: string;
  phone: string;
  id_card: string;
  address: string;
  room_number: string;
  room_type: RoomType;
  check_in: string;
  check_out: string;
  price_per_night: number;
  total_amount: number;
  recorded_by: string;
  created_at: string;
}

export interface GuestInput {
  full_name: string;
  phone: string;
  id_card: string;
  address: string;
  room_number: string;
  room_type: RoomType;
  check_in: string;
  check_out: string;
  price_per_night: number;
  recorded_by: string;
}

export interface DashboardStats {
  total_guests: number;
  current_guests: number;
  total_revenue: number;
  available_rooms: number;
  occupied_rooms: number;
  room_breakdown: { room_type: RoomType; count: number; revenue: number }[];
  monthly_revenue: { month: string; revenue: number; count: number }[];
}

export interface ActivityLog {
  id: number;
  action: string;
  guest_id: number | null;
  guest_name: string;
  details: string;
  recorded_by: string;
  created_at: string;
}
