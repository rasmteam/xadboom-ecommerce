# AGENTS.md

Operating guide for AI agents (and new developers) working in this repository.

## Read order

1. `README.md`: how to run it.
2. `ARCHITECTURE.md`: how it fits together.
3. `docs/DATABASE.md` for data work, `docs/DEPLOYMENT.md` for operations.
4. The prototype docs in `legacy/docs/` are **history**; they describe the old Express prototype, not this system.

## Golden rules

1. **Never edit `legacy/`.** It is the design reference. The storefront and admin UI are exact ports of it; change a screen's look only when asked.
2. **Business rules live in `apps/api`.** The web app never decides prices, stock or permissions.
3. **Database changes are migrations.** Edit `schema.prisma`, create a migration, regenerate (`pnpm db:generate`), rebuild `@xadboom/db`, and refresh `docs/supabase-schema.sql` + `docs/DATABASE.md`.
4. **Money is integers** (USD cents). Never use floats for prices.
5. **Validate every API input with zod.** Protect every admin route with `@Auth(...)`.
6. **Storefront pages stay server-rendered** (SEO): `force-dynamic`, data from `lib/api.ts`. Every new public page needs a title, description, canonical, and a sitemap entry.
7. **No secrets in git.** `.env` and `.local/` are ignored; document new variables in `.env.example`.
8. **Don't start Docker or pull images** on the maintainer's machine unless asked (disk space). Local development uses the embedded PostgreSQL (`pnpm dev:db`).
9. **Don't touch other apps or ports** on the machine; this project uses 3010 (web), 4010 (API), 54329 (database) locally.
10. The plan documents are kept outside git; do not commit them.

## Task routing

| Task | Touch | Verify |
|---|---|---|
| Storefront page | `apps/web/app/(store)`, `components/legacy` | open the page, `pnpm e2e` |
| Admin screen | `apps/web/app/admin/(shell)`, `components/admin/pages` | open the page, `pnpm e2e` |
| API rule | `apps/api/src/<module>` | `pnpm test`, then the flow in the browser |
| Schema | `packages/db/prisma` | migrate on a scratch database, regenerate SQL |

## Validation checklist

```
pnpm --filter @xadboom/web exec tsc --noEmit
pnpm test
pnpm build
pnpm e2e        # needs the database, API and web running
```

## Local gotchas

* The smoke test orders real stock and leaves unpaid orders; cancel them in the admin (or wait 48 h) before re-running many times.
* When restarting the servers on Windows, make sure the old Node process is gone; a leftover process keeps the port and serves the old build.
