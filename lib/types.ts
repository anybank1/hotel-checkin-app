export type RoomType = 'Standard' | 'Deluxe' | 'Family';

export const ROOM_PRICES: Record<RoomType, number> = {
  Standard: 550,
  Deluxe: 800,
  Family: 1200,
};

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
