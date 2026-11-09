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

## Develop (no Docker needed)
Requires Node 22+ and pnpm. A real PostgreSQL 16 runs as a normal process via `pnpm dev:db`.
```
pnpm install
cp .env.example .env            # defaults work for local development
pnpm dev:db                     # terminal 1: database (data in .local/pgdata)
pnpm setup:local                # terminal 2, once: migrate + seed + build everything
pnpm start:api                  # terminal 2: http://localhost:4010/api  (docs: /api/docs)
pnpm start:web                  # terminal 3: http://localhost:3010
```
Admin: http://localhost:3010/login with `admin@xadboom.local` / `change-me-now` (from `.env`).
For hot reload use `pnpm dev:api` and `pnpm dev:web` instead of the `start:*` commands.

## Docker
```
docker compose up -d --build   # db + migrations + api + web on :3000
```
One `Dockerfile`, targets: `api`, `web`, `migrate`. Hamravesh: deploy `api` and `web` as two apps (set `API_URL`
on web to the API's internal address) and run `migrate` as a pre-release job.

## More
* Deployment, environment variables, backups and releases (Hamravesh): [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
* Tests: `pnpm test` (API unit tests) and `pnpm e2e` (browser smoke test against a running stack)
* Email: set `SMTP_*` in `.env`; without it emails are recorded in the database (Admin API `GET /api/admin/emails`)
* Excel: dimension template and import/export are in the admin (Pieces list, and section 3 of a piece)
* 3D: upload a `.glb` on a piece; it appears in the interactive viewer on the product page
