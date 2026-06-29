# Deploying to Railway

One Railway **project** with four services, plus Cloudflare R2 for uploaded images:

| Service | Source | Serves |
| --- | --- | --- |
| `backend` | repo → [apps/backend/Dockerfile](apps/backend/Dockerfile) | Medusa Store/Admin API + admin dashboard at `/app` (`api.bleunuit.fr`) |
| `storefront` | repo → [apps/storefront/Dockerfile](apps/storefront/Dockerfile) | Astro SSR (`www.bleunuit.fr`) |
| `Postgres` | Railway database plugin | catalog + orders |
| `Redis` | Railway database plugin | cache / events / background jobs |

Object storage is **Cloudflare R2** (free tier, S3-compatible) — Railway has no
native bucket, and the container disk is ephemeral.

> The backend's [medusa-config.ts](apps/backend/medusa-config.ts) gates the Redis
> modules and the S3 file module on env vars, so setting them "turns on"
> production behaviour; locally, with neither set, it keeps the in-memory +
> on-disk defaults.

**Monorepo note:** both code services build from the **repo root** as context (the
Dockerfiles copy the root `pnpm-lock.yaml` + `pnpm-workspace.yaml`). On Railway
that means: **do NOT set a Root Directory** on either service — instead point each
at its Dockerfile with the `RAILWAY_DOCKERFILE_PATH` variable (below).

---

## 0. Prerequisites

```sh
npm i -g @railway/cli      # or: brew install railway
railway login
# From the medusa/ repo root:
railway init                # create the project (or `railway link` an existing one)
```

You can do most of this in the Railway dashboard too; the CLI is only needed for
`railway up` / `railway ssh`.

---

## 1. Add the database services

In the project: **New → Database → Add PostgreSQL**, then again for **Redis**.
Railway provisions both and exposes their connection strings as referenceable
variables (`${{Postgres.DATABASE_URL}}`, `${{Redis.REDIS_URL}}`) over the private
network — no public egress.

> Redis: leave `maxmemory-policy` at the default (`noeviction`). Medusa's job
> queue must not have its keys evicted.

---

## 2. Object storage (Cloudflare R2)

1. Create an R2 bucket (e.g. `bleunuit-uploads`).
2. Enable **public access** (R2 → Settings → Public access → `r2.dev` URL, or
   attach a custom domain) so product images load in the browser.
3. Create an **R2 API token** (Object Read & Write) → gives an access key id +
   secret. Note the S3 endpoint: `https://<accountid>.r2.cloudflarestorage.com`.

---

## 3. Backend service

Create a service **from the GitHub repo** (or `railway up` from the repo root).
Then in the service settings:

- **Root Directory:** leave empty.
- **Variables:**

  ```
  RAILWAY_DOCKERFILE_PATH=apps/backend/Dockerfile
  DATABASE_URL=${{Postgres.DATABASE_URL}}
  REDIS_URL=${{Redis.REDIS_URL}}
  JWT_SECRET=<openssl rand -base64 32>
  COOKIE_SECRET=<openssl rand -base64 32>
  STORE_CORS=https://www.bleunuit.fr
  ADMIN_CORS=https://api.bleunuit.fr
  AUTH_CORS=https://api.bleunuit.fr,https://www.bleunuit.fr
  S3_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
  S3_ACCESS_KEY_ID=<r2 key>
  S3_SECRET_ACCESS_KEY=<r2 secret>
  S3_REGION=auto
  S3_BUCKET=bleunuit-uploads
  S3_FILE_URL=https://pub-xxxx.r2.dev
  ```

  Do **not** set `DATABASE_SSL` — Railway's internal Postgres connection isn't
  over TLS. (Optional Stripe: `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`.)

- **Settings → Deploy → Pre-Deploy Command:** `npx medusa db:migrate`
  (runs core + module migrations between build and release, on the private
  network with the vars above).

Deploy. Railway builds the image and gives the service a `*.up.railway.app`
domain; you'll map `api.bleunuit.fr` to it in step 6.

---

## 4. Seed baseline data + create an admin user

`railway ssh` into the running backend (its working dir is the built
`.medusa/server`, so the compiled `.js` scripts are present):

```sh
railway ssh --service backend
# then inside the container:
npx medusa exec ./src/migration-scripts/initial-data-seed.js   # region, sales channel, publishable key
npx medusa exec ./src/scripts/seed-bleunuit.js                 # project catalog
npx medusa exec ./src/scripts/seed-catalog.js
npx medusa exec ./src/scripts/seed-cms.js
npx medusa user -e contact@bleunuit.fr -p 'a-strong-password'  # admin login for /app
```

Then grab the two values the storefront needs at build time:
- **Publishable key** — admin (`/app`) → Settings → Publishable API Keys.
- **Region id** — `curl https://api.bleunuit.fr/store/regions -H "x-publishable-api-key: pk_xxx"`.
- **Region id** — `curl https://backend-production-9ca1.up.railway.app/store/regions -H "x-publishable-api-key: pk_1cdb8db54014cad91a9b14706ac5c3f44659923cbee8bf2e410e00b3651eadc4"`.
---

## 5. Storefront service

Create a second service from the **same repo**. Astro inlines `PUBLIC_*` at
**build** time, and Railway exposes service variables to the Docker build as build
args — our Dockerfile already declares the matching `ARG`s, so just set them as
variables:

- **Root Directory:** leave empty.
- **Variables (build-time → inlined):**

  ```
  RAILWAY_DOCKERFILE_PATH=apps/storefront/Dockerfile
  PUBLIC_SITE_URL=https://www.bleunuit.fr
  PUBLIC_MEDUSA_URL=https://api.bleunuit.fr
  PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_xxx
  PUBLIC_MEDUSA_REGION_ID=reg_xxx
  ```

- **Variables (runtime — contact form + newsletter):**

  ```
  RESEND_API_KEY=re_...
  CONTACT_TO_EMAIL=contact@bleunuit.fr
  CONTACT_FROM_EMAIL=Literie Bleunuit <noreply@bleunuit.fr>
  ```

Deploy. Because the `PUBLIC_*` values are baked in at build time, **changing any
of them requires a redeploy** to take effect.

---

## 6. Domains

In each service: **Settings → Networking → Custom Domain**.
- `backend` → `api.bleunuit.fr`
- `storefront` → `www.bleunuit.fr`

Railway shows the `CNAME` target to add at your registrar and issues TLS
automatically once DNS resolves. (If a fresh service returns 502, set its target
port under Networking: `9000` for backend, `4321` for storefront — both also
honor Railway's injected `PORT`.)

---

## Redeploys

Push to the connected branch and Railway rebuilds automatically (or `railway up`).
Backend migrations re-run via the Pre-Deploy Command. Re-set a storefront
`PUBLIC_*` variable only if the key / region / site URL changes — then redeploy so
Astro re-inlines it.

## Troubleshooting

- **Images 403 in the browser** — the R2 bucket isn't public; enable public
  access (or the custom domain) and confirm `S3_FILE_URL` matches it.
- **A native dependency fails to build on Alpine** — switch the `FROM
  node:lts-alpine` lines in [apps/backend/Dockerfile](apps/backend/Dockerfile)
  to `node:lts-slim` and redeploy.
- **`db:migrate` can't reach Postgres** — confirm `DATABASE_URL` references
  `${{Postgres.DATABASE_URL}}` and both services are in the same project.
