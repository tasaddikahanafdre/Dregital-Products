-- ═══════════════════════════════════════════════════════════════════════
--  Migration: Add per-product video fields
--  Run this ONCE in the Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  ALTER TABLE public.products ADD COLUMN video_url text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.products ADD COLUMN video_type text default 'none'
    check (video_type in ('youtube','facebook','none'));
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.products ADD COLUMN video_thumbnail_path text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.products ADD COLUMN video_thumbnail_url text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Done! Each product now has its own video fields.
