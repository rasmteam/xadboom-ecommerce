# Xadboom

Monorepo with a separate backend and frontend:

| Folder | What | Stack |
|---|---|---|
| `apps/api` | Backend REST API: auth, catalog, cart and orders, payments, admin, Excel, 3D assets, email | NestJS 11 + Prisma + PostgreSQL |
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

## Scripts
| Command | What it does |
|---|---|
| `pnpm dev:db` | Start the local PostgreSQL (port 54329, data in `.local/pgdata`) |
| `pnpm setup:local` | Build the db package, migrate, seed, build API and web |
| `pnpm start:api` / `pnpm start:web` | Run the built API (4010) / web (3010) |
| `pnpm dev:api` / `pnpm dev:web` | Hot-reload development servers |
| `pnpm db:generate`, `db:migrate`, `db:seed` | Prisma client, new migration, seed data |
| `pnpm test` / `pnpm e2e` | Unit tests / browser smoke test (needs the stack running) |
| `pnpm build`, `pnpm typecheck` | Build / type-check everything (Turborepo) |
| `pnpm legacy` | Run the original prototype for visual comparison |

## Environment variables
See `.env.example`. The important ones: `DATABASE_URL`, `AUTH_SECRET` (long random string), `COOKIE_SECURE` (true behind HTTPS), `UPLOAD_DIR`,
`API_URL` (where web finds the API), `APP_URL` (public address, used for links and the sitemap), `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`,
`SMTP_*` / `MAIL_FROM`, `PAYMENT_PROVIDER` (`manual` or `zarinpal`) with `ZARINPAL_MERCHANT_ID`.

## Main routes
Storefront: `/`, `/catalog`, `/product/<slug>`, `/designers`, `/designers/<slug>`, `/contact`, `/checkout`, `/order/<number>`, `/account`, `/login`, `/register`, `/terms`, `/privacy`, `/authenticity`, `/sitemap.xml`, `/robots.txt`.
Admin (`/admin`): overview, pieces (+ new/edit), categories, designers, orders, users, inquiries, settings.

## Documentation
| Document | For |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | How the system fits together, purchase flow, security, where to change things |
| [docs/DATABASE.md](docs/DATABASE.md) | Tables, rules, and the SQL script for Supabase (`docs/supabase-schema.sql`) |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Hamravesh deployment, environment, backups, releases |
| [AGENTS.md](AGENTS.md) | Rules and checklists for AI agents and new developers |
| [legacy/docs/](legacy/docs/) | Documentation of the original prototype (history) |

## More
* Deployment, environment variables, backups and releases (Hamravesh): [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
* Tests: `pnpm test` (API unit tests) and `pnpm e2e` (browser smoke test against a running stack)
* Email: set `SMTP_*` in `.env`; without it emails are recorded in the database (Admin API `GET /api/admin/emails`)
* Excel: dimension template and import/export are in the admin (Pieces list, and section 3 of a piece)
* 3D: upload a `.glb` on a piece; it appears in the interactive viewer on the product page
