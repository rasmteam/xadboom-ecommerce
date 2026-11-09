# Design System Reference

Use this file to make styling decisions without reading every page. The authoritative long-form specs remain:

- `warm_architectural_minimalism/DESIGN.md` - "Tectonic Atelier": warm plaster, DM Sans + Space Grotesk, rounded cards, brand tokens.
- `collectible_design_architectural_monographs/DESIGN.md` - "Collectible Design & Architectural Monographs": editorial Space Grotesk + Newsreader, 0px radius, asymmetric monograph layout.

When the two disagree, follow the page you are editing. Admin pages add their own operational palette on top.

## 1. Token quick reference

Core storefront palette (used with different aliases per page):

| Role | Hex | Typical alias |
| --- | --- | --- |
| Canvas / plaster | `#ECDAD4` | `brand-canvas`, `plaster-base`, `surface-dim` |
| Surface | `#FFF8F6` | `brand-surface`, `surface`, `canvas` |
| Soft tint | `#FAECE7` | `brand-tint`, `surface-tint-1` |
| Card tint | `#FFF1EC` | `brand-tint-card`, `surface-panel` |
| Hairline | `#D8C3BC` / `#D8C2BA` | `hairline`, `hairline-border` |
| Light hairline | `#E2CECB` / `#E8D6D0` | `brand-border`, `border-hairline` |
| Ink | `#0A0A0A` | `brand-dark`, `obsidian`, `primary`, `charcoal` |
| Body ink | `#1C1917` / `#231A16` | `brand-text`, `basalt`, `on-surface` |
| Muted | `#7A6E69` / `#78716C` | `brand-muted`, `secondary` |
| Terracotta accent | `#844C38` | `terracotta`, `secondary` on warm admin |
| Clay rose | `#C99187` | editorial accent |

Admin status colors:

| Role | Hex | Usage |
| --- | --- | --- |
| Terracotta | `#844C38` | priorities, edition counts, active links |
| Sage | `#3B5E4F` | synced, confirmed, positive |
| Amber | `#B46914` | pending, new, attention |
| Dark rail | `#12100E` | orders admin rail / high-contrast surfaces |
| Gold accent | `#9E7852` | designer-admin editorial accent |

Semantic M3-style tokens (`surface`, `on-surface`, `primary`, `outline`, `error`) exist in several page configs. Treat them as page-local aliases, not a global theme.

## 2. Typography

| Family | Role |
| --- | --- |
| DM Sans | Body copy, UI labels, editorial paragraphs, storefront headings on the home page |
| Space Grotesk | Uppercase mono labels, indices, specs, dimensions, edition numbers, buttons on monograph pages |
| Newsreader | Curatorial quotes, monograph essays, provenance prose |
| JetBrains Mono | Dense admin figures/tables on some admin screens |
| Material Symbols Outlined | Icons via `material-symbols-outlined` |

Rules:

- Uppercase labels use tracking `0.08em` to `0.12em`; sizes are usually `9px` to `12px`.
- Display headings use negative tracking (`-0.02em` to `-0.06em`) and tight line heights.
- Numeric specs, edition runs, dimensions, and prices are tabular/mono.
- Use arrows inline only where the page already does (`↗`, `→`).
- Fonts load from Google Fonts; do not add new families without a clear reason.

## 3. Layout, spacing, and shape

- Max content widths observed: `1360px` (storefront/footer) and `1440px`/`1780px` (some catalog/admin layouts).
- 12-column grid on desktop; 6 on tablet; 4 on mobile.
- Outer margins: `1.25rem` mobile up to `4rem` desktop.
- Section rhythm: `4rem` to `6rem` vertical spacing, separated by `1px` hairlines rather than background switches.
- Depth: hairlines and tonal shifts. Avoid drop shadows except feather-weight admin/status cards.
- Radius:
  - Home, contact, general storefront: `rounded-lg`/`rounded-xl`, pills `rounded-full`.
  - Product, catalog, designers, monographs: `0px` to `0.25rem`.
  - Admin: `0.25rem` to `0.75rem` depending on screen.
- Cards should use warm tints (`#FFF1EC`, `#FAECE7`), never pure white, on storefront pages.

## 4. Shared component patterns

There is no shared component library. These are the patterns to copy from existing screens.

### Storefront header

- Fixed top bar, warm translucent background, `backdrop-blur`, hairline bottom border.
- Brand mark image + wordmark, uppercase Space Grotesk nav links, search icon, bag button, account avatar.
- Active nav link uses `.xdm-nav-active` from `src/xadboom-motion.css`.
- Markup is duplicated per storefront page; there is no partial.

### Footer (`data-purpose="master-footer"`)

