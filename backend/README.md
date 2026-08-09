# Pawsum Backend API

Express + TypeScript API for the Pawsum store. Talks to Supabase (PostgreSQL + Storage)
using the **service-role** key — this is the only place that key ever lives.

## Quick start

```bash
npm install
cp .env.example .env      # fill in Supabase URL/key + admin credentials
npm run dev               # dev (tsx watch)  → http://localhost:4000
npm run build && npm start  # production build
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | run with hot reload via tsx |
| `npm run build` | compile TypeScript → `dist/` |
| `npm start` | run the compiled server |
| `npm run typecheck` | type-check without emitting |

## Supabase

Run [`supabase/schema.sql`](./supabase/schema.sql) once in the Supabase SQL Editor.
It creates all tables, enables RLS (backend service-role only), creates the storage
buckets, and seeds a placeholder product + settings row.

## Auth model

- Admin credentials come from `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars — nothing
  is hardcoded, and the login endpoint compares them in constant time.
- A successful login returns a signed JWT in an **httpOnly** cookie
  (`pawsum_admin_token`), which is all the frontend ever holds.
- All `/api/admin/*` routes (except login) require that cookie; login attempts are
  rate-limited per IP.

## Money

Order totals are **computed on the server** — unit price comes from the `products`
table, delivery charge from `store_settings` based on whether the district is Dhaka
(inside) or not (outside). The client only supplies the quantity and address details.
