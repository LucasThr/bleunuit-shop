# Bleunuit — Medusa backend

E-commerce backend for [Bleunuit](https://www.bleunuit.fr) (literie / matelas), built on
[Medusa 2.x](https://docs.medusajs.com). It owns the commerce side — catalog, cart,
checkout, orders, shipping and payments — while the existing Astro site remains the
storefront. See [the storefront POC](#storefront-poc) below.

This is the `@dtc/backend` app of the Turbo monorepo (run commands from the repo root
*or* from this folder — both are shown).

## Prerequisites

- **Node.js >= 20** (developed on 22.x)
- **pnpm** — this repo is pinned to `pnpm@9.15.4` via `packageManager`. The easiest way
  to get it is Corepack (ships with Node):

  ```bash
  corepack enable pnpm
  ```

  Corepack then uses the pinned version automatically when you run `pnpm` in the repo.
- **PostgreSQL** running locally (the dev DB defaults to `localhost:5432`, database `medusa`)
- **Redis** is optional in dev — Medusa falls back to in-memory implementations if
  `REDIS_URL` is unset. Set it for a production-like setup.

## 1. Install

From the monorepo root:

```bash
pnpm install
```

## 2. Configure environment

The backend reads its config from `apps/backend/.env`. Copy the template and fill it in:

```bash
cp apps/backend/.env.template apps/backend/.env
```

Key variables:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string, e.g. `postgres://user:pass@localhost:5432/medusa` |
| `REDIS_URL` | Optional Redis URL (omit to use in-memory in dev) |
| `JWT_SECRET` / `COOKIE_SECRET` | Auth/session secrets (any value in dev) |
| `STORE_CORS` | Allowed storefront origins — include the Astro dev URL (`http://localhost:4321`) |
| `ADMIN_CORS` / `AUTH_CORS` | Admin dashboard origins |
| `STRIPE_API_KEY` | **Optional.** When set, the Stripe payment provider activates; otherwise the built-in manual provider drives checkout |
| `STRIPE_WEBHOOK_SECRET` | Optional, used alongside `STRIPE_API_KEY` |

Create the database once if it doesn't exist:

```bash
createdb medusa
```

## 3. Run migrations

```bash
# from apps/backend
pnpm exec medusa db:migrate
```

## 4. Create an admin user

```bash
# from apps/backend
pnpm exec medusa user --email you@bleunuit.fr --password yourpassword
```

## 5. Seed data

Two seeds are provided. Run them in order — the Bleunuit seed reuses the region,
sales channel, warehouse and shipping profile created by the base seed.

```bash
# from the monorepo root (Turbo)
pnpm backend:seed               # base store data (region, channel, warehouse)

# then, from apps/backend
pnpm seed:bleunuit              # mattress catalog + Bleunuit shipping options
```

Equivalent direct calls (from `apps/backend`):

```bash
pnpm exec medusa exec ./src/migration-scripts/initial-data-seed.ts
pnpm exec medusa exec ./src/scripts/seed-bleunuit.ts
```

`seed-bleunuit.ts` removes the demo clothing products and adds a small mattress
catalog plus three shipping options matching the agreed model: Chronopost parcel,
bulky "sur devis" (quote on request), and in-store pickup. Each product carries a
`shipping_class` (`parcel` / `bulky` / `pickup`) in its metadata that the storefront
checkout uses to pick the right shipping option.

## 6. Start the dev server

```bash
# from the monorepo root
pnpm backend:dev

# or from apps/backend
pnpm dev
```

- API + storefront API: <http://localhost:9000>
- Admin dashboard: <http://localhost:9000/app>

## Build & production

```bash
# from apps/backend
pnpm build      # medusa build
pnpm start      # medusa start  (serves the built app)
```

## Tests

```bash
# from apps/backend
pnpm test:unit
pnpm test:integration:http
pnpm test:integration:modules
```

## Storefront POC

The current proof-of-concept storefront lives in the sibling Astro app (`../../directus`),
not here. It talks to this backend through the Store API:

- `src/utils/medusa.ts` — Store API client
- `src/pages/boutique-poc.astro` — catalog read live from Medusa
- `src/pages/api/checkout-poc.ts` — full cart → shipping → payment → order flow

That app needs these vars in its own `.env` (already present for local dev):

```
PUBLIC_MEDUSA_URL=http://localhost:9000
PUBLIC_MEDUSA_PUBLISHABLE_KEY=<publishable key from the admin / base seed>
PUBLIC_MEDUSA_REGION_ID=<region id from the base seed>
```

Get the publishable key and region id from the admin dashboard (Settings → Publishable
API Keys, and Settings → Regions) after seeding.

## Useful links

- [Medusa docs](https://docs.medusajs.com)
- [Medusa CLI reference](https://docs.medusajs.com/resources/medusa-cli)
- [Admin development](https://docs.medusajs.com/learn/fundamentals/admin)
