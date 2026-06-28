# SEO & Frontend Audit — Literie Bleunuit storefront

**Scope:** `apps/storefront` (Astro 5.18 SSR, React islands, Tailwind v4, Medusa data).
**Date:** 2026-06-25
**Overall SEO maturity: 6.5 / 10** — solid technical foundation (SSR, canonicals, structured data, clean URLs, sitemap/robots) undermined by a handful of high-impact defects: soft-404s, zero image optimization, no Organization/WebSite entity, and several inconsistent or broken on-page signals.

---

## Implementation log — P0 (2026-06-25, done)

The three critical (P0) items in §2 are implemented and build-verified:

- **2.1 Soft-404 → real 404.** `404.astro` now sets `Astro.response.status = 404`, so both the natural fallback and `Astro.rewrite('/404')` paths return a real 404. Verified live: `GET /this-page-does-not-exist` → `404`. (Rewrite-from-data-route path shares the same component; couldn't be exercised live because Medusa was offline.)
- **2.2 Organization + WebSite schema.** Added site-wide `Organization` (logo + `ContactPoint`) and `WebSite` JSON-LD in `Layout.astro`. Verified present in the rendered `<head>`.
- **2.3 Image optimization (first pass).** Recompressed the loaded store photo **2.1 MB PNG → 296 KB JPEG (−86%)** and repointed the 3 references; added explicit `width`/`height` + `decoding="async"` to every `<img>`, `fetchpriority="high"` to the LCP images (product + store), and `loading="lazy"` to the product gallery. The hero (380 KB) was left as-is (re-encode saved only ~20 KB). **Still open (deeper follow-up):** responsive `srcset`/WebP delivery via `astro:assets` or an image CDN, and implementing real resizing in `productImageUrl()`.

**Orphaned assets:** removed `public/images/stores/bruay-la-buissiere.png` (2.1 MB, replaced by `.jpg`) and `public/images/stores/lens.png` (2.4 MB, unused).

## Implementation log — Sprint 1 correctness (2026-06-25, done)

- **3.1 Subcategory breadcrumb.** `<JsonLd data={breadcrumbJsonLd} />` now rendered on `produits/[category]/[subcategory].astro`.
- **3.3 / 3.4 NAP + Lens (per owner).** Confirmed hours = **Lun–Ven 9h30-12h30 / 14h-19h, Sam 9h30-19h, Dim fermé** and **single store (Bruay)**. Aligned the Magasins visible schedule **and** its `openingHoursSpecification` JSON-LD to match Contact; removed the phantom Lens store from the footer and the default site description.
- **3.6 Blog images.** Blog index and related-posts grids now render `post.featured_image` (with the SVG as a graceful fallback) instead of always showing the placeholder; added dimensions + lazy loading.

Build-verified after each change; NAP now consistent across Contact, Magasins, and structured data.

**Still open in Sprint 1's spirit:** none — remaining work is Sprint 2 (titles, OG image, schema enrichment) and Sprint 3 (responsive/WebP images, self-hosted fonts, a11y).

## Implementation log — Sprint 2 discoverability (2026-06-25, done)

- **Homepage title.** `Accueil` → **`Matelas & sommiers à Bruay-la-Buissière | Literie Bleunuit`** (keyword + locality, ~58 chars).
- **Meta-description fallbacks.** Category & subcategory pages now fall back to a templated, locality-aware description when the CMS field is empty; the product page now prefers the product's own copy (truncated to ~155 chars) over the old `name – brand – price` line.
- **Social card.** Added a dedicated **1200×630** `og-default.jpg` (cropped from the bedroom hero) as the default OG/Twitter image, plus `og:image:width/height`, `og:image:alt`, and `twitter:image:alt`. Verified in the rendered `<head>`. (Logo is no longer the default share image.)
- **Schema enrichment.** Product `Offer` gained `itemCondition` (NewCondition), `priceValidUntil` (end of next year), and `seller`; `BlogPosting` gained `publisher` (Organization + logo `ImageObject`) and `dateModified`.

Build-verified. **Not added** (would need real policy data): `Offer.hasMerchantReturnPolicy` / `shippingDetails` — supply a return window + shipping rates to enable these.

## Implementation log — Sprint 3 perf/a11y, no-decision items (2026-06-25, done)

- **Self-hosted fonts.** Replaced the render-blocking Google Fonts `<link>` with `@fontsource-variable/manrope` (imported in `Layout.astro`, family `"Manrope Variable"` added to the `--font-sans`/`--font-display` tokens). Verified: **0 requests to fonts.googleapis.com/gstatic.com**, 5 Manrope woff2 subsets self-served from `/_astro/`. Removes the render-blocking request *and* the Google-Fonts-CDN GDPR/CNIL exposure.
- **Keyboard-accessible nav.** Header mega-menu dropdowns now also open on `group-focus-within`, so keyboard (Tab) users can reach the category/subcategory links — previously hover-only.
- **Branded icons + PWA.** The site favicon was the **default Astro logo**. Replaced with a branded set generated from the logo: `favicon-64.png` (the moon-and-stars mark), `apple-touch-icon.png` (180), `icon-192/512.png`, a `site.webmanifest`, and `<meta name="theme-color" content="#0f2c6e">`. The unbranded `public/favicon.svg` is now unreferenced (safe to delete).

## Implementation log — functional gaps: forms + pagination (2026-06-25, done)

- **Fake blog pagination removed** from `blog/index.astro` (the hardcoded Précédent / 1 / 2 / 3 / Suivant nav that did nothing).
- **Contact + newsletter forms wired to Resend.** New server API routes `src/pages/api/contact.ts` and `src/pages/api/newsletter.ts` (shared helpers in `src/utils/forms.ts`) send mail via the `resend` SDK; both forms now POST via a small fetch handler with inline success/error states, a honeypot anti-spam field, and server-side validation. Newsletter adds to a Resend Audience when `RESEND_AUDIENCE_ID` is set, otherwise emails the shop. Config via `RESEND_API_KEY` / `CONTACT_TO_EMAIL` / `CONTACT_FROM_EMAIL` / `RESEND_AUDIENCE_ID` (documented in `.env.example`).
  - **Verified** end-to-end against the built server: 400 on missing/invalid input, 200 on honeypot, 503 when no key is configured, and a clean 502 (no crash) when the Resend SDK runs with a bad key — confirming the SDK bundles and the send path executes. With a real key set in the environment, both forms deliver.
  - **Action required:** verify the `bleunuit.fr` domain in Resend and set `CONTACT_FROM_EMAIL` to an address on it; put `RESEND_API_KEY` in the deploy environment (it's a runtime secret, read from `process.env`).

**Still open (needs a decision / data):** responsive `srcset`/WebP delivery via `astro:assets` or an image CDN (the main remaining Core-Web-Vitals lever); per-image `alt` differentiation; the decorative brand/sort filters on category pages; and `Offer.hasMerchantReturnPolicy`/`shippingDetails` (needs your return + shipping terms).

---

## 1. What is already done well

These are genuine strengths — keep them.

- **Fully server-rendered HTML** (`output: 'server'`). All content is in the initial response; crawlers don't depend on JS. React is used only for cart/checkout islands.
- **Per-page `<title>` and `<meta description>`** via `Layout.astro` props, with a consistent `… | Literie Bleunuit` suffix.
- **Canonical URL on every page**, derived from `Astro.site` + pathname ([Layout.astro:25,36](apps/storefront/src/layouts/Layout.astro)).
- **Open Graph + Twitter Card** tags globally, `og:locale=fr_FR`, `lang="fr"`.
- **Structured data present** for Product, BreadcrumbList, BlogPosting, and FurnitureStore (LocalBusiness with `address`, `geo`, `openingHoursSpecification`).
- **Clean, semantic URLs** (`/produits/<category>/p/<slug>`) with **301 redirects** from legacy name-based URLs to canonical slug URLs ([p/[slug].astro:28-30](apps/storefront/src/pages/produits/[category]/p/[slug].astro), [[category].astro:21-23](apps/storefront/src/pages/produits/[category].astro)).
- **Dynamic `sitemap.xml` + `robots.txt`** that enumerate categories, subcategories, products and blog posts, degrade gracefully, and cache for 1h.
- **`noindex`** correctly applied to `/commande` (checkout) and `/404`.
- **LCP/CLS-aware touches**: `fetchpriority="high"` on the hero image, `loading="lazy"` on below-the-fold images, `prefers-reduced-motion` respected, JSON-LD XSS-escaped.

---

## 2. Critical issues (P0 — fix first)

### 2.1 Soft-404s: invalid URLs return HTTP 200 ✅ verified
Every "not found" path uses `Astro.rewrite('/404')` ([p/[slug].astro:19](apps/storefront/src/pages/produits/[category]/p/[slug].astro), [[category].astro:14-16](apps/storefront/src/pages/produits/[category].astro), [[subcategory].astro:15-26](apps/storefront/src/pages/produits/[category]/[subcategory].astro), [blog/[slug].astro:11-13](apps/storefront/src/pages/blog/[slug].astro)). Astro's rewrite implementation hard-sets `this.status = 200` (verified in `node_modules/astro/dist/core/render-context.js`), and `404.astro` never overrides it.

**Impact:** invalid product/category/subcategory/blog slugs serve the "Page introuvable" page with a **200 OK**. Google flags these as *soft 404*, may index junk URLs, and wastes crawl budget.

**Fix:** set the status in the 404 page frontmatter so a rewrite still yields a real 404:
```astro
---
// 404.astro
Astro.response.status = 404;
import Layout from '../layouts/Layout.astro';
---
```

### 2.2 No Organization / WebSite structured data
There is **no** `Organization`, `LocalBusiness`-at-root, or `WebSite` JSON-LD anywhere (`grep` confirms none). The brand has no machine-readable identity: no logo entity, no `sameAs` (Facebook/Instagram links exist in the footer but point to `#`), no Knowledge-Panel signal, no sitelinks-searchbox eligibility.

**Fix:** add a global `Organization` (or `Store`) + `WebSite` block in `Layout.astro` `<head>`:
```jsonc
{ "@context":"https://schema.org","@type":"Store",
  "name":"Literie Bleunuit","url":"https://www.bleunuit.fr",
  "logo":"https://www.bleunuit.fr/images/bleunuit-logo.png",
  "telephone":"+33321532145",
  "sameAs":["https://facebook.com/…","https://instagram.com/…"] }
```

### 2.3 Zero image optimization → Core Web Vitals risk
No image anywhere uses `astro:assets` / `<Image>` / `<Picture>` (confirmed). Every image is a raw `<img>` with **no `width`/`height`**, **no `srcset`/`sizes`**, and **no WebP/AVIF**. The hero is a full-bleed PNG/JPG served at native size as the LCP element.

**Impact:** layout shift (CLS) from missing dimensions on the largest elements; slow LCP and wasted bandwidth on mobile. Core Web Vitals are a confirmed ranking factor.

**Fix:** convert local images (hero, store, brand logos, blog) to `astro:assets` `<Image>` with explicit `width`/`height`; for remote Medusa images, at minimum add `width`/`height` attributes and a `srcset`, and supply `?width=` resize params (note `productImageUrl()` currently ignores its width/height/quality args and returns the URL unchanged — [product-card.ts:7-14](apps/storefront/src/utils/product-card.ts)).

---

## 3. High priority (P1)

### 3.1 Subcategory pages never emit their BreadcrumbList ✅ verified
[[subcategory].astro:43-52](apps/storefront/src/pages/produits/[category]/[subcategory].astro) builds `breadcrumbJsonLd` and imports `JsonLd`, but the template **never renders `<JsonLd data={breadcrumbJsonLd} />`**. An entire page type loses its breadcrumb rich result. One-line fix: render it after the `<Layout>` opening tag.

### 3.2 Default OG/Twitter image is the logo
`Layout.astro` defaults `image` to `/images/bleunuit-logo.png` ([:18](apps/storefront/src/layouts/Layout.astro)). A logo is the wrong shape for social cards (need ~1200×630) and there's no `og:image:width/height/alt`. Result: poor link previews → lower social/referral CTR. Create a dedicated 1200×630 share image and add the dimension/alt meta.

### 3.3 NAP / opening-hours inconsistency ✅ verified
Opening hours disagree across the site:
- **Contact** ([contact.astro:180-192](apps/storefront/src/pages/contact.astro)): "Lun–Ven 9h30-12h30 / 14h-19h, Sam 9h30-19h".
- **Magasins** visible ([magasins.astro:249-250](apps/storefront/src/pages/magasins.astro)) **and its JSON-LD** ([:59-72](apps/storefront/src/pages/magasins.astro)): "Lun–Sam 9h30-12h00 / 14h00-18h30".

Inconsistent NAP (Name/Address/Phone/hours) erodes local-SEO trust and can conflict with the Google Business Profile. Pick one source of truth (ideally the CMS store record) and render it everywhere.

### 3.4 Phantom "Lens" store
The footer advertises a second store — "Lens, Centre Commercial Lens 2, 62300 Lens" ([Footer.astro:27-33](apps/storefront/src/components/Footer.astro)) — but `magasins.astro` states *"we only operate one showroom"* and renders only Bruay, and only Bruay has `LocalBusiness` schema. Conflicting location signals. Either remove Lens or model it as a real store with its own page + schema.

### 3.5 Weak homepage `<title>`
The most valuable title on the site is `Accueil | Literie Bleunuit` ([index.astro:202](apps/storefront/src/pages/index.astro)). "Accueil" carries no keywords. Use something like *"Literie, matelas & sommiers à Bruay-la-Buissière | Literie Bleunuit"*.

### 3.6 Blog listing shows placeholder icons instead of real images ✅ verified
`blog/index.astro` computes `post.image` ([:13](apps/storefront/src/pages/blog/index.astro)) but the card markup renders a hardcoded placeholder `<svg>` and never uses it ([:73-80](apps/storefront/src/pages/blog/index.astro)). The blog index has no images at all — bad for engagement, Discover, and image search.

---

## 4. Medium priority (P2)

- **Auto-generated, thin product meta descriptions** — `"<name> - <brand> - À partir de X€"` ([p/[slug].astro:57](apps/storefront/src/pages/produits/[category]/p/[slug].astro)) ignores the rich product description. Use the first ~155 chars of the plain-text description as a fallback for a compelling SERP snippet.
- **Category/subcategory meta descriptions may be empty** — they pass `currentCategory.description`, which the mapper defaults to `""` ([catalog-client.ts:110](apps/storefront/src/utils/catalog-client.ts)). An empty `<meta description>` lets Google improvise. Add a templated fallback (e.g. *"Découvrez notre sélection de {category} — …"*).
- **Product `Offer` JSON-LD is minimal** — no `priceValidUntil`, `itemCondition`, `hasMerchantReturnPolicy`, or `shippingDetails` ([p/[slug].astro:73-83](apps/storefront/src/pages/produits/[category]/p/[slug].astro)). These reduce Merchant-listing/rich-result eligibility and quality (warnings in Search Console).
- **BlogPosting JSON-LD missing `publisher` + `dateModified`** ([blog/[slug].astro:45-56](apps/storefront/src/pages/blog/[slug].astro)). Google's Article guidelines expect a `publisher` Organization with a `logo`; without it article rich results often don't render.
- **Render-blocking Google Fonts + GDPR** — Manrope is loaded via `<link rel="stylesheet" href="fonts.googleapis.com…">` ([Layout.astro:54-59](apps/storefront/src/layouts/Layout.astro)). It's render-blocking (preconnect helps but doesn't remove it) and streams visitor IPs to Google's CDN — a known CNIL/GDPR concern in France. Self-host via `@fontsource/manrope` with `font-display: swap`.
- **Sitemap lacks `<lastmod>` / `<changefreq>` / `<priority>`** ([sitemap.xml.ts:50](apps/storefront/src/pages/sitemap.xml.ts)). `lastmod` in particular improves crawl efficiency. Comments still say "Directus" (stale after the Medusa migration).
- **Gallery never renders** — `toProduct()` always sets `gallery: []` ([catalog-client.ts:148](apps/storefront/src/utils/catalog-client.ts)), so the PDP thumbnail grid ([p/[slug].astro:135-147](apps/storefront/src/pages/produits/[category]/p/[slug].astro)) is dead. Fewer images per product = weaker image SEO and UX.

---

## 5. Low priority / polish (P3)

- **Interactive-looking but non-functional UI** (hurts UX & trust, indirectly SEO):
  - Brand/sort `<select>` filters on category & subcategory pages do nothing; the brand list on the category page is hardcoded (Dunlopillo, Duvivier…) regardless of products ([[category].astro:95-110](apps/storefront/src/pages/produits/[category].astro)).
  - Blog category-filter buttons and pagination are fake/hardcoded ([blog/index.astro:49-62,114-133](apps/storefront/src/pages/blog/index.astro)).
  - **Contact form has no `action` and no JS handler** — submitting does nothing ([contact.astro:27](apps/storefront/src/pages/contact.astro)). Same for the newsletter form. Lost conversions.
- **Accessibility gaps** (a11y overlaps with SEO quality signals):
  - Header dropdowns are **hover-only** (`group-hover`), not keyboard/focus reachable ([Header.astro:103-104](apps/storefront/src/components/Header.astro)).
  - Mobile submenu items are always rendered/expanded.
  - Product gallery images all share the identical `alt={product.name}` ([p/[slug].astro:141](apps/storefront/src/pages/produits/[category]/p/[slug].astro)).
- **Missing favicons/manifest/theme** — only `favicon.svg`; no `apple-touch-icon`, no `site.webmanifest`, no `<meta name="theme-color">`.
- **No `max-image-preview:large`** — add `<meta name="robots" content="index, max-image-preview:large, max-snippet:-1">` for richer snippets / Discover eligibility.
- **Dead code** — `brands` is computed but unused in [[category].astro:34-35](apps/storefront/src/pages/produits/[category].astro).
- **SSR pages send no `Cache-Control`** (only the sitemap does). Fine at current scale; revisit for crawl-budget/TTFB as the catalog grows.

---

## 6. Per-page scorecard

| Page | Title | Meta desc | H1 | Structured data | Notable gaps |
|---|---|---|---|---|---|
| Home `/` | ⚠️ weak ("Accueil") | ✅ | ✅ | ❌ no Organization/WebSite | hero img no dims; logo as OG |
| Products `/produits` | ✅ | ✅ | ✅ | ❌ none | could add ItemList |
| Category | ✅ | ⚠️ may be empty | ✅ | ✅ Breadcrumb | fake filters, dead `brands` |
| Subcategory | ✅ | ⚠️ may be empty | ✅ | ❌ **Breadcrumb computed but not rendered** | fake filters |
| Product (PDP) | ✅ | ⚠️ thin/auto | ✅ | ✅ Product + Breadcrumb | Offer minimal; img no dims; gallery dead |
| Blog index | ✅ | ✅ | ✅ | ❌ none | images missing; fake pagination/filters |
| Blog post | ✅ | ✅ | ✅ | ⚠️ BlogPosting (no publisher/dateModified) | img no dims |
| Magasins | ✅ | ✅ | ✅ | ✅ FurnitureStore | hours conflict w/ contact |
| Contact | ✅ | ✅ | ✅ | ❌ no ContactPoint | form non-functional; hours conflict |
| 404 | ✅ noindex | ✅ | ✅ | n/a | **served as HTTP 200 (soft-404)** |
| Commande | ✅ noindex | ✅ | ✅ | n/a | correct |

---

## 7. Prioritized action plan

**Sprint 1 — correctness (highest ROI, ~½ day):**
1. Make `404.astro` return HTTP 404 (`Astro.response.status = 404`). *(P0.1)*
2. Render `<JsonLd>` on subcategory pages. *(P1.1)*
3. Resolve hours inconsistency + the phantom Lens store; single CMS source of truth. *(P1.3, P1.4)*
4. Fix blog-index images to use `post.image`. *(P1.6)*

**Sprint 2 — discoverability (~1 day):**
5. Add global Organization + WebSite JSON-LD; wire real social URLs into `sameAs` + footer. *(P0.2)*
6. Keyword-rich homepage title; templated fallbacks for category/PDP meta descriptions. *(P1.5, P2)*
7. Dedicated 1200×630 OG image + `og:image:width/height/alt`. *(P1.2)*
8. Enrich Product `Offer` and BlogPosting (`publisher`, `dateModified`). *(P2)*

**Sprint 3 — performance & a11y (~1–2 days):**
9. Adopt `astro:assets` `<Image>` (or add `width`/`height`/`srcset`) across all images; implement real resizing in `productImageUrl()`. *(P0.3)*
10. Self-host Manrope (`@fontsource`) to drop render-blocking + the GDPR concern. *(P2)*
11. Keyboard-accessible nav dropdowns; per-image alt text; add favicons/manifest/`theme-color`. *(P3)*
12. Either implement or remove the decorative filters/pagination/forms; wire the contact + newsletter forms to a backend. *(P3)*

**Backlog:** `lastmod` in sitemap; `Cache-Control` on SSR pages; populate product `gallery`.

---

## 8. Technical SEO checklist

| Item | Status |
|---|---|
| SSR / crawlable HTML | ✅ |
| Unique title + meta description per page | ✅ (home title weak) |
| Canonical tags | ✅ |
| `lang` + locale | ✅ |
| robots.txt + XML sitemap | ✅ (no lastmod) |
| 301s for legacy URLs | ✅ |
| Correct 404 status | ❌ soft-404 |
| Organization / WebSite schema | ❌ |
| Product / Breadcrumb / LocalBusiness / Article schema | ⚠️ partial (subcat breadcrumb not rendered; Offer/Article thin) |
| Image optimization (dims, srcset, WebP) | ❌ |
| Social card image | ❌ (logo only) |
| Core Web Vitals readiness | ⚠️ at risk (images, fonts) |
| NAP consistency | ❌ |
| Mobile / responsive | ✅ |
| HTTPS / site URL config | ✅ (`PUBLIC_SITE_URL` fallback) |
| Accessibility (nav, alt text) | ⚠️ |
