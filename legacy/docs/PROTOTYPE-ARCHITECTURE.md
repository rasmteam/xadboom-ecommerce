# Architecture

This document explains how the Xadboom prototype is assembled, how a request becomes a page, where state lives, and where to extend it. Read this before changing route behavior or shared UI.

## 1. System at a glance

```
Browser
  │
  ├── GET /catalog ───────────────► Express (server.js)
  │                                   │
  │                                   ├─ SCREENS registry lookup
  │                                   ├─ read code.html from disk
  │                                   ├─ replace ../src/ with /src/
  │                                   ├─ enhanceHtml(): inject nav + bag + hooks
  │                                   └─ send HTML
  │
  ├── fetch /api/cart ───────────► in-memory cartState
  ├── fetch /api/inquiries ──────► in-memory inquiries[]
  └── fetch /api/pieces ─────────► in-memory pieces[]

Static mode (file:// or plain static hosting)
  └── src/prototype-navigation.js rewrites links to physical code.html files
      and renders its own bottom navigation.
```

There is no client-side router, bundler, database, session, or authentication layer. Each URL returns one complete HTML document. Client-side JavaScript only handles local UI state and calls the demo APIs.

## 2. Main components

| Component | File | Responsibility |
| --- | --- | --- |
| Express server | `server.js` | Routing, screen registry, HTML injection, in-memory data, demo APIs |
| Home screen | `index.html` | Storefront landing page, fully self-contained |
| Screen pages | `<folder>/code.html` | Self-contained page markup, inline Tailwind config, inline page scripts |
| Static navigator | `src/prototype-navigation.js` | Navigation for file:// and static hosting; link rewriting; no server required |
| Motion bootstrap | `src/xadboom-motion.js` | Loads vendored Motion, scroll reveals, header state, modals, rolling labels |
| Motion styles | `src/xadboom-motion.css` | Reveal/modal/hover/press styles and reduced-motion overrides |
| Motion runtime | `src/vendor/motion.js` | Minified third-party Motion build. Treat as a black box |
| Design specs | `*/DESIGN.md` | Two source-of-truth design documents |
| Reference images | `<folder>/screen.png` | Visual target for each screen; not used at runtime |
| Local assets | `src/assets/images/` | Logo, brand marks, and 9 local product/editorial images |

## 3. Request lifecycle (server mode)

1. `app.use(express.json())` and `express.urlencoded()` enable JSON/form bodies (`server.js:13`).
2. `SCREENS` (`server.js:364`) defines id, group, label, route, and file for all 14 screens.
3. For every screen, a handler is registered at its route (`server.js:784`). Extra aliases such as `/home`, `/assets`, `/chair`, and `/product/:id` are registered next to it.
4. The handler reads the target file from disk, replaces `../src/` asset references with `/src/` so nested routes resolve (`server.js:384`), and optionally swaps the hero image URL on the home and product screens (`server.js:792-794`).
5. `enhanceHtml()` (`server.js:382`) appends the prototype chrome immediately before `</body>`:
   - bottom "quick nav" pill with storefront and admin links
   - reservation bag drawer + backdrop
   - injected `<script>` that wires bag, acquire, spec, inquiry forms, admin links, product-card clicks, and the add-piece button
6. The enhanced document is returned as `text/html`.
7. Any top-level directory containing `code.html` is served directly at `/<dir>` (`server.js:824`).
8. `express.static(__dirname)` serves the rest of the repository (`server.js:836`).
9. Unknown routes redirect to `/` (`server.js:851`).

The enhancement is recomputed on every request. Nothing is written back to the HTML files.

## 4. Static mode

`src/prototype-navigation.js` makes the same pages usable without Express:

- It detects server navigation by looking for `#xadboom-quick-nav` (`src/prototype-navigation.js:55`).
- When absent, it rewrites route links to physical files and installs its own bottom navigator.
- It wires `data-path` attributes, admin sidebar labels, product cards, and the "Add New Piece" button.
- It reserves body padding for the fixed navigator and persists collapse state in `localStorage` under `xadboom_prototype_nav_collapsed`.