- Newsletter row with wordmark, email pill, submit button.
- Mini spec-sheet links (Lumen Void, Primary Form, Luma Arc).
- Four-column link matrix: Editions, Spec Tools, The Company, Legal.
- Bottom registry bar with sign image and Zurich / Tehran / New York.
- `.xdm-footer-nav a` applies DM Sans light to footer links.
- Several footers contain invalid class names (`bg-#ECDAD4`, `text-#0A0A0A/80`). Use bracket syntax when editing: `bg-[#ECDAD4]`, `text-[#0A0A0A]/80`.

### Admin sidebars

Three variants exist:

| Variant | Example | Layout |
| --- | --- | --- |
| Text sidebar | `xadboom_atelier_admin_operations_inventory_lock_harmonized` | `268px` fixed rail with labels and counts |
| Icon rail | `pieces_catalog_*`, `add_new_piece_*`, `categories_*`, `inquiries_*`, `users_*` | `72-80px` fixed icon-only rail |
| Dark rail | `orders_*`, `designers_collaborators_*` | Dark `#12100E` vertical rail |

Admin headers are fixed, have a breadcrumb, sync status, search, and curator profile. Use `data-path` values consistently with the mapping in `server.js` and `src/prototype-navigation.js` or links will not resolve.

### Buttons

| Type | Recipe |
| --- | --- |
| Primary storefront pill | `rounded-full bg-[#0A0A0A] text-[#FFF8F6] text-[11px] uppercase tracking-[0.1em] px-6 py-3` |
| Primary monograph | `rounded-none bg-[#0A0A0A] text-[#ECDAD4] px-8 py-4 font-label-caps uppercase` |
| Ghost / outline | transparent, `1px` ink or hairline border, invert on hover |
| Icon stepper | `32px` circle, hairline border, arrow glyph |
| Admin action | compact `px-3 py-2`, mono uppercase, dark or tinted background |

Do not change button copy that the injected script matches: `bag`, `acquire`, `reserve`, `spec`, `3d`, `tear sheet`, `Add New Piece`.

### Chips and filters

- Inactive: tinted surface or transparent, hairline border, muted/text ink.
- Active: solid `#0A0A0A` with light text.
- Pills are appropriate on home/contact; square chips on monograph pages.

### Cards and badges

- Image-first cards with `aspect-[3/4]`, `[4/3]`, or `[21/9]`.
- Badges are absolute-positioned, dark translucent or solid, mono uppercase.
- Edition notation `Ed. 03 / 12` or `03 / 12`.
- Hover may scale images subtly (around `1.035`) over `500-700ms`.

### Spec rows, tables, accordions

- Rows separated by `1px` hairlines; no vertical table borders.
- Hover nudges the spec arrow a few pixels.
- `<details>` accordions remove default markers and rotate a `+`/`-` glyph.
- Tables use tabular/mono figures for prices, dimensions, IDs.

### Inputs

- Storefront: pill or square flat fields on tinted surfaces, hairline border, ink focus border, no glow ring.
- Admin: denser square fields with `focus:ring-1` or border change.
- Labels use mono uppercase; placeholders are muted.

### Modals

- Use the shared motion hooks rather than bespoke animation:
  - `data-modal` on the overlay
  - `data-modal-open="<id>"` on the opener
  - `data-modal-card` on the dialog card
  - `data-modal-close` or `data-modal-dismiss` on closers
- Some existing admin modals use raw `hidden` toggles and inline `onclick`; match the page you are editing.

### Progress and status

- Thin `4px` tracks with tinted trough and ink fill.
- Status pills use sage/amber/terracotta semantics on admin pages.
- Keep statuses textual as well as colored.

## 5. Page-specific styling contracts

Each page's inline `tailwind.config` is authoritative for that page. Do not move tokens to a central config.

| Page | Notable config aliases | Font strategy | Shape |
| --- | --- | --- | --- |
| Home | `brand.canvas`, `brand.surface`, `brand.tint`, `brand.tintCard`, `brand.dark`, `brand.muted`, `brand.text` | DM Sans body, Space Grotesk mono; arbitrary font classes | Rounded cards/pills |
| Catalog | M3 surface tokens + `border-delicate`, `canvas` | Space Grotesk/Newsreader arbitrary classes | Sharp panels, thin rules |
| Product | `plaster-base`, `surface-tint-1..4`, `obsidian`, `basalt`, `hairline-border` | Space Grotesk headlines, DM Sans body, Newsreader quotes | Mostly 0px |
| Designers 1/2 | Monograph surface tokens | Space Grotesk + Newsreader | Sharp/editorial |
| Contact | `surface`, `surface-container-*`, `outline` | Space Grotesk labels, DM Sans body | Square panels, pill fields |
| Admin overview | `surface-panel`, `surface-card`, `border-hairline`, `charcoal`, `terracotta`, `sage`, `amber` | Space Grotesk headline, DM Sans, Newsreader, JetBrains Mono | Soft `lg` cards |
| Pieces/categories/inquiries/users | `surface`/`surface-container-*` variants around `#F7E9E3` | Space Grotesk + DM Sans | Compact, low radius |
| Add piece | M3 surface tokens | Space Grotesk + DM Sans | Dense forms, low radius |
| Orders | `brandBg`, `cardBg`, `railBg`, `accentGold` | Space Grotesk + DM Sans + Newsreader | Dark rail, warm cards |
| Designers admin | Warm custom hex set + gold accent | Space Grotesk + Newsreader | Soft cards, `xl` panels |

