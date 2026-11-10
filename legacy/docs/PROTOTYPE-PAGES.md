# Page Inventory

Reference for what each screen contains and which behaviors are real. Read only the row/section you need instead of opening the 40-60 KB HTML files.

All screens share these traits unless noted:

- Standalone HTML with its own inline Tailwind config and duplicated header/footer or sidebar.
- Load `../src/xadboom-motion.css`, `../src/xadboom-motion.js`, and `../src/prototype-navigation.js`.
- Under Express, receive the injected bottom quick nav, cart drawer, bag/acquire/spec hooks, form hook, and admin link wiring.
- Include a `screen.png` sibling that is the visual reference, not a runtime asset.

## Route table

| Screen | Route | Source | Group | Visual system |
| --- | --- | --- | --- | --- |
| Home | `/` (`/home`) | `index.html` | Storefront | Tectonic Atelier: DM Sans + Space Grotesk, rounded cards, brand tokens |
| Catalog | `/catalog` (`/assets`) | `curated_architectural_assets_physical_typologies_xadboom/code.html` | Storefront | Monograph: Space Grotesk + Newsreader, sharp panels |
| Product | `/product` (`/chair`, `/product/lumen-void`, `/product/:id`) | `lumen_void_lounge_chair_product_detail_xadboom/code.html` | Storefront | Plaster + obsidian, 0px radius, editorial plates |
| Designers 1 | `/designers` (`/designers-1`, `/designer-monograph`) | `designers_collaborating_visionaries_xadboom_1/code.html` | Storefront | Monograph directory with grid/index views |
| Designers 2 | `/designers-2` | `designers_collaborating_visionaries_xadboom_2/code.html` | Storefront | Monograph "atelier index" variant |
| Contact | `/contact` | `contact_curatorial_inquiries_xadboom/code.html` | Storefront | Monograph form + atelier network |
| Admin overview | `/admin` (`/admin/overview`) | `xadboom_atelier_admin_operations_inventory_lock_harmonized/code.html` | Admin | Warm admin ledger, terracotta/sage/amber status colors |
| Pieces catalog | `/admin/pieces` | `pieces_catalog_xadboom_atelier_admin/code.html` | Admin | Compact icon sidebar, blueprint tables |
| Add piece | `/admin/pieces/new` | `add_new_piece_xadboom_atelier_admin/code.html` | Admin | Icon sidebar, dense single-line sections |
| Categories | `/admin/categories` | `categories_typologies_xadboom_atelier_admin/code.html` | Admin | Icon sidebar, table + modal |
| Designers admin | `/admin/designers` | `designers_collaborators_xadboom_atelier_admin/code.html` | Admin | Monograph admin, warm cards |
| Orders | `/admin/orders` | `orders_dispatches_xadboom_atelier_admin/code.html` | Admin | Dark rail, ledger cards |
| Inquiries | `/admin/inquiries` | `inquiries_forms_xadboom_atelier_admin/code.html` | Admin | Dense intake tables + modals |
| Users | `/admin/users` | `users_accounts_xadboom_atelier_admin/code.html` | Admin | Tabbed account ledger |

Every source directory is also served directly at `/<directory-name>` by the `/:dir` handler.

## Storefront

### Home - `index.html`

Title: "Xadboom Design System & Atelier".

Key sections (`data-purpose` markers):

| Section | Purpose |
| --- | --- |
| `hero-section` | Oversized wordmark, studio intro, CTA cluster |
| `hero-gallery` | Four-image editorial grid with staggered reveal |
| `proposition-statement` | Manifesto copy and metric row |
| `curated-assets` (`#assets`) | Four product cards; Lumen Void card links to `/product` |
| `spec-tools-section` (`#spectools`) | 3D/BIM library, tear sheets, trade quotations |
| `curation-drop-flow` | Numbered acquisition/curation process |
| `about-curator` (`#about`) | Curator profile and studio philosophy |
| `testimonials` | Client quotes and rating row |
| `architect-profiles` (`#architects`) | Collaborating architect cards |
| `faq-acquisitions` | `<details>` FAQ about acquisition, shipping, 3D files |
| `architectural-dispatch` (`#dispatch`) | Newsletter/dispatch signup |
| `consultation-banner` (`#consultation`) | Private consultation CTA |
| `master-footer` | Newsletter, spec quick links, link matrix, credits |

