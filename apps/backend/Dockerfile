# syntax=docker/dockerfile:1
#
# Image for @dtc/backend (Medusa server + admin dashboard, served at /app).
#
# This is a pnpm workspace package, so the Docker build CONTEXT must be the
# monorepo root (the build needs the root pnpm-lock.yaml + pnpm-workspace.yaml).
# Build from the medusa/ root, pointing -f at this file:
#
#   docker build -f apps/backend/Dockerfile -t bleunuit-backend .
#
# `medusa build` emits a self-contained app into apps/backend/.medusa/server
# (its own package.json + the compiled admin dashboard). Its production deps are
# installed there with npm, which produces a flat node_modules that is safe to
# COPY across stages — unlike pnpm's symlinked store. That directory is what the
# runtime image actually runs. Run with: docker run -p 9000:9000 bleunuit-backend

FROM node:lts-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /repo

# --- install workspace deps + run `medusa build` ---
FROM base AS build
# Manifests first so the dependency layer caches across source-only changes.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/storefront/package.json ./apps/storefront/
RUN pnpm install --frozen-lockfile --filter @dtc/backend...

COPY apps/backend ./apps/backend
RUN pnpm --filter @dtc/backend build

# Install production deps inside the emitted server (npm = flat, copy-safe).
WORKDIR /repo/apps/backend/.medusa/server
RUN npm install --omit=dev

# --- minimal runtime image ---
FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /repo/apps/backend/.medusa/server ./
EXPOSE 9000
CMD ["npm", "run", "start"]
