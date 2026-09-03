# আগদুম ফ্যাশন (Aagdoom Fashion)

Full-stack Bangladeshi fashion e-commerce platform.

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + React Query + Zustand
- **Backend**: Node.js + Express + TypeScript + Prisma
- **Database**: PostgreSQL 13 + Redis 7
- **Auth**: JWT (access + refresh), bcrypt, rate-limited
- **Payments**: SSLCommerz / bKash (auto-falls back to a sandbox gateway when credentials are not configured)

## Architecture

```
repo/
├── backend/          Express + Prisma REST API (port 5000, base /api/v1)
│   ├── prisma/       Schema + migrations
│   ├── src/modules/  auth, user, product, cart, order, payment, admin
│   ├── uploads/      Admin-uploaded product images
│   └── .env          DB/Redis/JWT/payment config
├── frontend/         Next.js 14 storefront + admin panel (port 3000)
│   ├── app/          Pages (storefront + /admin/*)
│   ├── components/   UI, product, checkout, admin components
│   ├── hooks/        useAuth, useCart
│   ├── stores/       Zustand auth + guest-cart stores
│   └── lib/          API client (axios w/ token refresh), types, format utils
└── docker-compose.yml  postgres:13 + redis:7-alpine
```

## Quick Start

Requirements: Node.js 18+, Docker, npm (11+).

```bash
# 1. Install everything
npm install                    # concurrently devDep at repo root
npm run install:all            # backend + frontend deps

# 2. Start PostgreSQL & Redis
npm run db:up

# 3. Create DB schema and seed demo data
npm run db:migrate             # prisma db push (idempotent)
npm run db:seed                # user accounts, 6 categories, 10 products

# 4. Run both servers
npm run dev                    # backend :5000, frontend :3000
```

Open **http://localhost:3000**.

## Demo Accounts

| Role     | Email              | Password   | Notes                              |
|----------|--------------------|------------|------------------------------------|
| Admin    | admin@aagdoom.com  | Admin@123  | `/admin` panel access              |
| Customer | customer@aagdoom.com | Customer@123 | storefront + orders (also pre-filled on login) |

## Payments

- Default: **sandbox mode**. Offline payments (COD) are auto-approved; online payments redirect to a mock gateway where you choose Success/Fail to simulate the gateway webhook. Order status/payment status update and stock is restored on failure/cancel.
- To go live, set `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASS`, `SSLCOMMERZ_IS_LIVE` and/or `BKASH_*` credentials in `backend/.env`. The code paths activate automatically.

## Environment

Copy `backend/.env.example` → `backend/.env` if needed (defaults work out of the box). Key vars:

- `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- `CLIENT_URL` (default `http://localhost:3000`) — used for gateway redirects
- Payment creds (optional, sandbox by default)

## Useful Scripts

| Command                | Purpose                                    |
|------------------------|--------------------------------------------|
| `npm run db:up/down`   | Start / stop postgres+redis containers     |
| `npm run build`        | Type-check & build backend, then frontend  |
| `npm run dev:backend`  | Backend only (tsx watch)                   |
| `npm run dev:frontend` | Frontend only                              |