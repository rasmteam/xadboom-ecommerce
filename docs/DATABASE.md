# Database

PostgreSQL 16, managed with Prisma 7. The source of truth is [`packages/db/prisma/schema.prisma`](../packages/db/prisma/schema.prisma);
every change is a migration in `packages/db/prisma/migrations/`.

For Supabase (or any empty PostgreSQL) there is a ready-made script: [`supabase-schema.sql`](supabase-schema.sql). It is generated from the
Prisma schema (`prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script`). Regenerate it after every schema change. Run
either that script **or** `prisma migrate deploy` on a database, never both.

## Tables (17)

| Table | Purpose | Key points |
|---|---|---|
| `Settings` | One row (`id = 1`): currency mode (USD / TOMAN / BOTH), USD→Toman rate, cart lock minutes | All prices are stored in **USD cents**; Toman is derived at display time |
| `User` | Admins, editors and collectors | `role`, `kycStatus`, `tier`, `regionHub`; password stored as a hash; `lastActiveAt` |
| `Designer` | Collaborating architects/studios | Directory fields + the profile-page fields (tagline, practice, landmark works, statement, biography, monograph image, milestones, run note); `published`, `sortOrder` |
| `Category` | Typologies (Seating, Tables…) | `dimensionColumns` (JSON) drives the Excel dimension template |
| `Piece` | A product design | `sku`, `slug`, price (`priceUsdCents`, optional `priceTomanOverride`), dimensions, weight, `specs` (JSON), editorial fields (`storyTitle`, `story`, `quote`, `quoteBy`), `status` (DRAFT/PUBLISHED/ARCHIVED), soft delete (`deletedAt`) |
| `PieceImage` | Photos of a piece | ordered by `sortOrder` |
| `PieceAsset` | 3D models, spec sheets, tear sheets | `kind` (GLB, OBJ, FBX, 3DM, IFC, RVT, XLSX, PDF), checksum, `isViewerModel` marks the model shown on the product page |
| `Edition` | One numbered unit of a piece (03/12) | unique `(pieceId, number)`; status AVAILABLE / WITHHELD / RESERVED / SOLD |
| `Reservation` | A cart hold on one edition | session or user, `expiresAt` (15 min), status ACTIVE / EXPIRED / RELEASED / CONVERTED |
| `Order` | A checkout | number `XB-DISPATCH-…`, currency and rate **snapshot**, collector + shipping details, `publicToken` (guest access), `paymentDueAt`, provenance certificate id |
| `OrderItem` | One edition in an order | title/SKU/price **snapshots**; `editionId` is indexed (not unique), so a cancelled order keeps its history and the edition can be sold again |
| `Payment` | Gateway attempts | provider (`manual`, `zarinpal`), authority, ref id, raw response; unique `(provider, authority)` |
| `Shipment` | Crating and dispatch | carrier, crate status, tracking, `events` timeline (JSON) |
| `Inquiry` | Contact / private viewing / commission requests | number, type, assignee, `slaDueAt`, internal notes |
| `ImportJob` | Excel import history | dry-run / applied / failed report |
| `AuditLog` | Who changed what in the admin | actor, action, entity, diff |
| `EmailLog` | Every email the system sent or tried to send | recipient, template, status; used when SMTP is not configured |

## Rules the application relies on

* **No overselling:** an edition is reserved with `SELECT … FOR UPDATE SKIP LOCKED`; the unique `(pieceId, number)` and status transitions keep one buyer per edition.
* **Money:** integers only (USD cents, Toman). Orders store the currency and rate used, so history never changes when the rate does.
* **Soft delete:** pieces are archived with `deletedAt`, never removed, because orders reference them.
* **Foreign keys:** 17, all `ON UPDATE CASCADE`. Deleting a piece cascades to its images, assets and editions; deleting an order cascades to its items, payments and shipments; a designer, category or edition that is still referenced cannot be deleted (`RESTRICT`); deleting a user keeps their orders, inquiries and audit entries (`SET NULL`).

## Changes made on top of the first schema (Supabase snapshot)

The `schema.sql` that was shared earlier is a snapshot of an older state of this schema. It matches table-for-table and index-for-index, except:

| What | In the shared snapshot | Current |
|---|---|---|
| Table `EmailLog` (+ 2 indexes) | missing | added |
| `Piece.storyTitle`, `story`, `quote`, `quoteBy` | missing | added (editorial section of the product page) |
| `Designer` profile fields (10 columns) | missing | added (designer profile page) |
| `OrderItem.editionId` | unique | plain index (a cancelled/expired order blocked re-ordering that edition) |

Use [`supabase-schema.sql`](supabase-schema.sql) from this folder, which already includes all of the above.
