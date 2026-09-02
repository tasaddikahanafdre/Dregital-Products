-- ═══════════════════════════════════════════════════════════════════════
--  Dregital — Supabase schema (run once in Supabase SQL Editor)
-- ═══════════════════════════════════════════════════════════════════════

-- ── Products (multi-product store) ──────────────────────────────────────
create table if not exists public.products (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique,
  name                  text not null,
  tagline               text,
  description           text not null default '',
  price                 numeric(12, 2) not null default 0,
  original_price        numeric(12, 2),
  currency              text not null default 'BDT',
  active                boolean not null default true,
  seo_title             text,
  seo_description       text,
  features              jsonb not null default '[]'::jsonb,
  variants              jsonb not null default '[]'::jsonb,
  specifications        jsonb not null default '[]'::jsonb,
  in_stock              boolean not null default true,
  video_url             text,
  video_type            text default 'none' check (video_type in ('youtube','facebook','none')),
  video_thumbnail_path  text,
  video_thumbnail_url   text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ── Product images ──────────────────────────────────────────────────────
create table if not exists public.product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products(id) on delete cascade,
  storage_path  text not null,
  public_url    text not null,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists product_images_product_sort_idx
  on public.product_images (product_id, sort_order);

create index if not exists products_slug_idx on public.products (slug);

-- ── Orders ──────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_number    text not null unique,
  customer_name   text not null,
  phone           text not null,
  address         text not null,
  district        text not null,
  delivery_area   text not null,
  notes           text,
  product_id      uuid references public.products(id) on delete set null,
  product_name    text not null,
  product_price   numeric(12, 2) not null,
  quantity        integer not null default 1 check (quantity > 0),
  delivery_charge numeric(12, 2) not null default 0,
  total           numeric(12, 2) not null,
  payment_method  text not null default 'cod',
  status          text not null default 'pending'
                  check (status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_idx on public.orders (created_at desc);

-- ── Store settings (single row, id = 1) ─────────────────────────────────
create table if not exists public.store_settings (
  id                              integer primary key default 1 check (id = 1),
  delivery_charge_inside_dhaka    numeric(12, 2) not null default 60,
  delivery_charge_outside_dhaka   numeric(12, 2) not null default 120,
  delivery_charge_dhaka_subarea   numeric(12, 2) not null default 80,
  video_url                       text,
  video_type                      text default 'none' check (video_type in ('youtube','facebook','none')),
  video_thumbnail_path            text,
  video_thumbnail_url             text,
  updated_at                      timestamptz not null default now()
);

-- ── updated_at maintenance ──────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists store_settings_set_updated_at on public.store_settings;
create trigger store_settings_set_updated_at
  before update on public.store_settings
  for each row execute function public.set_updated_at();

-- ── Row Level Security ──────────────────────────────────────────────────
-- The backend uses the service-role key (bypasses RLS). RLS is enabled with
-- NO policies, so the public anon key and direct client access are denied.
alter table public.products       enable row level security;
alter table public.product_images enable row level security;
alter table public.orders         enable row level security;
alter table public.store_settings enable row level security;

-- ── Storage buckets ─────────────────────────────────────────────────────
-- Images are served as public URLs from Supabase Storage.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('video-thumbnails', 'video-thumbnails', true)
on conflict (id) do nothing;

-- Public read access for the storefront (writes happen via the backend).
drop policy if exists "Public read product-images" on storage.objects;
create policy "Public read product-images" on storage.objects
  for select using (bucket_id = 'product-images');
drop policy if exists "Public read video-thumbnails" on storage.objects;
create policy "Public read video-thumbnails" on storage.objects
  for select using (bucket_id = 'video-thumbnails');

-- ── Seed data ───────────────────────────────────────────────────────────
insert into public.products (slug, name, tagline, description, price, original_price)
values (
  'default-product',
  'Dregital Signature Product',
  'Crafted for everyday comfort',
  'Set your product name, description, price and images from the Admin Dashboard.',
  0,
  null
) on conflict do nothing;

insert into public.store_settings (id, delivery_charge_inside_dhaka, delivery_charge_outside_dhaka, video_type)
values (1, 60, 120, 'none')
on conflict (id) do nothing;