Consequence: navigation behavior exists in two places. Changes to route maps or admin link labels usually require updating both `server.js` and `src/prototype-navigation.js`.

## 5. Screen model

Every screen is a standalone HTML document with:

- its own `<head>`, Tailwind CDN script, and **inline `tailwind.config`**
- its own header/footer markup (storefront pages) or sidebar/header markup (admin pages)
- page-local `data-purpose` sections and page-local inline scripts
- `../src/xadboom-motion.css` and `../src/xadboom-motion.js` at the end of the document
- `../src/prototype-navigation.js` for static navigation fallback

There is no shared layout partial, component library, or template system. Shared *behavior* is centralized; shared *markup* is duplicated.

## 6. Navigation systems

| System | Active when | Created by | Where defined |
| --- | --- | --- | --- |
| Injected quick nav + bag | Express server | `enhanceHtml()` | `server.js:382-781` |
| Static prototype navigator | `file://` or static hosting | `src/prototype-navigation.js` | `src/prototype-navigation.js` |
| In-page headers/footers | Always | Each screen's markup | Each `code.html` / `index.html` |
| Admin sidebars | Always | Each admin screen's markup | Each admin `code.html` |

The two bottom navigators never render at the same time because both check for the other.

## 7. Reservation lock engine

State lives in `cartState` (`server.js:150`):

```js
{
  items: [{
    ...piece,
    reservedEdition: "03 of 12",
    reservedAt: 0,
    lockExpiresAt: 0
  }],
  completedOrders: []
}
```

- `POST /api/cart/add` replaces `items` with one item and sets a 15-minute lock (`server.js:218`).
- `GET /api/cart` filters expired items and returns `count`, `activeLock`, and `remainingSeconds` (`server.js:206`).
- A 10-second interval releases expired locks and logs to the server console (`server.js:162`).
- `POST /api/cart/remove` clears the bag.
- `POST /api/cart/checkout` generates `XB-DISPATCH-*` and `PROV-CERT-*`, pushes an order record, and clears the bag (`server.js:245`).
- The injected drawer polls `/api/cart` when opened; its countdown starts at 885 seconds and is corrected by the API response.

Cart semantics are intentionally single-item. There is no quantity, no multi-piece cart, and no inventory decrement.

## 8. Data layer

| Collection | Location | Mutations | Persistence |
| --- | --- | --- | --- |
| `pieces` | `server.js:27` | `POST /api/pieces` unshifts a generated piece | In memory only |
| `inquiries` | `server.js:110` | `POST /api/inquiries` unshifts a generated inquiry | In memory only |
| `cartState` | `server.js:150` | cart endpoints | In memory only |
| `completedOrders` | inside `cartState` | checkout | In memory only |

Restarting the server resets every collection to the seed data. There is no migration, validation layer, or concurrency control.

## 9. Styling pipeline

- Tailwind is loaded at runtime from `https://cdn.tailwindcss.com`; there is no PostCSS, `tailwind.config.js`, or compiled CSS.
- Each screen defines its own token aliases inside an inline `tailwind.config` script. The same hex value may be named `brand-canvas` on one page, `plaster-base` on another, and `surface-dim` on a third.
- `src/xadboom-motion.css` is the only shared stylesheet. It contains motion primitives plus two shared nav/footer typography rules.
- Many pages use arbitrary values (for example `text-[#0A0A0A]`, `bg-[#ECDAD4]`). Invalid forms such as `text-#0A0A0A` also exist in footers and silently do nothing. New code should use valid bracket syntax or a configured token.
- The admin screens use additional semantic status colors (terracotta, sage, amber) that are not part of the core storefront palette.

See `docs/DESIGN-SYSTEM.md` for the token and component reference.

