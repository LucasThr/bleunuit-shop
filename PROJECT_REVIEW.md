# Project Review — Security & Stability

**Project:** bleunuit-website (Medusa 2.15.5 backend + Astro 5 storefront monorepo)
**Date:** 2026-06-19
**Scope:** Full read-only review of API security, storefront security, backend config/modules, and build/test/dependency stability. No files were modified.

---

## Verdict

The application code is **well-structured and reads cleanly**, but the project is **not production-ready as-is**. The storefront is genuinely solid — server-authoritative checkout, no secret leakage, graceful degradation when the backend is down. The problems are concentrated in **leftover Medusa-starter defaults that were never hardened** (secrets, CORS, no Redis) and in **untested backend code**. None of the issues are exotic; they are the standard "starter → production" gaps. Several are hard blockers for a real deployment.

> Mental model: **good application code sitting on an un-hardened starter config.**

---

## 🔴 Must fix before production

### 1. Auth secrets fall back to the public string `'supersecret'` — Critical
- **Where:** `apps/backend/medusa-config.ts:28-29`, `apps/backend/.env.template:5-6`, and the local `apps/backend/.env` currently uses it.
- **Problem:** `jwtSecret`/`cookieSecret` default to `'supersecret'` when the env vars are unset. The value is committed in the template and is the well-known Medusa starter default. If it reaches production, anyone can forge admin JWTs and session cookies → **full admin takeover**. The `|| 'supersecret'` fallback turns a missing-config mistake into a silent, exploitable boot instead of a crash.
- **Fix:** Remove the fallbacks (`process.env.JWT_SECRET!` + a startup guard that throws if unset). Put high-entropy values in every deployed environment (`openssl rand -base64 32`). Replace the template values with `__CHANGE_ME__`. Rotate the secret if `supersecret` was ever live in a deployed env.

### 2. Stored XSS via unsanitized CMS HTML — High
- **Where:** `apps/storefront/src/pages/blog/[slug].astro:129` (`set:html={postEntry.content}`) and `apps/storefront/src/pages/produits/[category]/p/[slug].astro:300` (`set:html={product.description}`).
- **Problem:** Both render admin/CMS-authored HTML with no sanitization (no sanitizer dependency exists in the project). Both pages are SSR (`output: 'server'`), so a `<script>` / `<img onerror=…>` in a blog body or product description executes in every visitor's browser on bleunuit.fr. Because the content is admin-authored this is a compromised-admin / defense-in-depth issue rather than an anonymous hole, but it is a real stored-XSS sink.
- **Fix:** Add `sanitize-html` (or `isomorphic-dompurify`) and run both sinks through an allowlist that strips `<script>`, event handlers, and `javascript:` URIs. If the content is authored as Markdown, render it through a Markdown renderer that escapes raw HTML.

### 3. Redis is in `.env` but never wired — everything runs in-memory — High
- **Where:** `apps/backend/medusa-config.ts:31-45` (modules block). `REDIS_URL` exists in `.env`/`.env.template` but is never referenced in the config.
- **Problem:** Only `payment`, `cms`, and `quotes` modules are registered. There is no `event-bus-redis`, no cache provider, and no `workflow-engine-redis`. Medusa therefore defaults to in-memory event bus / workflow engine / cache, which means:
  - events and workflow state are **lost on restart/deploy**;
  - you **cannot run more than one backend instance** correctly — subscribers/workflows fire on the wrong node or not at all.
- **Fix:** Register the Redis-backed modules gated on `REDIS_URL`, and set `redisUrl` at the `projectConfig` level:
  ```ts
  modules: [
    { resolve: "@medusajs/medusa/event-bus-redis",      options: { redisUrl: process.env.REDIS_URL } },
    { resolve: "@medusajs/medusa/workflow-engine-redis", options: { redis: { url: process.env.REDIS_URL } } },
    { resolve: "@medusajs/medusa/cache-redis",          options: { redisUrl: process.env.REDIS_URL } },
    // ...existing payment / cms / quotes
  ]
  ```
  Install the corresponding packages (only `@medusajs/caching` is currently present). In-memory is fine for local dev only.

### 4. Public quote endpoint: no rate-limit, no captcha, unbounded input — High
- **Where:** `apps/backend/src/api/store/quotes/route.ts`, `apps/backend/src/api/store/quotes/validators.ts:4-11`, wired at `apps/backend/src/api/middlewares.ts:76-81`.
- **Problem:** `POST /store/quotes` is fully public. Its validator uses bare `z.string()` with no `.max()`, and `message` maps to an unbounded Postgres `text` column (`apps/backend/src/modules/quotes/models/quote-request.ts`). There is no rate limiting or captcha anywhere in the codebase. An anonymous attacker can loop POSTs with multi-MB bodies → DB/inbox flood (storage-exhaustion DoS + spam lead injection) at near-zero cost.
- **Fix:** Add explicit `.max()` bounds to every field (e.g. `name ≤200`, `email ≤320` with `.email()`, `phone ≤40`, `message ≤2000`, `product_id ≤100`, `product_title ≤300`). Add per-IP rate limiting in front of the route and a captcha (hCaptcha/Turnstile) or honeypot on the storefront form, verified server-side before `createQuoteWorkflow` runs.

