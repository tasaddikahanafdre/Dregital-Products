import { z } from 'zod';

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;

// ── Admin auth ────────────────────────────────────────────────
export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// ── Product ───────────────────────────────────────────────────
export const updateProductSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required').max(200),
  tagline: z.string().trim().max(300).nullable().optional(),
  description: z.string().trim().min(1, 'Description is required').max(10000),
  price: z.coerce.number().positive('Price must be greater than 0').max(9_999_999),
  original_price: z.coerce
    .number()
    .positive('Original price must be greater than 0')
    .max(9_999_999)
    .nullable()
    .optional(),
  active: z.boolean().optional(),
});

// ── Product images ────────────────────────────────────────────
export const reorderImagesSchema = z.object({
  imageIds: z.array(z.string().uuid('Invalid image id')).min(1),
});

// ── Store settings ────────────────────────────────────────────
export const VIDEO_TYPES = ['youtube', 'facebook', 'none'] as const;

export const updateSettingsSchema = z.object({
  delivery_charge_inside_dhaka: z.coerce.number().min(0).max(100_000),
  delivery_charge_outside_dhaka: z.coerce.number().min(0).max(100_000),
  video_url: z
    .string()
    .trim()
    .max(500)
    .refine(
      (v) => v === '' || /^https?:\/\//.test(v),
      'Video URL must be a valid http(s) link',
    )
    .optional(),
  video_type: z.enum(VIDEO_TYPES).optional(),
});

// ── Orders ────────────────────────────────────────────────────
export const createOrderSchema = z.object({
  customerName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  phone: z
    .string()
    .trim()
    .min(8, 'Enter a valid phone number')
    .max(20)
    .regex(/^[0-9+\-\s()]+$/, 'Phone number contains invalid characters'),
  address: z.string().trim().min(5, 'Full address is required').max(600),
  district: z.string().trim().min(2, 'District is required').max(100),
  deliveryArea: z.string().trim().min(2, 'Delivery area is required').max(100),
  notes: z.string().trim().max(2000).optional(),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(50),
  paymentMethod: z.literal('cod').default('cod'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES, {
    errorMap: () => ({ message: 'Invalid order status' }),
  }),
});
