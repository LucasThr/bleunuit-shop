# Repository Guidelines

This repository powers a modern marketing website for a **magasin de matelas**: it showcases products and brand value, but does **not** support online purchases (no checkout or cart).

## Project Structure & Module Organization
- `src/pages/` contains Astro routes; dynamic routes use brackets (e.g., `src/pages/blog/[slug].astro`).
- `src/components/` and `src/layouts/` hold reusable UI and page shells.
- `src/utils/` contains Directus data helpers (see `src/utils/directus-client.ts`).
- `src/styles/` is for global CSS; `public/` stores static assets (images, favicon).
- `migrations/` holds Directus schema/data migrations, applied with `npm run migrate` (see `DIRECTUS_SETUP.md`).
- Build output goes to `dist/`. Configuration lives in `astro.config.mjs` and `directus.config.ts`.

## Build, Test, and Development Commands
- `npm install` installs dependencies (Node.js 18+).
- `npm run dev` starts the Astro dev server at `http://localhost:4321`.
- `npm run build` creates the production build in `dist/`.
- `npm run preview` serves the production build locally.
- `npm run migrate` applies pending Directus migrations (`-- --env=staging|prod` to target another instance).

## Coding Style & Naming Conventions
- Use existing formatting in Astro/TypeScript files; keep code readable and consistent.
- Component filenames are `PascalCase` (e.g., `Header.astro`), while routes follow their URL shape.
- Directus collection fields follow `snake_case` (see `DIRECTUS_SETUP.md`).
- Styling is Tailwind-first; prefer utility classes over custom CSS unless global styles are required.

## Product & UX Positioning
- The site targets mattress-store customers: emphasize comfort, trust, in-store expertise, and local service.
- Keep copy and layouts **modern, clean, and attractive**; prioritize strong visual hierarchy, generous spacing, and high-quality imagery.
- This is **product display only** (no e-commerce checkout); avoid cart, payment, or stock/fulfillment flows.

## Testing Guidelines
- No automated test runner is configured in `package.json`.
- For changes, rely on manual checks: `npm run dev` for UI verification and `npm run build` to ensure a clean production build.
- If you introduce tests, document the command and location in this file.

## Commit & Pull Request Guidelines
- Commit messages are short, sentence-case, and start with a verb (e.g., "Add Dockerfile for containerized application setup").
- Use a colon for extra detail when needed (e.g., "Fix subcategory handling: guard against undefined values").
- PRs should include a clear summary, relevant screenshots for UI changes, and mention any Directus schema updates.

## Configuration & Security Notes
- Environment variables live in `.env`; keep secrets out of Git. Required: `PUBLIC_DIRECTUS_URL`.
- Directus setup and permissions are documented in `DIRECTUS_SETUP.md` and `DIRECTUS_PERMISSIONS.md`.