---

## 🟠 Security — worth fixing

| Severity | Location | Issue | Fix |
|----------|----------|-------|-----|
| Low | `apps/backend/.env.template:1-3` (and deployed envs) | `STORE_CORS`/`ADMIN_CORS`/`AUTH_CORS` all include leftover `https://docs.medusajs.com` from the starter — a third-party origin in the credentialed-CORS trust boundary. | Remove `https://docs.medusajs.com` from all three CORS vars everywhere; keep only real storefront/admin origins. |
| Low | `apps/storefront/src/components/JsonLd.astro:9` | `JSON.stringify(data)` does not escape `</script>`; a CMS-authored title containing it (used as JSON-LD `headline` in `blog/[slug].astro:47`) breaks out of the script tag. | Escape once for all JSON-LD usages: `JSON.stringify(data).replace(/</g, '\\u003c')`. |
| Low | `apps/backend/src/api/store/cms/stores/route.ts:8`, `apps/backend/src/api/store/cms/brands/route.ts:8` | `stores`/`brands` public GETs pass empty filters, while `blog-posts`/`testimonials` correctly filter `{ published: true }`. | Confirm those models have no draft/internal rows; if they gain a visibility flag, filter on it. Add explicit `select` projections to public reads so new internal columns aren't auto-exposed. |
| Low | `apps/storefront/src/components/QuoteRequestForm.tsx:45-55` | Raw user input (`name`/`email`/`message`) is forwarded to `/store/quotes`. Risk only materializes if the backend echoes it unescaped into the admin "Devis" UI or drops `email` into a mail header. | Ensure server-side escaping/validation before persisting or emailing; the storefront can't be trusted to sanitize. |

### Verified clean (no action needed)
- **No secret exposure in the storefront** — every env reference in `src/` is `PUBLIC_`-prefixed (`PUBLIC_MEDUSA_URL`, `PUBLIC_MEDUSA_PUBLISHABLE_KEY`, `PUBLIC_MEDUSA_REGION_ID`, `PUBLIC_STRIPE_PUBLISHABLE_KEY`). No Stripe secret / Medusa secret is bundled to the client; the Stripe secret correctly lives only on the backend.
- **Checkout price integrity is server-authoritative** — `useCheckout.ts` / `CheckoutForm.tsx` never send a price/total. Totals are display-only; Medusa recomputes line items, the PaymentIntent amount, and the order total server-side via `cart.update` / `addShippingMethod` / `initiatePaymentSession` / `cart.complete`. A tampered localStorage cart can only point at a different cart id, not change what's charged.
- **localStorage stores only the cart id** (`apps/storefront/src/stores/cart.ts:16`), never line items/prices. Ids are unguessable ULIDs; stale/invalid ids are handled gracefully (`catch { clearCart() }`).
- **Admin routes correctly rely on Medusa's default `/admin/*` auth** — no custom middleware bypasses auth; `middlewares.ts` only adds body validation. (Convention-based — re-verify after any Medusa upgrade.)
- **No IDOR on quotes** — there is no public single-quote read; quotes are only accessible under `/admin/quotes/**`, and the admin update is constrained to `status: z.enum(["pending","handled"])`.
- **No raw SQL** in the `cms` or `quotes` services — both are thin `MedusaService(...)` subclasses with no custom query building.

---

## 🟡 Stability

### Tests
- **Backend has zero tests and a broken jest setup.** No `*.spec.ts` / `*.test.ts` files exist, and `apps/backend/jest.config.js:21` references `./integration-tests/setup.js` — that file and the entire `integration-tests/` directory **do not exist**, so the suites cannot even run. The CMS module, quotes module, and all workflow steps are entirely unverified. There is also no plain `test` script in the backend, so `turbo test` silently skips it.
- **Storefront:** the single test suite `apps/storefront/src/utils/sale-mode.test.ts` passes (6/6, vitest).

### Type checking
- `astro build` and `medusa build` do **not** type-check, and there is no CI type gate, so the errors below never break the build:
  - **Backend** `tsc --noEmit` → 2 errors in `apps/backend/src/admin/lib/sdk.ts:4-5` (`import.meta` in a CJS-target file). Harmless in practice — Vite builds the admin separately — but means bare `tsc` is not clean.
  - **Storefront** `tsc --noEmit` → 2 errors in `apps/storefront/src/pages/sitemap.xml.ts:37-38`. **This is a real latent bug:** the `typeof product.category !== 'object'` guard lets `null` through (`typeof null === 'object'`), then passes it where a non-null ref is required. Sitemap generation can throw on a null category.

