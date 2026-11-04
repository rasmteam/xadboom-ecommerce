# Xadboom

Monorepo: Next.js 16 storefront + admin + API, PostgreSQL (Prisma), Docker.

- `apps/web` — Next.js app (storefront, `/admin`, route handlers)
- `packages/db` — Prisma schema, client, seed
- `legacy/` — original Express/HTML prototype; **design reference, do not edit**
  (run with `pnpm legacy` after `cd legacy && npm i`)

## Develop
```
cp .env.example .env        # fill in secrets
pnpm install
pnpm db:generate
pnpm dev                    # http://localhost:3000
```

## Run with Docker
```
docker compose up -d --build   # db + migrations + web on :3000
```
Hamravesh builds the same root `Dockerfile` (runtime image = default target; `--target migrate` for the migrations job).
