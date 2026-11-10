# Architecture

How the Xadboom system fits together. (The original Express prototype, which this replaces, is documented in
[`legacy/docs/PROTOTYPE-ARCHITECTURE.md`](legacy/docs/PROTOTYPE-ARCHITECTURE.md).)

## 1. System at a glance

```
Browser ──► Next.js "web" (SSR, SEO)  ──► /api/* proxy ──► NestJS "api" ──► PostgreSQL
   │             │                                             │
   │             └─ server components call the API directly    ├─ uploads on disk (UPLOAD_DIR)
   │                (no-store, cookies forwarded)               ├─ SMTP (or EmailLog table)
   └─ one origin, one session cookie                            └─ Zarinpal (or manual invoice)
```

* **`apps/web`**: Next.js 16 (App Router), Tailwind 4. Storefront pages are server-rendered on every request for SEO; the admin is a
  set of server components with small client components for forms. It contains **no business logic**.
* **`apps/api`**: NestJS 11 REST API. All rules (stock, pricing, roles, payments) live here. Swagger at `/api/docs`.
* **`packages/db`**: Prisma schema, migrations, seed and the shared client (built to CommonJS).
* **`legacy/`**: the original prototype, kept only as the design reference. Do not edit.

The browser talks only to `web`; `app/api/[...path]/route.ts` forwards `/api/*` to `API_URL` at runtime. One origin means the session
cookie needs no CORS.

## 2. API modules (`apps/api/src`)

| Module | Responsibility |
|---|---|
| `auth` | Register, login (rate-limited), logout, `/auth/me`. JWT in an HttpOnly cookie `xb_session`. `@Auth("ADMIN","EDITOR")` re-reads the role from the database on every request |
| `catalog` | Public read model: pieces, designers, designer profile, featured, product detail with editorial content and viewer model |
| `commerce` | Cart (reservations), checkout, orders, payment (manual / Zarinpal), sweeper that releases expired holds |
| `inquiries` | Contact form intake with SLA clock |
| `settings` | Currency mode and rate |
| `admin` | Pieces CRUD, Excel import/export, 3D/asset upload, orders, shipments, inquiries, designers, categories, users, overview, holds |
| `mail` | Order and inquiry emails; logs to `EmailLog` when SMTP is not configured |
| `health`, `prisma`, `common` | Health check, DB client, zod validation pipe, money helpers |

Every input goes through a zod schema (`common/zod.pipe.ts`). Throttling: login 5 / 5 min, register 5 / h, inquiries 5 / 10 min.

## 3. The purchase flow

1. **Reserve.** "Acquire" locks the lowest free edition (`FOR UPDATE SKIP LOCKED`) for 15 minutes, per browser session (`xb_cart` cookie), max 3 pieces. A 30-second sweeper frees expired holds.
2. **Checkout.** Creates an `Order` with a snapshot of currency, rate and prices. The server always recomputes the total; the browser cannot send a price.
3. **Payment.** `PAYMENT_PROVIDER=manual` (default): invoice held 48 h. `zarinpal`: redirect + verify, 30-minute window.
4. **Paid.** `markPaid` sells the editions, issues the provenance certificate, creates the shipment, sends the email.
5. **Fulfilment** in the admin: crate staging → dispatch → delivered. Unpaid orders can be cancelled; the editions return to stock.

## 4. Money

Prices are stored in **USD cents**. The admin chooses USD, Toman or both; Toman = USD × the rate set in Settings, optionally overridden per piece.
An order stores the currency and rate it was made with.

## 5. Admin

One shell (`components/admin/admin-shell.tsx`: sidebar + header) wraps every admin screen. Screens are exact conversions of the prototype pages
bound to real data (`components/admin/pages/*`). Roles: ADMIN sees everything; EDITOR cannot manage users or read the email log.

Content that appears on the storefront is edited here: pieces (with editorial story and quote), designers (with full profile-page content), categories, 3D models, Excel imports.

## 6. SEO

Server-rendered HTML; per-page title, description, canonical and Open Graph; `Product` JSON-LD on pieces, `Person` JSON-LD on designers; `/sitemap.xml`
(pieces and designers) and `/robots.txt` (admin, API, checkout and account blocked); unknown slugs return a real 404.

## 7. Security

Follows the OWASP Top 10: role checks in the API (not only the UI), parameterised queries through Prisma, validated input, HttpOnly + SameSite cookie
(Secure in production), CSP and the other security headers (`apps/web/next.config.ts`), rate limiting, upload type checks by file signature,
audit log of admin actions, dependency audit (`pnpm audit`). No external penetration test has been done.

## 8. Files, 3D and Excel

Uploads live under `UPLOAD_DIR` and are served at `/api/uploads/…`. A `.glb` marked as viewer model is shown with the self-hosted `<model-viewer>`
on the product page. Excel (`exceljs`): dimension template per category, catalog export, bulk import by SKU with a dry run.

## 9. Tests and tooling

`pnpm test` (vitest: money, payment, dimension parsing), `pnpm e2e` (Playwright smoke test of storefront, cart, checkout and every admin screen
against a running stack). Turborepo orchestrates builds.

## 10. Where to change things

| Need | Where |
|---|---|
| A new table/column | `packages/db/prisma/schema.prisma` → `prisma migrate dev` → update `docs/supabase-schema.sql` and `docs/DATABASE.md` |
| A business rule | the matching module in `apps/api/src` (+ a unit test) |
| A storefront page | `apps/web/app/(store)/…` and `components/legacy/*` (exact ports of the prototype pages) |
| An admin screen | `apps/web/app/admin/(shell)/…` and `components/admin/pages/*` |
| Emails | `apps/api/src/mail/mail.service.ts` |
| Deployment | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |

## 11. Known limits

* Zarinpal code is written but untested against a live merchant account.
* No external search, no wishlist, no saved addresses, no multi-language.
* Sample content (pieces, designers, one sample 3D chair) is seed data and must be replaced.
