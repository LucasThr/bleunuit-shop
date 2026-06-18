# syntax=docker/dockerfile:1
#
# Image for @dtc/storefront (Astro SSR, node standalone adapter).
#
# This is a pnpm workspace package, so the Docker build CONTEXT must be the
# monorepo root (the build needs the root pnpm-lock.yaml + pnpm-workspace.yaml).
# Build from the medusa/ root, pointing -f at this file:
#
#   docker build -f apps/storefront/Dockerfile -t bleunuit-storefront \
#     --build-arg PUBLIC_MEDUSA_URL=https://your-medusa-host \
#     --build-arg PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_xxx \
#     --build-arg PUBLIC_MEDUSA_REGION_ID=reg_xxx \
#     --build-arg PUBLIC_SITE_URL=https://www.bleunuit.fr \
#     .
#
# Astro inlines PUBLIC_* env vars at build time, so they are supplied as build
# args (the Medusa publishable key and region id are public values, safe to
# bake into the image). Run with: docker run -p 4321:4321 bleunuit-storefront

FROM node:lts-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /repo

# --- install dependencies + build the storefront ---
FROM base AS build
# Manifests first so the dependency layer caches across source-only changes.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/storefront/package.json ./apps/storefront/
COPY apps/backend/package.json ./apps/backend/
RUN pnpm install --frozen-lockfile --filter @dtc/storefront...

ARG PUBLIC_MEDUSA_URL=http://localhost:9000
ARG PUBLIC_MEDUSA_PUBLISHABLE_KEY=
ARG PUBLIC_MEDUSA_REGION_ID=
ARG PUBLIC_SITE_URL=
ENV PUBLIC_MEDUSA_URL=$PUBLIC_MEDUSA_URL \
    PUBLIC_MEDUSA_PUBLISHABLE_KEY=$PUBLIC_MEDUSA_PUBLISHABLE_KEY \
    PUBLIC_MEDUSA_REGION_ID=$PUBLIC_MEDUSA_REGION_ID \
    PUBLIC_SITE_URL=$PUBLIC_SITE_URL

COPY apps/storefront ./apps/storefront
RUN pnpm --filter @dtc/storefront build

# Self-contained production node_modules for the runtime image.
RUN pnpm deploy --filter=@dtc/storefront --prod /prod

# --- minimal runtime image ---
FROM base AS runtime
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
WORKDIR /app
COPY --from=build /prod/node_modules ./node_modules
COPY --from=build /repo/apps/storefront/dist ./dist
COPY --from=build /repo/apps/storefront/package.json ./package.json
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
