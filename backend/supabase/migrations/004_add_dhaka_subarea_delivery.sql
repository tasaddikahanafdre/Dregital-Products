-- ═══════════════════════════════════════════════════════════════════════
--  Migration: Add Dhaka Subarea delivery charge (3rd tier)
--  Run this ONCE in the Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  ALTER TABLE public.store_settings
    ADD COLUMN delivery_charge_dhaka_subarea numeric(12, 2) not null default 80;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Set a sensible default for existing rows
UPDATE public.store_settings
SET delivery_charge_dhaka_subarea = 80
WHERE delivery_charge_dhaka_subarea IS NULL;

-- Done! 3 delivery tiers now:
--   Inside Dhaka     (default ৳60)
--   Dhaka Subarea    (default ৳80)  ← NEW
--   Outside Dhaka    (default ৳120)
