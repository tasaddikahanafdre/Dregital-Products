// ── Shared types (mirror of the backend API) ────────────────────────────

export interface Product {
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

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  public_url: string;
  sort_order: number;
  created_at: string;
}

export interface ProductWithImages {
  product: Product;
  images: ProductImage[];
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface Order {
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

export interface PublicSettings {
  deliveryChargeInsideDhaka: number;
  deliveryChargeOutsideDhaka: number;
  video: {
    url: string;
    type: 'youtube' | 'facebook' | 'none';
    thumbnailUrl: string | null;
  };
}

export interface StoreSettings {
  id: number;
  delivery_charge_inside_dhaka: number;
  delivery_charge_outside_dhaka: number;
  video_url: string | null;
  video_type: 'youtube' | 'facebook' | 'none';
  video_thumbnail_path: string | null;
  video_thumbnail_url: string | null;
  updated_at: string;
}

export interface CreateOrderInput {
  customerName: string;
  phone: string;
  address: string;
  district: string;
  deliveryArea: string;
  notes?: string;
  quantity: number;
  paymentMethod: 'cod';
}

export interface AdminStats {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}

export interface ListOrdersResult {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
}

export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export const STATUS_META: Record<OrderStatus, { label: string; badge: string; dot: string }> = {
  pending: {
    label: 'Pending',
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
    dot: 'bg-amber-500',
  },
  confirmed: {
    label: 'Confirmed',
    badge: 'bg-sky-50 text-sky-700 ring-sky-200',
    dot: 'bg-sky-500',
  },
  processing: {
    label: 'Processing',
    badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    dot: 'bg-indigo-500',
  },
  shipped: {
    label: 'Shipped',
    badge: 'bg-violet-50 text-violet-700 ring-violet-200',
    dot: 'bg-violet-500',
  },
  delivered: {
    label: 'Delivered',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-rose-50 text-rose-700 ring-rose-200',
    dot: 'bg-rose-500',
  },
};
