import { randomInt } from 'crypto';
import { supabase } from '../lib/supabase';
import { HttpError } from '../middleware/error';
import type { OrderRow, OrderStatus } from '../types/db';
import { getSettings } from './settings.service';

export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

/** Dhaka subarea districts — near Dhaka but not inside the main city. */
const DHAKA_SUBAREA_DISTRICTS = new Set([
  'gazipur',
  'narayanganj',
  'tangail',
  'narsingdi',
  'munshiganj',
]);

/** Determine delivery zone: inside, subarea, or outside. */
export function determineZone(district: string): 'inside' | 'subarea' | 'outside' {
  const normalized = district.trim().toLowerCase().replace(/[^a-z]/g, '');
  if (normalized === 'dhaka') return 'inside';
  if (DHAKA_SUBAREA_DISTRICTS.has(normalized)) return 'subarea';
  return 'outside';
}

export function generateOrderNumber(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
    d.getDate(),
  ).padStart(2, '0')}`;
  const rand = String(randomInt(0, 1_000_000)).padStart(6, '0');
  return `PW-${ymd}-${rand}`;
}

export interface CreateOrderInput {
  productSlug?: string;
  customerName: string;
  phone: string;
  address: string;
  district: string;
  deliveryArea: string;
  notes?: string;
  quantity: number;
  paymentMethod: 'cod';
}

/**
 * Create an order. The product price, delivery charge and total are computed
 * server-side — the client never decides the money.
 */
export async function createOrder(input: CreateOrderInput): Promise<OrderRow> {
  let productQuery = supabase
    .from('products')
    .select('*')
    .eq('active', true);

  if (input.productSlug) {
    productQuery = productQuery.eq('slug', input.productSlug);
  } else {
    productQuery = productQuery.limit(1);
  }

  const { data: product, error: productError } = await productQuery.maybeSingle();

  if (productError) throw productError;
  if (!product) {
    throw new HttpError(400, 'Sorry, this product is not available for ordering right now.');
  }

  const settings = await getSettings();
  const zone = determineZone(input.district);
  const deliveryCharge =
    zone === 'inside'
      ? Number(settings.delivery_charge_inside_dhaka)
      : zone === 'subarea'
        ? Number(settings.delivery_charge_dhaka_subarea)
        : Number(settings.delivery_charge_outside_dhaka);

  const unitPrice = Number(product.price);
  const subtotal = unitPrice * input.quantity;
  const total = Math.round((subtotal + deliveryCharge) * 100) / 100;

  // Retry with a fresh order number if we hit a (very unlikely) collision.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_number: generateOrderNumber(),
        customer_name: input.customerName,
        phone: input.phone,
        address: input.address,
        district: input.district,
        delivery_area: input.deliveryArea,
        notes: input.notes?.trim() ? input.notes.trim() : null,
        product_id: product.id,
        product_name: product.name,
        product_price: unitPrice,
        quantity: input.quantity,
        delivery_charge: deliveryCharge,
        total,
        payment_method: input.paymentMethod,
        status: 'pending',
      })
      .select()
      .single();

    if (!error) return data as OrderRow;

    if (error.code === '23505' && attempt < 2) continue; // unique violation on order_number
    throw new HttpError(500, `Failed to place the order: ${error.message}`);
  }

  throw new HttpError(500, 'Failed to place the order.');
}

export async function findOrderByNumber(orderNumber: string): Promise<OrderRow | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .maybeSingle();
  if (error) throw error;
  return (data as OrderRow) ?? null;
}

export interface ListOrdersResult {
  orders: OrderRow[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listOrders(
  status: OrderStatus | 'all',
  page: number,
  pageSize: number,
): Promise<ListOrdersResult> {
  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;
  return {
    orders: (data ?? []) as OrderRow[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<OrderRow> {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    throw new HttpError(500, `Failed to update order status: ${error.message}`);
  }
  return data as OrderRow;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}

/** Aggregate simple store statistics from all orders. */
export async function getOrderStats(): Promise<OrderStats> {
  const { data, error } = await supabase.from('orders').select('status, total');
  if (error) throw error;

  const rows = (data ?? []) as Array<{ status: OrderStatus; total: number }>;

  const stats: OrderStats = {
    totalOrders: rows.length,
    pendingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
  };

  for (const row of rows) {
    if (row.status === 'pending') stats.pendingOrders += 1;
    if (row.status === 'delivered') stats.deliveredOrders += 1;
    if (row.status === 'cancelled') stats.cancelledOrders += 1;
    if (row.status !== 'cancelled') {
      stats.totalRevenue += Number(row.total) || 0;
    }
  }

  stats.totalRevenue = Math.round(stats.totalRevenue * 100) / 100;
  return stats;
}