## 10. Asset strategy

- Local images: `src/assets/images/` (brand marks, hero chair, editorial plates).
- Remote images: roughly 75 unique `lh3.googleusercontent.com` URLs across the screens.
- The home and product handlers replace one specific remote hero URL with `/assets/xadboom_hero_piece.jpg` (`server.js:792-794`). Other remote images are not cached or proxied.
- `GET /assets/xadboom_hero_piece.jpg` serves the local hero file directly (`server.js:18`).
- `screen.png` files are design references only and are never referenced by application code.
- When running from `file://`, relative `../src/...` paths work. When served by Express, `../src/` is rewritten to `/src/`. Keep the relative form in screen files.

## 11. Extension points

| Need | Do this |
| --- | --- |
| Add a screen | Create `<folder>/code.html`, add it to `SCREENS` in `server.js`, add it to `screens` in `src/prototype-navigation.js`, and add aliases if needed |
| Change shared prototype chrome | Edit the injection inside `enhanceHtml()` in `server.js` |
| Change static-mode navigation | Edit `src/prototype-navigation.js` |
| Add a reusable interaction | Add it to `src/xadboom-motion.js` or the motion stylesheet, then opt in with data attributes |
| Add an API | Add an Express handler in `server.js` and document it in `docs/API.md` |
| Change storefront look | Edit the target `code.html` and its inline Tailwind config; consult `docs/DESIGN-SYSTEM.md` |
| Change data seed | Edit the `pieces` and `inquiries` arrays in `server.js` |

Detailed recipes live in `docs/WORKFLOWS.md`.

## 12. Constraints and known quirks

- **No persistence or auth.** Any POST is accepted; reloading resets data.
- **CDN dependency.** Offline use loses Tailwind, fonts, icons, and most imagery.
- **Text-based event wiring.** The injected script finds elements by visible text (`bag`, `acquire`, `spec`, `3d`, `tear sheet`, `Add New Piece`). Copy changes can silently break behavior.
- **Hardcoded product allocation.** Acquire buttons always add `LV-0312`, regardless of the page.
- **Spec vs 3D downloads.** The injected hook sends most spec/3D/tear-sheet buttons to the CSV spec endpoint; the OBJ endpoint is available but not wired from the UI.
- **Form interception is broad.** Any form with an email input and no `action` is treated as an inquiry, including newsletter forms.
- **Admin add-piece is visual only.** `add_new_piece_xadboom_atelier_admin/code.html` contains inputs and buttons but no `<form>` and no submit handler, so it does not call `POST /api/pieces`.
- **Admin sidebar coverage is partial.** Some icon-only links and `data-path` variants are not mapped by the injection; the bottom quick nav always provides all admin routes.
- **HTML validity issues.** Some anchors carry duplicate `href` attributes; browsers use the first, but validators and rewrites can be confused.
- **Public repository exposure.** Static hosting exposes screenshots, source, and server code.
- **No tests, lint, or typecheck.** Use the manual smoke checklist in `AGENTS.md`.

## 13. File reference map

| Concern | Primary file | Supporting files |
| --- | --- | --- |
| Routes and screens | `server.js` (`SCREENS`, route loop) | `src/prototype-navigation.js` |
| Shared injected UI | `server.js` (`enhanceHtml`) | `src/xadboom-motion.css` |
| Cart and checkout | `server.js` (cart endpoints) | injected drawer script |
| Inquiry intake | `server.js` (inquiry endpoints) | contact screen form |
| Spec/3D downloads | `server.js` (download endpoints) | injected hook |
| Motion behavior | `src/xadboom-motion.js` | `src/xadboom-motion.css`, `src/vendor/motion.js` |
| Visual language | two `DESIGN.md` files | `docs/DESIGN-SYSTEM.md` |
| Screen behavior | each `code.html` | `docs/PAGES.md` |
| Local imagery | `src/assets/images/` | hero replacement in `server.js` |