If you add a token, add it inside the target page's config and use it consistently within that page.

## 6. Motion system

The motion layer lives in `src/xadboom-motion.js` and `src/xadboom-motion.css`. It is opt-in and degrades gracefully.

### Boot sequence

1. Each page's `<head>` contains a small FOUC guard that adds `.motion-enabled` unless reduced motion is requested.
2. `src/xadboom-motion.js` wires interactions, initializes modals/header/reveals, adds `.motion-loaded`.
3. It lazy-loads `src/vendor/motion.js` for modal timelines.
4. If script or Motion fails, a timeout removes `.motion-enabled` and reveals all content.

### Opt-in attributes

| Attribute | Effect |
| --- | --- |
| `data-reveal` | Fade/slide the element in on scroll |
| `data-reveal-delay="0.12"` | Explicit delay in seconds |
| `data-reveal-group` + `data-reveal-item` | Stagger children in a group |
| `data-motion-header` | Toggle `.is-scrolled` after scroll threshold |
| `data-motion-threshold="24"` | Header scroll threshold |
| `data-modal` | Mark a modal overlay |
| `data-modal-open="id"` | Opener for a modal |
| `data-modal-card` | Card inside a modal to animate |
| `data-modal-close` / `data-modal-dismiss` | Close controls |
| `data-no-motion` | Skip generic motion enhancements |
| `data-no-roll` | Skip rolling-label treatment |
| `data-motion-hover` | Added automatically to cards containing images |

### Auto classes

| Class | Applied to | Effect |
| --- | --- | --- |
| `.xdm-press` | Buttons/links with transition classes | Slight press scale on `:active` |
| `.xdm-roll-control` | Button-like controls | Rolling label on hover/focus |
| `.xdm-arrow` / `.xdm-arrow-icon` | Controls ending in an arrow glyph | Restrained 3px horizontal nudge |
| `.xdm-underline` | Manual opt-in | Animated underline |
| `.xdm-nav-active` | Active storefront nav link | Underline + ink color |
| `.xdm-footer-nav` | Footer link container | DM Sans light links |

### Public API

```js
window.XadboomMotion.ready   // boolean: Motion library loaded
window.XadboomMotion.reduce  // boolean: prefers-reduced-motion
window.XadboomMotion.open(modalElement)
window.XadboomMotion.close(modalElement)
```

### Timing tokens

| Token | Value |
| --- | --- |
| `--xdm-ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` |
| `--xdm-ease-ui` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `--xdm-dur-fast` | `160ms` |
| `--xdm-dur` | `260ms` |
| `--xdm-dur-slow` | `420ms` |
| `--xdm-dur-reveal` | `560ms` |
| `--xdm-reveal-y` | `24px` |

Reduced motion is handled globally: reveals snap visible, presses/rolls/arrows stop transforming, and animations are reduced to `0.001ms`.

## 7. Content and copy

- Tone is curatorial, precise, and material-focused: atelier, vault, edition, provenance, allocation, dispatch, monograph.
- Use title case for headings, uppercase mono for labels, sentence case for body.
- Edition notation uses spaces around the slash: `03 / 12`.
- Ranges use en dashes: `2024-2026`, `6-8 Weeks`.
- Keep fictional details consistent with `docs/GLOSSARY.md` (locations, ID formats, statuses).

## 8. Do and do not

Do:

- Reuse the page's existing aliases and patterns.
- Use hairlines, tonal surfaces, and typographic hierarchy for separation.
- Keep labels uppercase, tracked, and small.
- Use Material Symbols for icons.
- Test on mobile widths; most pages have responsive grids and fixed headers.

Do not:

- Introduce pure white section backgrounds on warm storefront pages.
- Add heavy shadows, gradients, or large radii to monograph pages.
- Add a global style file for page-specific components.
- Use invalid Tailwind class syntax (`text-#0A0A0A`).
- Reformat minified admin HTML.
- Add a new font family or icon set without a clear request.
