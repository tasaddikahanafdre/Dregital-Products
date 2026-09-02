import { supabase } from '../lib/supabase';
import { HttpError } from '../middleware/error';
import type { StoreSettingsRow } from '../types/db';
import { VIDEO_TYPES } from '../validators/schemas';

const DEFAULTS = {
  id: 1,
  delivery_charge_inside_dhaka: 60,
  delivery_charge_outside_dhaka: 120,
  delivery_charge_dhaka_subarea: 80,
  video_url: null,
  video_type: 'none',
  video_thumbnail_path: null,
  video_thumbnail_url: null,
} as const;

/** Fetch store settings, seeding the single settings row on first run. */
export async function getSettings(): Promise<StoreSettingsRow> {
  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) throw error;
  if (data) return data as StoreSettingsRow;

  const { data: created, error: insertError } = await supabase
    .from('store_settings')
    .insert({ ...DEFAULTS, video_type: 'none' })
    .select()
    .single();

  if (insertError) throw insertError;
  return created as StoreSettingsRow;
}

export interface UpdateSettingsInput {
  delivery_charge_inside_dhaka?: number;
  delivery_charge_outside_dhaka?: number;
  delivery_charge_dhaka_subarea?: number;
  video_url?: string;
  video_type?: (typeof VIDEO_TYPES)[number];
}

export async function updateSettings(patch: UpdateSettingsInput): Promise<StoreSettingsRow> {
  const current = await getSettings();

  const next: Record<string, unknown> = { ...patch };

  // Keep video_type consistent with the URL (server-side invariant).
  if (next.video_url !== undefined) {
    const url = String(next.video_url).trim();
    next.video_url = url || null;
    if (url) {
      // A non-empty URL may only be youtube or facebook — never 'none'.
      next.video_type =
        patch.video_type === 'youtube' || patch.video_type === 'facebook'
          ? patch.video_type
          : url.includes('facebook.com')
            ? 'facebook'
            : 'youtube';
    } else {
      next.video_type = 'none';
    }
  }

  const { data, error } = await supabase
    .from('store_settings')
    .update(next)
    .eq('id', current.id)
    .select()
    .single();

  if (error) {
    throw new HttpError(500, `Failed to update settings: ${error.message}`);
  }
  return data as StoreSettingsRow;
}
