# Bleu Nuit

Monorepo for **Literie Bleu Nuit** (literie / matelas) — a Medusa-powered commerce
backend and an Astro storefront, managed with **pnpm + Turbo**.

| App | Package | Stack | Dev URL |
|-----|---------|-------|---------|
| Backend | [`@dtc/backend`](apps/backend) | Medusa 2.x (commerce + custom `cms` & `quotes` modules), PostgreSQL, optional Redis | `http://localhost:9000` (admin at `/app`) |
| Storefront | [`@dtc/storefront`](apps/storefront) | Astro 5 SSR (Node standalone) · React 19 islands · Tailwind CSS v4 · nanostores · Stripe · Resend | `http://localhost:4321` |

The storefront reads **all** content and catalog data from Medusa: editorial content
via the custom `cms` module, products/categories via native Medusa, quotes (devis) via
the custom `quotes` module.

## Prerequisites

- **Node.js** >= 20
- **pnpm** — pinned to `9.15.4` via `packageManager`. Easiest install is Corepack
  (ships with Node): `corepack enable pnpm`
- **PostgreSQL** — dev DB defaults to `localhost:5432`, database `medusa-backend`
- **Redis** *(optional in dev)* — Medusa falls back to in-memory implementations if
  `REDIS_URL` is unset

## Getting started

1. **Install dependencies** (from the repo root):

   ```bash
   pnpm install
   ```

2. **Configure the backend** — copy the template and fill in the values:

   ```bash
   cp apps/backend/.env.template apps/backend/.env
   ```

   At minimum set `DATABASE_URL`, and strong `JWT_SECRET` / `COOKIE_SECRET`
   (`openssl rand -base64 32`).

3. **Run migrations and create an admin user**:

   ```bash
   pnpm --filter @dtc/backend exec medusa db:migrate
   pnpm --filter @dtc/backend exec medusa user -e admin@bleunuit.fr -p supersecret
   ```

4. **Configure the storefront** — copy the example and add your publishable key:

   ```bash
   cp apps/storefront/.env.example apps/storefront/.env
   ```

   Get the publishable key from the admin dashboard (`http://localhost:9000/app` →
   Settings → Publishable API keys) and set `PUBLIC_MEDUSA_PUBLISHABLE_KEY`.

5. **Start everything** (backend + storefront via Turbo):

   ```bash
   pnpm dev
   ```

   The backend runs on `http://localhost:9000` (admin at `/app`) and the storefront on
   `http://localhost:4321`.

## Commands

Run from the repo root:

| Command | Action |
|---------|--------|
| `pnpm dev` | Backend + storefront together (Turbo) |
| `pnpm backend:dev` | Backend only |
| `pnpm storefront:dev` | Storefront only |
| `pnpm build` | Production build of all apps |
| `pnpm lint` | Lint all apps |
| `pnpm test` | Run all tests |
| `pnpm backend:seed` | Seed initial backend data |

## Environment variables

### Backend — `apps/backend/.env` (see `.env.template`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `DB_NAME` | Database name (default `medusa-backend`) |
| `JWT_SECRET` / `COOKIE_SECRET` | Required secrets — generate with `openssl rand -base64 32` |
| `REDIS_URL` | Redis connection (optional in dev) |
| `STORE_CORS` / `ADMIN_CORS` / `AUTH_CORS` | Allowed origins |

### Storefront — `apps/storefront/.env` (see `.env.example`)

Astro inlines `PUBLIC_*` variables **at build time**.

| Variable | Description |
|----------|-------------|
| `PUBLIC_MEDUSA_URL` | Medusa backend URL (default `http://localhost:9000`) |
| `PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Medusa publishable API key |
| `PUBLIC_MEDUSA_REGION_ID` | Region used for price calculation |
| `PUBLIC_SITE_URL` | Public domain (canonical URLs, sitemap, robots) |
| `PUBLIC_STRIPE_PUBLISHABLE_KEY` *(optional)* | Stripe checkout |
| `RESEND_API_KEY` | Server-side Resend key for contact form + newsletter (never prefix `PUBLIC_`) |
| `CONTACT_TO_EMAIL` / `CONTACT_FROM_EMAIL` | Contact-form delivery + verified sender |
| `RESEND_AUDIENCE_ID` *(optional)* | Resend audience for newsletter signups |

## Documentation

- [`apps/backend/README.md`](apps/backend/README.md) — backend setup, modules, migrations
- [`apps/storefront/README.md`](apps/storefront/README.md) — storefront structure, data flow
- [Medusa documentation](https://docs.medusajs.com)
- [Astro documentation](https://astro.build)
