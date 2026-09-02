import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

/**
 * Supabase admin client using the SERVICE ROLE key.
 *
 * ⚠️ SECURITY: this client is only ever created inside the backend. It has full
 * database & storage privileges and must never be exposed to the frontend.
 * The frontend talks to these APIs via HTTP instead.
 */
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export const PRODUCT_IMAGES_BUCKET = 'product-images';
export const VIDEO_THUMBNAILS_BUCKET = 'video-thumbnails';