Real behavior: motion reveals; header scroll state; bag opener via injected script; footer newsletter form is intercepted by the injected inquiry hook when served (it has an email input and no `action`).

Notes: uses local images (`xadboom-wordmark.png`, `textile-emblem.jpg`, `xadboom_hero_piece_*.jpg`). Contains many invalid `text-#0A0A0A`-style classes in the footer; do not copy them.

### Catalog - `curated_architectural_assets_physical_typologies_xadboom/code.html`

Title: none in `<head>`.

Structure: fixed storefront header, archival registry hero, sticky filter row, product/asset grid, spec library panels, footer.

Interactions:

- Filter pills change active styles only. They do **not** actually filter the grid; the inline script only toggles classes.
- Product card click on the Lumen Void card is wired to `/product` by the server injection and by `prototype-navigation.js`.
- Bag/spec hooks come from the server injection.

API dependencies: none directly.

Notes: all product imagery is remote (`lh3.googleusercontent.com`). Header markup has duplicate `href` attributes in places.

### Product - `lumen_void_lounge_chair_product_detail_xadboom/code.html`

Title: "Lumen Void Lounge Chair | Xadboom Architectural Editions".

Structure: fixed header, product gallery with plate viewer, acquisition panel, dimensions/materials specs, spatial 3D section (`#spatial-3d-section`), blueprint section (`#blueprint-section`), architect section (`#architect-section`), footer.

Interactions:

- Inline gallery script swaps `#primaryViewer`, `#plateLabel`, `#plateSubtitle`, and thumbnail borders (`swapImage(index)`).
- "ACQUIRE PIECE" is hooked by the server injection and adds `LV-0312` to the bag.
- "REQUEST SPEC SHEET", "3D", and tear-sheet buttons are hooked to the CSV spec endpoint.
- The `/product/:id` alias shows this same page for any id.

API dependencies: cart add, CSV spec download (via injection).

Notes: this is the only screen that should be treated as the product detail template. It uses a distinct plaster/obsidian token set.

### Designers 1 - `designers_collaborating_visionaries_xadboom_1/code.html`

Structure: header, hero, filter pills, grid view and index view panels, directory, footer.

Interactions:

- `.filter-pill` filters `.designer-card` by `data-discipline` (`all` or matching value).
- `#view-grid` / `#view-index` toggle `#grid-view-panel` and `#index-view-panel`.
- No API calls.

Notes: useful reference for pill filters and dual grid/index layouts.

### Designers 2 - `designers_collaborating_visionaries_xadboom_2/code.html`

Structure: header, atelier index (`#atelier-index`), editorial profiles, footer. This is a layout variant of Designers 1 with no filtering script.

### Contact - `contact_curatorial_inquiries_xadboom/code.html`

Structure: header, inquiry form, atelier network/sidebar, footer.

Form fields: `#client-name`, `#client-email`, `#client-phone`, `#client-territory`, `#piece-interest`, `#inquiry-scope`; a CAD/BIM dropzone is visual only.

Interactions:

- Inline `showConfirmation()` reveals `#confirmation-banner`.
- Server injection also intercepts the form (no `action`, has email input) and posts to `POST /api/inquiries`, changing the submit button text.
- Live atelier clocks update `#time-zrh`, `#time-thr`, `#time-nyc`.
- Typology pills toggle active styles.

API dependencies: inquiry create.

### Admin overview - `xadboom_atelier_admin_operations_inventory_lock_harmonized/code.html`

Title: "Xadboom Atelier - Master Piece Inventory & Reservation Ledger".

