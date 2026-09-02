-- ═══════════════════════════════════════════════════════════════════════
--  Migration: Add multi-product fields to existing products table
--  Run this ONCE in the Supabase SQL Editor
--  Safe: adds columns only if they don't exist, no data is lost
-- ═══════════════════════════════════════════════════════════════════════

-- Add slug column (unique, required for multi-product URLs)
DO $$ BEGIN
  ALTER TABLE public.products ADD COLUMN slug text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Generate slugs for existing products that don't have one
UPDATE public.products
SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Make slug unique and not null after backfill
DO $$ BEGIN
  ALTER TABLE public.products ALTER COLUMN slug SET NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.products ADD CONSTRAINT products_slug_unique UNIQUE (slug);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add slug index
CREATE INDEX IF NOT EXISTS products_slug_idx ON public.products (slug);

-- Add SEO fields
DO $$ BEGIN
  ALTER TABLE public.products ADD COLUMN seo_title text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.products ADD COLUMN seo_description text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add features (JSON array of strings)
DO $$ BEGIN
  ALTER TABLE public.products ADD COLUMN features jsonb NOT NULL DEFAULT '[]'::jsonb;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add variants (JSON array of variant objects)
DO $$ BEGIN
  ALTER TABLE public.products ADD COLUMN variants jsonb NOT NULL DEFAULT '[]'::jsonb;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add specifications (JSON array of key-value pairs)
DO $$ BEGIN
  ALTER TABLE public.products ADD COLUMN specifications jsonb NOT NULL DEFAULT '[]'::jsonb;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add in_stock flag
DO $$ BEGIN
  ALTER TABLE public.products ADD COLUMN in_stock boolean NOT NULL DEFAULT true;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Ensure all existing products have a unique slug (handle duplicates)
DO $$
DECLARE
  rec RECORD;
  base_slug text;
  new_slug text;
  counter integer;
BEGIN
  FOR rec IN SELECT id, slug FROM products WHERE slug IN (
    SELECT slug FROM products GROUP BY slug HAVING count(*) > 1
  ) LOOP
    base_slug := rec.slug;
    counter := 1;
    LOOP
      new_slug := base_slug || '-' || counter;
      IF NOT EXISTS (SELECT 1 FROM products WHERE slug = new_slug) THEN
        UPDATE products SET slug = new_slug WHERE id = rec.id;
        EXIT;
      END IF;
      counter := counter + 1;
    END LOOP;
  END LOOP;
END $$;

-- Done! The products table now supports:
--   slug, seo_title, seo_description, features, variants, specifications, in_stock