### Dependencies
- **`pnpm audit --prod` → 23 advisories (8 high, 13 moderate, 2 low).** Almost all are transitive build-time deps. The ones relevant to a deployed SSR storefront:
  - `astro` — **Host-header SSRF** in prerendered error page fetch (high), **reflected XSS** via unescaped slot name (high), XSS in `define:vars` / spread props (moderate).
  - `@astrojs/node` — **memory-exhaustion DoS** (missing request body size limit) and cache poisoning (moderate).
  - Others: `mikro-orm/knex` SQL-injection via runtime identifier, `vite`/`esbuild` dev-server file-read (dev-only), `lodash`, `react-router`, `opentelemetry`, `i18next-http-backend`, `js-yaml`, `uuid`.
  - **Resolution:** the storefront-facing ones are fixed by **Astro 5.18 → 6.x** (`@astrojs/node` 9 → 10, `@astrojs/react` 4 → 5); the backend transitive ones by **Medusa 2.15.5 → 2.16**.
- **React 18 vs 19 skew (backend):** runtime `react@18.3.1` is compiled against `@types/react@19.0.5` (forced repo-wide by the root `pnpm.overrides` to satisfy the React-19 storefront). Confirmed on disk. Masked today by `skipLibCheck: true`, but a real types-vs-runtime mismatch that a future `@types/react` change could break.
- **Version contract not locked:** storefront uses `@medusajs/js-sdk: ^2.15.5` (caret) while the backend hard-pins all `@medusajs/*` to exactly `2.15.5`. Both resolve to 2.15.5 today, but the SDK can drift independently.

### Resilience & code quality
- **Storefront resilience is good:** `index.astro:21-26` wraps every homepage fetch in `.catch(logFail(...))` (page degrades if backend is down); `sitemap.xml.ts:44` and `cart.ts:46` deliberately swallow errors with explanatory comments; `CheckoutForm.tsx:44` falls back to manual payment if Stripe-provider detection throws. No empty/silent catches, no `@ts-ignore`, no TODO/FIXME debt anywhere.
- **`as any` clusters** (defeats type-safety where it matters most):
  - Backend: 12 casts across every CMS workflow step (`src/workflows/steps/{quote,blog-post,brand,store,testimonial,upsert-homepage}.ts`) — no compile-time check that validated input matches writable model fields.
  - Storefront: 7 casts clustered on the checkout/payment surface (`CheckoutForm.tsx:79,132,138`, `useCheckout.ts:86,89`, `cart.ts:40`).
- **Operational footgun:** `apps/backend/src/scripts/seed-bleunuit.ts:81-87` deletes **every** product whose title starts with `"Medusa "`, unguarded and with no dry-run — destructive if ever pointed at a production `DATABASE_URL`. Gate behind `NODE_ENV !== 'production'` or an explicit flag.
- **Missing DB constraints:** `slug` columns on `blog-post`/`brand`/`store` models have no `.unique()` or index, despite slug-based storefront lookups → duplicate slugs render ambiguous content and lookups are sequential scans.
- **Workflow compensation:** create steps define rollback; `update`/`upsert` steps have none. Harmless today (all workflows are single-step) — add compensation if any gains a second writing step.
- **No CI gates:** neither build type-checks, there are no `lint` scripts (`turbo lint` is a no-op), and `turbo test` skips the backend. The sitemap bug and type errors would never be caught automatically.

---

## Suggested order of work

1. **Secrets (#1)** — rotate + remove fallbacks + fix template. ~5 min, highest impact.
2. **Sanitize CMS HTML (#2)** — add a sanitizer to the two `set:html` sinks (+ JSON-LD `</script>` escape).
3. **Wire Redis (#3)** — required before any multi-instance / production deploy.
4. **Bound + rate-limit the quote endpoint (#4).**
5. CORS cleanup, sitemap null bug (`sitemap.xml.ts:37-38`), guard the destructive seed script.
6. Dependency bumps (Astro → 6.x, Medusa → 2.16) to clear the audit advisories.
7. Backend tests (fix the missing jest setup first) + a CI type-check/lint gate.

---

## Quick-win batch (low-risk, surgical)
These can be done together with minimal blast radius:
- #1 secrets (config + template)
- #2 HTML sanitization (two sinks + JSON-LD escape)
- CORS cleanup (drop `docs.medusajs.com`)
- `sitemap.xml.ts` null bug

The Redis wiring (#3) and quote rate-limiting (#4) are slightly larger and should follow.
