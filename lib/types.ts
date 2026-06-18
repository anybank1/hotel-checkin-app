export type RoomType = 'Standard' | 'Deluxe' | 'Family';

export interface GuestRecord {
  id: number;
  full_name: string;
  phone: string;
  id_card: string;       // บัตรประชาชน / พาสปอร์ต
  address: string;       // ที่อยู่
  room_number: string;
  room_type: RoomType;
  check_in: string;
  check_out: string;
  price_per_night: number;
  total_amount: number;
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
}

export interface DashboardStats {
  total_guests: number;
  current_guests: number;
  total_revenue: number;
  available_rooms: number;
  occupied_rooms: number;
  room_breakdown: { room_type: RoomType; count: number; revenue: number }[];
}
