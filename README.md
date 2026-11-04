# Xadboom

Monorepo with a separate backend and frontend:

| Folder | What | Stack |
|---|---|---|
| `apps/api` | Backend REST API (auth, catalog, inquiries, later cart/orders/admin/Excel/3D) | NestJS 11 + Prisma + PostgreSQL |
| `apps/web` | Frontend only: storefront (SSR for SEO) + admin panel UI | Next.js 16 + Tailwind 4 |
| `packages/db` | Prisma schema, migrations, seed, shared client | Prisma 7 |
| `legacy/` | Original Express/HTML prototype, **design reference, do not edit** | |

The browser talks to one origin (`web`); Next proxies `/api/*` to the API, so session cookies need no CORS.
API docs (Swagger): `/api/docs`.

## Develop
```
cp .env.example .env
pnpm install
pnpm db:generate && pnpm db:migrate && pnpm db:seed     # needs a local Postgres (see DATABASE_URL)
pnpm dev:api     # http://localhost:4000/api
pnpm dev:web     # http://localhost:3000
```

## Docker
```
docker compose up -d --build   # db + migrations + api + web on :3000
```
One `Dockerfile`, targets: `api`, `web`, `migrate`. Hamravesh: deploy `api` and `web` as two apps (set `API_URL`
on web to the API's internal address) and run `migrate` as a pre-release job.
