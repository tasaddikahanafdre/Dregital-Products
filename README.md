# Dregital — Single-Product E-commerce Store

A complete, production-ready single-product e-commerce store built for **mobile-first** customers.
White / black design, **BDT (৳)** pricing, Cash on Delivery, and a fully separated
frontend + backend so both can be hosted independently.

| Part | Stack | Folder |
|------|-------|--------|
| Storefront + Admin UI | React · TypeScript · Vite · Tailwind CSS | [`Frontend/`](./Frontend) |
| API (auth, product, orders, settings) | Node.js · Express · TypeScript | [`backend/`](./backend) |
| Database + file storage | Supabase PostgreSQL + Supabase Storage | schema in `backend/supabase/schema.sql` |

---

## 📁 Folder structure

```
Dregital/
├── Frontend/                     # React + Vite + Tailwind (deploy separately)
│   ├── public/
│   │   └── assets/
│   │       └── logo.png          # ← drop YOUR Dregital logo here
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/            # Stats, product editor, images, video/settings, orders
│   │   │   ├── home/             # Header, gallery, product info, video, sticky bar, footer
│   │   │   └── ui/               # Logo, Spinner
│   │   ├── hooks/                # useProduct, useSettings, useAdminAuth
│   │   ├── lib/                  # api client, format (BDT), districts
│   │   ├── pages/                # Home, Checkout, Confirmation, Admin login, Admin dashboard
│   │   ├── types/                # shared TypeScript types
│   │   ├── App.tsx               # router
│   │   ├── main.tsx
│   │   └── index.css             # Tailwind + global styles
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
└── backend/                     # Express API (deploy separately)
    ├── src/
    │   ├── config/env.ts         # validated env vars (zod)
    │   ├── lib/                  # supabase client, jwt/cookie helpers
    │   ├── middleware/           # auth (httpOnly cookie), rate limit, error handler
    │   ├── routes/
    │   │   ├── public/           # product, settings, orders
    │   │   └── admin/            # auth, product, images, settings, orders (all protected)
    │   ├── services/             # product, settings, order, storage logic
    │   ├── types/db.ts
    │   ├── validators/schemas.ts # zod validation (backend-only source of truth)
    │   ├── app.ts
    │   └── server.ts
    ├── supabase/schema.sql       # tables + storage buckets + seed (run once in Supabase)
    ├── .env.example
    └── package.json
```

---

## 🔑 Environment variables

### Backend — `backend/.env` (copy from `backend/.env.example`)

```bash
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:5173        # comma-separated allowed frontend origins

SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # ⚠️ backend only, never the frontend

ADMIN_USERNAME=admin                     # admin login — read from env at runtime
ADMIN_PASSWORD=change-me-strong-password
ADMIN_JWT_SECRET=change-me-long-random-string
ADMIN_JWT_EXPIRES_IN=12h
```

### Frontend — `Frontend/.env` (copy from `Frontend/.env.example`)

```bash
VITE_API_URL=http://localhost:4000/api
```

The frontend **never** sees Supabase keys. It talks to the backend API only.

---

## 🗄️ Supabase setup (one time, ~5 minutes)

1. Create a free project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy the **Project URL** and the **`service_role` key**.
   Put them in `backend/.env` (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
3. Open **SQL Editor** and run the entire contents of [`backend/supabase/schema.sql`](./backend/supabase/schema.sql).
   This creates the `products`, `product_images`, `orders`, `store_settings` tables,
   enables **Row Level Security** (only the service-role backend can access them),
   creates the public `product-images` and `video-thumbnails` storage buckets,
   and seeds a placeholder product + settings.
4. Storage buckets are created automatically by the SQL script — no manual setup needed.
5. Done. Add your logo to `Frontend/public/assets/logo.png` and log into
   `/admin` to set the real product, price, images, video and delivery charges.

> **Security note:** the `service_role` key bypasses RLS, so it must only live in the
> backend. The public Supabase `anon` key is not used anywhere.

---

## ▶️ Run locally

**Terminal 1 — backend**
```bash
cd backend
npm install
cp .env.example .env      # then fill in your Supabase + admin values
npm run dev               # http://localhost:4000
```

**Terminal 2 — frontend**
```bash
cd Frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:4000/api
npm run dev               # http://localhost:5173
```

Open **http://localhost:5173** for the store, and **http://localhost:5173/admin**
for the dashboard (log in with the credentials in `backend/.env`).

**Build for production**
```bash
cd backend && npm run build && npm start      # API on :4000
cd Frontend && npm run build                   # static site in Frontend/dist
```

---

## 🌍 Deploying frontend & backend separately

### Backend (Render, Railway, Fly.io, VPS…)
1. Deploy the `backend/` folder as a Node service.
2. Build command: `npm install && npm run build` — Start command: `npm start`.
3. Set all backend env vars from `backend/.env.example` (especially
   `CLIENT_URL` → your deployed frontend URL).
4. `ADMIN_JWT_SECRET` → use a long random string in production.

### Frontend (Vercel, Netlify, Cloudflare Pages…)
1. Deploy the `Frontend/` folder as a static site, build command `npm run build`,
   output directory `dist`.
2. Set `VITE_API_URL` to your deployed backend URL, e.g. `https://api.dregital.com/api`.
3. **SPA fallback:** make sure all routes redirect to `index.html`
   (Vercel/Netlify do this automatically for `react-router`).
4. **Cookies:** the backend sets the admin session cookie with
   `SameSite=None; Secure` in production, so admin sessions work across the two
   domains over HTTPS.

### Suggested flow after deployment
Admin dashboard → set product details/images/video → homepage shows them →
customer taps **Order Now** → checkout → order saved in Supabase →
appears instantly in the admin **Orders** tab.

---

## 🧪 API overview

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | `/api/product` | public | product + images for the homepage |
| GET | `/api/settings` | public | delivery charges + video for checkout/home |
| POST | `/api/orders` | public | place a COD order (totals computed server-side) |
| GET | `/api/orders/:orderNumber` | public | confirmation page lookup |
| POST | `/api/admin/auth/login` | public* | verify env credentials → httpOnly cookie |
| POST | `/api/admin/auth/logout` | admin | end session |
| GET | `/api/admin/auth/me` | admin | session check |
| GET/PUT | `/api/admin/product` | admin | read / edit the product |
| POST | `/api/admin/images` | admin | upload image → Supabase Storage |
| DELETE | `/api/admin/images/:id` | admin | delete image |
| PUT | `/api/admin/images/reorder` | admin | reorder images |
| GET/PUT | `/api/admin/settings` | admin | delivery charges, video link |
| POST | `/api/admin/settings/thumbnail` | admin | upload video thumbnail |
| GET | `/api/admin/orders` | admin | list/filter orders |
| GET | `/api/admin/orders/stats` | admin | total / pending / delivered / cancelled / revenue |
| PATCH | `/api/admin/orders/:id/status` | admin | change order status |

\* rate-limited and protected against brute force; admin credentials live only in backend env vars.