Structure: full sidebar (text labels), top header, KPI cards, inventory/reservation ledger, ledger table, activity/status sections, security banner.

Interactions: mostly visual. Server injection wires sidebar links by visible text; the injected quick nav also reaches every admin route. No API calls.

Notes: the sidebar has text labels, so text-based link wiring tends to work here. Table data is static seed content.

### Pieces catalog - `pieces_catalog_xadboom_atelier_admin/code.html`

Structure: icon-only sidebar, header, catalog toolbar, asset table/grid, BIM sidecar preview strip.

Interactions: server injection wires the "Add New Piece" button to `/admin/pieces/new`; filters are visual only. No API calls.

Notes: icon-only `data-path` values do not all match the injection map; use the bottom quick nav if a sidebar link appears dead.

### Add piece - `add_new_piece_xadboom_atelier_admin/code.html`

Structure: icon sidebar, header, multi-section registration form (identity, classification, provenance, curatorial monograph, media, edition/allocation, pricing, lead time), publish buttons.

Interactions: **none wired**. There is no `<form>` and no submit handler. The screen does not call `POST /api/pieces`. Treat as a visual specification for the future admin flow.

Notes: dense single-line HTML on this page; avoid reformatting.

### Categories - `categories_typologies_xadboom_atelier_admin/code.html`

Structure: icon sidebar, header, typology table, "add category" modal.

Interactions (inline script):

- `#open-add-modal-btn` opens `#add-category-modal`; close/cancel/backdrop close it.
- `#add-category-form` submit simulates save states ("Registering Schema...", "Saved!") and resets.
- `#typology-search-input` filters `#typologies-table` rows by text.

No API calls.

### Designers admin - `designers_collaborators_xadboom_atelier_admin/code.html`

Structure: left icon rail, header, collaborators grid/table, intake pipeline, `#add-designer-modal`.

Interactions: modal opened by an inline `onclick`; modal close/save buttons only hide the modal. No API calls.

### Orders - `orders_dispatches_xadboom_atelier_admin/code.html`

Structure: left rail, header, dispatch KPIs, order cards/table. Inline script only defines a page-specific Tailwind config. No API calls.

### Inquiries admin - `inquiries_forms_xadboom_atelier_admin/code.html`

Structure: left rail, header, inquiry queue, selected inquiry detail, `#inquiry-modal`, `#manual-inquiry-modal`.

Interactions: modal open/close via inline `onclick`. No API calls; does not load `GET /api/inquiries`.

### Users admin - `users_accounts_xadboom_atelier_admin/code.html`

Structure: left rail, header, account KPIs, tabs, `#accounts-master-table`.

Interactions (inline script):

- `.tab-btn` toggles active styles only.
- `#collector-filter-input` filters table rows by text.

No API calls.

## Cross-page behavior matrix

| Behavior | Home | Catalog | Product | Designers | Contact | Admin |
| --- | --- | --- | --- | --- | --- | --- |
| Server-injected bottom nav | yes | yes | yes | yes | yes | yes |
| Server-injected bag drawer | yes | yes | yes | yes | yes | yes |
| Bag opener hook | yes | yes | yes | yes | yes | yes |
| Acquire/reserve hook | no buttons | no buttons | yes | no buttons | no buttons | no |
| Spec/3D hook | no matching buttons | no matching buttons | yes | no matching buttons | no matching buttons | no |
| Inquiry form hook | newsletter gets caught | footer only | footer only | footer only | yes (real form) | no |
| Motion reveals | yes | yes | yes | yes | yes | minimal |
| Live API data | no | no | no | no | no | no |

## Static-mode notes

When opened without Express:

- `src/prototype-navigation.js` rewrites links to physical files and installs a prototype navigator.
- `href="#"` links are not resolved except the home mark, "See all assets", "Explore all collaborators", product cards containing "Lumen Void Lounge Chair", and "Add New Piece".
- Bag/acquire/spec/inquiry hooks are **not** available because they live in the server injection.
- Remote fonts/images still require internet.
