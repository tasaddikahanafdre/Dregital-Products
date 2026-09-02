# Dregital Frontend

React + TypeScript + Vite + Tailwind CSS storefront and admin dashboard.
Mobile-first, white/black design, BDT (৳) pricing.

## Quick start

```bash
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:4000/api
npm run dev               # http://localhost:5173
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — swipeable gallery, product info, Order Now, video section |
| `/checkout` | COD checkout with live delivery-charge calculation |
| `/order/:orderNumber` | Order confirmation with order details |
| `/admin/login` | Admin sign-in (credentials verified by the backend) |
| `/admin` | Dashboard — stats, product/images, video & delivery, orders |

## Config

- `VITE_API_URL` — backend API base URL. The frontend never talks to Supabase directly.
- `Frontend/public/assets/logo.png` — drop your logo here; the UI falls back to a
  wordmark if the file is missing.

## Build

```bash
npm run build    # → dist/ (static site, deploy anywhere)
```
