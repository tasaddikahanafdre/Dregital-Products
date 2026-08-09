/** Database row shapes (mirror of the Supabase schema). */

export interface ProductRow {
  id: string;
  name: string;
  tagline: string | null;
  description: string;
  price: number;
  original_price: number | null;
  currency: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImageRow {
  id: string;
  product_id: string;
  storage_path: string;
  public_url: string;
  sort_order: number;
  created_at: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  address: string;
  district: string;
  delivery_area: string;
  notes: string | null;
  product_id: string | null;
  product_name: string;
  product_price: number;
  quantity: number;
  delivery_charge: number;
  total: number;
  payment_method: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface StoreSettingsRow {
  id: number;
  delivery_charge_inside_dhaka: number;
  delivery_charge_outside_dhaka: number;
  video_url: string | null;
  video_type: 'youtube' | 'facebook' | 'none' | null;
  video_thumbnail_path: string | null;
  video_thumbnail_url: string | null;
  updated_at: string;
}
