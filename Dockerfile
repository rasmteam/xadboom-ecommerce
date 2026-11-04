# syntax=docker/dockerfile:1.7
# One Dockerfile, three deployable images (pick with --target):
#   docker build --target api     -t xadboom-api .      NestJS backend
#   docker build --target web     -t xadboom-web .      Next.js frontend (SEO / SSR)
#   docker build --target migrate -t xadboom-migrate .  one-off job: applies DB migrations

ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS base
RUN apk add --no-cache libc6-compat openssl
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@10.18.0 --activate
WORKDIR /app

# ---- install workspace deps (cached unless manifests change) ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/db/package.json packages/db/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ---- build everything ----
FROM deps AS builder
COPY . .
# DATABASE_URL is not needed at build time
RUN pnpm --filter @xadboom/db build \
 && pnpm --filter @xadboom/api build \
 && pnpm --filter @xadboom/web build

# ---- migrations job: has the prisma CLI and schema ----
FROM builder AS migrate
WORKDIR /app/packages/db
CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]

# ---- API runtime ----
FROM builder AS api-prune
RUN pnpm --filter @xadboom/api deploy --legacy --prod /out/api

FROM node:${NODE_VERSION} AS api
RUN apk add --no-cache libc6-compat openssl wget
ENV NODE_ENV=production API_PORT=4000
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app && mkdir -p /data/uploads && chown app:app /data/uploads
COPY --from=api-prune --chown=app:app /out/api ./
ENV UPLOAD_DIR=/data/uploads
USER app
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/api/health || exit 1
CMD ["node", "dist/main.js"]

# ---- web runtime (default target: last stage) ----
FROM node:${NODE_VERSION} AS web
RUN apk add --no-cache libc6-compat wget
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder --chown=app:app /app/apps/web/.next/standalone ./
COPY --from=builder --chown=app:app /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=app:app /app/apps/web/public ./apps/web/public
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1
CMD ["node", "apps/web/server.js"]
