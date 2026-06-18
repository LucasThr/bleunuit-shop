# Repository Guidelines

This package (`@dtc/storefront`) is the Astro SSR marketing site for **Literie Bleu
Nuit** (a mattress store). It showcases products, brands, and store info, and
includes an optional Medusa-backed cart + checkout (proof-of-concept). It lives in
the `medusa/` pnpm + turbo monorepo alongside the Medusa backend (`@dtc/backend`);
**all content and catalog data come from Medusa.**

## Project Structure & Module Organization
- `src/pages/` contains Astro routes; dynamic routes use brackets (e.g., `src/pages/blog/[slug].astro`).
- `src/components/` and `src/layouts/` hold reusable UI and page shells (incl. the React cart/checkout components).
- `src/utils/` holds the Medusa data helpers: `cms-client.ts` (editorial content via `/store/cms/*`), `catalog-client.ts` (native Medusa products/categories), and `medusa.ts` (SDK + publishable key).
- `src/stores/` holds client cart state (nanostores). `src/styles/` is global CSS; `public/` stores static assets.
- Build output goes to `dist/`. Configuration lives in `astro.config.mjs`.

## Build, Test, and Development Commands
Run these from the monorepo root (`medusa/`), not this folder — it is a pnpm
workspace package:
- `pnpm install` installs all workspace dependencies (pnpm, not npm).
- `pnpm storefront:dev` starts the Astro dev server at `http://localhost:4321`.
- `pnpm dev` starts the backend and storefront together (turbo).
- `pnpm build` builds all apps; `pnpm --filter @dtc/storefront build` builds only this one.
- `pnpm --filter @dtc/storefront preview` serves the production build locally.

## Coding Style & Naming Conventions
- Match the existing Astro/TypeScript formatting; keep code readable and consistent.
- Component filenames are `PascalCase` (e.g., `Header.astro`), while routes follow their URL shape.
- Styling is Tailwind-first; prefer utility classes over custom CSS unless global styles are required.

## Product & UX Positioning
- The site targets mattress-store customers: emphasize comfort, trust, in-store expertise, and local service.
- Keep copy and layouts **modern, clean, and attractive**; prioritize strong visual hierarchy, generous spacing, and high-quality imagery.
- The site is primarily a **showcase**; the Medusa cart/checkout is a proof-of-concept — don't assume full e-commerce fulfillment flows are in scope.

## Testing Guidelines
- No automated test runner is configured in `package.json`.
- For changes, rely on manual checks: `pnpm storefront:dev` for UI verification and `pnpm --filter @dtc/storefront build` to ensure a clean production build.
- If you introduce tests, document the command and location in this file.

## Commit & Pull Request Guidelines
- Commit messages are short, sentence-case, and start with a verb (e.g., "Add Dockerfile for containerized application setup").
- Use a colon for extra detail when needed (e.g., "Fix subcategory handling: guard against undefined values").
- PRs should include a clear summary and relevant screenshots for UI changes.

## Configuration & Security Notes
- Environment variables live in `apps/storefront/.env`; keep secrets out of Git. Required: `PUBLIC_MEDUSA_URL`, `PUBLIC_MEDUSA_PUBLISHABLE_KEY`, `PUBLIC_MEDUSA_REGION_ID`. Optional: `PUBLIC_SITE_URL`, `PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- Content is edited in the Medusa admin (`/app`), not in this repository.
