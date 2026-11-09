# Xadboom Interactive Prototype

Interactive prototype of the Xadboom curated interior architecture storefront and the Atelier Admin console. It pairs 14 high-fidelity HTML screens with a small Express server that serves them, injects a prototype navigation bar and a 15-minute reservation bag, and exposes in-memory demo APIs.

## What this is

- A **design-complete prototype**, not a production application.
- Static HTML pages (`code.html` per screen, plus a root `index.html`) styled with Tailwind's CDN build and Google Fonts.
- A thin **Express 4** server (`server.js`) for routing, shared UI injection, and demo data.
- **No database, no auth, no payment provider.** All data lives in memory and resets on restart.
- Two complementary design specs:
  - `warm_architectural_minimalism/DESIGN.md` - "Tectonic Atelier" system (brand tokens, DM Sans/Space Grotesk, warm plaster, rounded cards).
  - `collectible_design_architectural_monographs/DESIGN.md` - "Collectible Design & Architectural Monographs" (Space Grotesk/Newsreader, sharp edges, editorial pacing).

## Stack

| Layer | Technology |
| --- | --- |
| Server | Node.js + Express 4 (`type: module`) |
| Pages | Static HTML5 + CDN Tailwind (`cdn.tailwindcss.com`) + Google Fonts + Material Symbols |
| Client JS | Classic scripts (IIFE, no bundler, no ES modules) |
| Animation | Vendored Motion build at `src/vendor/motion.js`, bootstrapped by `src/xadboom-motion.js` |
| Data | In-memory arrays/objects in `server.js` |
| Build | None. `npm run build` only prints a verification message. |

## Quick start

Node.js 18 or newer is recommended.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Environment variables (optional):

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port |
| `HOST` | `0.0.0.0` | Bind address |

There are no credentials or external services. `.env.example` is informational; the server does not load `.env` files.

## Scripts

| Command | Behavior |
| --- | --- |
| `npm run dev` | Start the Express server |
| `npm start` | Same as `dev` |
| `npm run build` | No build; prints `Build verified` |

There is no lint, test, or typecheck script in this repository.

## Routes

Served by `server.js`. The same `code.html` files also work from the filesystem or any static host through `src/prototype-navigation.js`.

| Group | Route | Screen id | Source file |
| --- | --- | --- | --- |
| Storefront | `/` | `home` | `index.html` |
| Storefront | `/catalog` | `catalog` | `curated_architectural_assets_physical_typologies_xadboom/code.html` |
| Storefront | `/product` | `product` | `lumen_void_lounge_chair_product_detail_xadboom/code.html` |
| Storefront | `/designers` | `designers` | `designers_collaborating_visionaries_xadboom_1/code.html` |
| Storefront | `/designers-2` | `designers-2` | `designers_collaborating_visionaries_xadboom_2/code.html` |
| Storefront | `/contact` | `contact` | `contact_curatorial_inquiries_xadboom/code.html` |
| Admin | `/admin` | `admin-overview` | `xadboom_atelier_admin_operations_inventory_lock_harmonized/code.html` |
| Admin | `/admin/pieces` | `admin-pieces` | `pieces_catalog_xadboom_atelier_admin/code.html` |
| Admin | `/admin/pieces/new` | `admin-add-piece` | `add_new_piece_xadboom_atelier_admin/code.html` |
| Admin | `/admin/categories` | `admin-categories` | `categories_typologies_xadboom_atelier_admin/code.html` |
| Admin | `/admin/designers` | `admin-designers` | `designers_collaborators_xadboom_atelier_admin/code.html` |
| Admin | `/admin/orders` | `admin-orders` | `orders_dispatches_xadboom_atelier_admin/code.html` |
| Admin | `/admin/inquiries` | `admin-inquiries` | `inquiries_forms_xadboom_atelier_admin/code.html` |
| Admin | `/admin/users` | `admin-users` | `users_accounts_xadboom_atelier_admin/code.html` |

Aliases: `/home`, `/assets`, `/chair`, `/product/lumen-void`, `/product/:id`, `/designers-1`, `/designer-monograph`, `/admin/overview`. Any top-level directory containing `code.html` is also served directly at `/<directory>`.

Demo APIs: `/api/health`, `/api/pieces`, `/api/cart*`, `/api/inquiries`, `/api/download-spec/:id`, `/api/download-3d/:id`. See [docs/API.md](docs/API.md).

## Project layout

```
.
├── server.js                         # Express server, screen registry, data, HTML injection
├── index.html                        # Storefront home screen
├── <screen-folder>/code.html         # One self-contained page per screen
├── <screen-folder>/screen.png        # Reference screenshot for that screen
├── src/
│   ├── prototype-navigation.js       # Static/file:// navigation fallback
│   ├── xadboom-motion.js             # Motion bootstrap + reveal/modal/header interactions
│   ├── xadboom-motion.css            # Shared motion styles and reduced-motion rules
│   ├── vendor/motion.js              # Vendored Motion build (do not edit)
│   └── assets/images/                # Local brand/product imagery
├── warm_architectural_minimalism/DESIGN.md
├── collectible_design_architectural_monographs/DESIGN.md
├── docs/                             # Agent-oriented reference docs
└── package.json
```

Each screen folder is named after its generated design and is intentionally verbose; `server.js` is the authoritative route map.

## Demo behavior

- Every served screen gets an injected bottom navigation pill and a **reservation bag drawer**.
- "Bag" buttons open the drawer. "Acquire"/"Reserve" buttons add the Lumen Void chair to the bag.
- Adding a piece starts a **15-minute lock** (`lockExpiresAt`). Expired locks are released on a 10-second server interval.
- The cart holds one item at a time; adding replaces the current allocation.
- Checkout returns a fictional dispatch number and provenance certificate, then clears the bag.
- Storefront contact forms post to `/api/inquiries` through the injected script.
- Spec/tear-sheet/3D buttons download a CSV specification sheet; `/api/download-3d/:id` serves a stub OBJ model.

## Documentation

| Document | Read it for |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design, request lifecycle, injection model, extension points, constraints |
| [AGENTS.md](AGENTS.md) | Operating rules for AI agents: read order, task routing, conventions, validation |
| [docs/PAGES.md](docs/PAGES.md) | Per-screen inventory: sections, interactions, API dependencies |
| [docs/API.md](docs/API.md) | Endpoint contracts, payloads, data models |
| [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) | Tokens, typography, components, motion, per-page palettes |
| [docs/WORKFLOWS.md](docs/WORKFLOWS.md) | Step-by-step recipes for common changes |
| [docs/GLOSSARY.md](docs/GLOSSARY.md) | Domain vocabulary, ID formats, copy conventions |

## Important constraints

- Tailwind, Google Fonts, and roughly 75 remote images are loaded from the internet. The prototype is not fully styled or illustrated offline.
- Page data and cart state are **in-memory**; restarting the server resets everything.
- `express.static(__dirname)` serves the entire repository, including `server.js` and screenshots. This is prototype-only behavior.
- Shared headers, footers, and admin sidebars are duplicated inside every screen. A global visual change usually means editing each screen or the server-side injection.
- There is no automated test suite. Verify changes by running the server and visiting the affected routes.
