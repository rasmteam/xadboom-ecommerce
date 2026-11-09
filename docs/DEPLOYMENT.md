# Deployment and operations (Hamravesh)

Xadboom is three deployables built from the one root `Dockerfile`:

| Image target | What it runs | Port |
|---|---|---|
| `api` | NestJS backend (`/api/*`) | 4000 |
| `web` | Next.js frontend; also proxies `/api/*` to the API | 3000 |
| `migrate` | one-off job: applies database migrations | – |

The browser only ever talks to `web`. `web` forwards `/api/*` to the API at runtime, so the two services share one public
domain and the session cookie needs no CORS setup.

## 1. Create the pieces on Hamravesh

1. **PostgreSQL 16**: use Hamravesh's managed PostgreSQL (preferred, backups included) or a Postgres app with a persistent
   disk. Note its internal host, database name, user and password.
2. **API app** from the repo, Dockerfile target `api`, port 4000. Attach a **persistent disk** mounted at `/data/uploads`
   (photographs, 3D models, spreadsheets live there). Health check: `GET /api/health`.
3. **Web app** from the same repo, target `web`, port 3000, public domain + HTTPS. Health check: `GET /healthz`.
4. **Migration job**: run the `migrate` target once before every release that changes the database
   (`pnpm exec prisma migrate deploy`). It needs only `DATABASE_URL`.
5. **First data**: run the seed once for the first administrator and sample catalogue
   (`pnpm --filter @xadboom/db seed`, with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` set; the seed refuses to run in
   production without a password). Remove the sample pieces in the admin afterwards.

If Hamravesh runs Docker Compose files directly you can instead use `docker-compose.yml` (`docker compose up -d --build`),
which starts the database, migration, API and web together.

## 2. Environment variables

| Variable | Service | Purpose |
|---|---|---|
| `DATABASE_URL` | api, migrate | `postgresql://USER:PASS@HOST:5432/DB?schema=public` |
| `AUTH_SECRET` | api | 32+ random characters (`openssl rand -base64 32`). Changing it signs everyone out |
| `COOKIE_SECURE` | api | `true` in production (https). Default is `true` when `NODE_ENV=production` |
| `API_PORT` | api | default 4000 |
| `UPLOAD_DIR` | api | `/data/uploads` (the persistent disk) |
| `APP_URL` | api, web | public site URL, e.g. `https://shop.example.com` (emails, payment callback, SEO URLs) |
| `API_URL` | web | internal address of the API, e.g. `http://xadboom-api:4000` |
| `PAYMENT_PROVIDER` | api | `manual` (invoice) or `zarinpal` |
| `ZARINPAL_MERCHANT_ID`, `ZARINPAL_SANDBOX` | api | only for `zarinpal`; set `ZARINPAL_SANDBOX=false` for live payments |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | api | outgoing email. Without `SMTP_HOST` emails are only recorded, see below |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | seed job | first administrator |

## 3. Online payments (Zarinpal)

1. Get a merchant ID from Zarinpal, set `PAYMENT_PROVIDER=zarinpal`, `ZARINPAL_MERCHANT_ID`, and try with
   `ZARINPAL_SANDBOX=true` first.
2. The gateway returns the buyer to `APP_URL/api/payments/zarinpal/callback`; that URL must be reachable from the internet.
3. Zarinpal settles in Toman only, so online orders are always charged in Toman at the rate set in Admin → Settings.
4. Keep `PAYMENT_PROVIDER=manual` until the sandbox payment succeeds end to end (the gateway logic is covered by unit tests
   with a mocked gateway; it has not been run against Zarinpal's live service).

## 4. Email

Set the `SMTP_*` variables and `MAIL_FROM`. Emails sent: order received, payment confirmed, dispatched, inquiry
acknowledgement, account welcome. Every email, sent or not, is recorded in the `EmailLog` table and visible to
administrators at `GET /api/admin/emails`; a mail failure never blocks an order.

## 5. Backups and restore

* Database: use Hamravesh's managed backups, plus a periodic dump:
  `pg_dump --format=custom "$DATABASE_URL" > xadboom-$(date +%F).dump`
  Restore: `pg_restore --clean --no-owner -d "$DATABASE_URL" xadboom-YYYY-MM-DD.dump`
* Uploads: back up the persistent disk (`/data/uploads`). Without it the database still works but photographs, 3D models
  and spreadsheets are lost.
* Test a restore on a scratch database before you need one.

## 6. Releasing a change

1. Deploy the new `api` and `web` images (migrations first when the release contains `packages/db/prisma/migrations/*`).
2. Run the migration job, then switch traffic to the new images.
3. Verify: `GET /api/health` returns `database: "up"`, open the home page, sign in to the admin.
4. Roll back by redeploying the previous images. Migrations are additive; do not roll the database back without a restore.

## 7. Operations notes

* Cart holds last 15 minutes (a background job releases expired ones every 30 seconds; no extra scheduler is needed).
  Unpaid manual orders keep their editions for 48 hours, then are cancelled and the editions released automatically.
* Login is limited to 5 attempts per 5 minutes per IP, sign-up to 5 per hour, the contact form to 5 per 10 minutes.
  Behind Hamravesh's proxy the first forwarded address is trusted (`trust proxy`).
* The API keeps its rate-limit counters in memory: run a single API instance, or move the counters to a shared store before
  scaling out.
* Security headers (CSP, frame-deny, nosniff, referrer policy, HSTS) are set by the web app.
* Smoke test a deployed site: `BASE_URL=https://shop.example.com ADMIN_EMAIL=... ADMIN_PASSWORD=... pnpm e2e`.
* Unit tests: `pnpm test`.
