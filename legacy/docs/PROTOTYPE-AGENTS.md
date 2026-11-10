# AGENTS.md

Operating guide for AI agents working in this repository. Read this first, then only the documents relevant to your task. Do not read all `code.html` files; use the map below.

## Read order

| Step | Read | Why |
| --- | --- | --- |
| 1 | This file | Rules and routing |
| 2 | `ARCHITECTURE.md` | System model and constraints |
| 3 | The one doc matching the task | Targeted context |
| 4 | Only the relevant section of the relevant file | Implementation |

Task docs:

- Screen/page work -> `docs/PAGES.md`
- API/server work -> `docs/API.md`
- Styling/motion work -> `docs/DESIGN-SYSTEM.md`
- Multi-step changes -> `docs/WORKFLOWS.md`
- Copy/domain terms -> `docs/GLOSSARY.md`

## Golden rules

1. **Make targeted edits.** Never rewrite a full `code.html`; they are 40-60 KB of hand-tuned markup.
2. **Preserve the dual runtime.** Pages must keep working both through Express and from `file://` / static hosting.
3. **Keep `../src/` paths inside screen files.** The server rewrites them to `/src/`. Only `index.html` uses `./src/`.
4. **Do not edit `src/vendor/motion.js`.** It is a minified third-party build.
5. **Treat data as ephemeral.** Everything is in memory in `server.js`; there is no database, ORM, auth, or migration system.
6. **Update both navigation sources when routes change:** `server.js` (`SCREENS`) and `src/prototype-navigation.js` (`screens`).
7. **Headers, footers, and admin sidebars are duplicated per page.** A global markup change means editing every affected screen or the server injection. Do not assume a shared partial exists.
8. **Styling is per page.** Each screen has its own inline `tailwind.config`. Add tokens there, not in a central file. `src/xadboom-motion.css` is only for motion/shared nav typography.
9. **Use valid Tailwind arbitrary syntax:** `text-[#0A0A0A]`, not `text-#0A0A0A`. The invalid form exists in some footers; do not copy it.
10. **No new frameworks, bundlers, or dependencies without a clear request.** The project is intentionally plain HTML/CSS/JS + Express.

## Task routing

| Task | Touch these files | Read |
| --- | --- | --- |
| Change copy on one screen | The one `code.html` / `index.html` | `docs/PAGES.md`, `docs/GLOSSARY.md` |
| Restyle one screen | That screen's markup + inline Tailwind config | `docs/DESIGN-SYSTEM.md` |
| Change a shared visual (nav/footer/button) | Every affected screen, or `enhanceHtml()` if it is prototype chrome | `ARCHITECTURE.md` |
| Add or rename a screen route | `server.js`, `src/prototype-navigation.js` | `ARCHITECTURE.md` section 3/4 |
| Add an API endpoint | `server.js`, `docs/API.md` | `docs/API.md` |
| Wire a page to an API | Page inline script, or injection in `server.js` | `docs/API.md`, `docs/WORKFLOWS.md` |
| Fix cart/bag behavior | `server.js` cart endpoints + injected drawer script | `ARCHITECTURE.md` section 7 |
| Add animation/interaction | `src/xadboom-motion.js`, `src/xadboom-motion.css`, then opt in with attributes | `docs/DESIGN-SYSTEM.md` section 6 |
| Add an image | `src/assets/images/`, then reference it correctly | `docs/WORKFLOWS.md` |
| Fix nav links | `server.js` injection mappings and `src/prototype-navigation.js` | `ARCHITECTURE.md` section 6 |

## Where things live

| Need | Location |
| --- | --- |
| Route list | `SCREENS` in `server.js:364`; mirrored in `src/prototype-navigation.js:8` |
| Route handlers | `server.js:784` |
| Injected nav/bag/scripts | `enhanceHtml()` in `server.js:382` |
| Seed pieces/inquiries | `server.js:27` and `server.js:110` |
| Cart/lock logic | `server.js:150-274` |
| Spec/3D downloads | `server.js:298-361` |
| Demo APIs | `server.js:177-361`, health at `server.js:839` |
| Static nav logic | `src/prototype-navigation.js` |
| Motion system | `src/xadboom-motion.js`, `src/xadboom-motion.css` |
| Local images | `src/assets/images/` |
| Page inventory | `docs/PAGES.md` |
| Design tokens | `docs/DESIGN-SYSTEM.md` + both `DESIGN.md` files |

## Coding conventions

### HTML

- Screens are standalone documents: `<head>` with Tailwind CDN + inline config, `<body>` with header/sidebar/main/footer.
- Keep storefront asset paths relative (`../src/...`). Keep `index.html` paths as `./src/...`.
- Preserve existing section markers such as `data-purpose="..."`, `id="..."`, and comment banners; they are navigation aids.
- Do not reformat dense admin HTML. Some admin pages are intentionally single-line/minified; reformatting creates huge diffs.
- Use Material Symbols for icons: `<span class="material-symbols-outlined">name</span>`.
- Use `Next`-like typographic characters only where already present; match the page's voice.

### CSS / Tailwind

- Use the page's existing token aliases first; arbitrary hex values second.
- Storefront palette core: `#ECDAD4` canvas, `#FFF8F6` surface, `#FFF1EC` tint, `#D8C3BC` hairline, `#0A0A0A` ink, `#1C1917` body ink, `#7A6E69` muted, `#844C38` terracotta.
- Maintain the visual rules: hairlines instead of shadows, warm surfaces instead of white, uppercase tracked mono labels, restrained radius.
- Product/monograph pages favor 0px radius; home and contact favor rounded cards/pills. Match the target page, not a global rule.
- Add new repeated styles to `src/xadboom-motion.css` only if they are motion-related or shared prototype chrome.

### JavaScript

- Classic scripts only: no `import`/`export`, no JSX, no TypeScript.
- Wrap page scripts in an IIFE or `DOMContentLoaded`, as existing pages do.
- Load new scripts with `defer` at the end of `<body>`.
- Guard optional DOM nodes (`if (el)`) because the same script may be injected into pages without those nodes.
- Use `window.XadboomMotion.open/close` for modal timelines; opt in with `data-modal`, `data-modal-open`, `data-modal-card`, `data-modal-close`.
- Respect `prefers-reduced-motion`; the shared system already does.

### Server

- Keep `server.js` dependency-free beyond Express.
- Follow existing response shapes and `{ success: true, ... }` convention for POSTs.
- Keep IDs in the established formats (see `docs/GLOSSARY.md`).
- Do not introduce environment variables without documenting them in `README.md`.
- Do not add routes that shadow `/api/*` with `/:dir`; register specific routes before the catch-all.

## Validation checklist

There is no test/lint/typecheck script. After changes:

1. Start the server: `npm run dev`.
2. Request the changed route: `curl -sI http://localhost:3000/<route>` should be 200.
3. Check the health endpoint: `curl -s http://localhost:3000/api/health`.
4. Visit the page in a browser and check the console for errors.
5. If you touched the bag/checkout: add -> observe lock -> checkout -> bag clears.
6. If you touched inquiries: submit a form -> confirm `GET /api/inquiries` includes it.
7. If you touched static navigation: open the source `code.html` or serve the folder without Express and verify links resolve.
8. If you touched downloads: `curl -s http://localhost:3000/api/download-spec/LV-0312 | head`.
9. If you changed routes: verify both `server.js` and `src/prototype-navigation.js` agree.
10. Confirm the diff contains only intended files. Do not commit unless asked.

## Pitfalls to avoid

- Editing only `server.js` when a nav label also exists in `src/prototype-navigation.js` (or vice versa).
- Assuming a shared header/footer; there is none.
- Adding a token to one page's Tailwind config and expecting it on another page.
- Changing button copy that the injected script matches by text (`bag`, `acquire`, `reserve`, `spec`, `3d`, `tear sheet`, `Add New Piece`).
- Adding a second item to the cart; the UI and endpoints assume a single allocation.
- Expecting `POST /api/pieces` to be called by the admin add-piece screen; it is currently visual-only.
- Using `fetch('/api/...')` in a page that must work from `file://` without a fallback.
- Relying on remote Google-hosted images for critical content.
- Reformatting minified admin HTML or the vendored Motion file.
- Adding secrets. None are needed, and `.env` is not loaded.

## Documentation upkeep

When you change behavior, update the matching doc in the same task:

| Change | Update |
| --- | --- |
| Routes/screens | `README.md` route table, `docs/PAGES.md`, `ARCHITECTURE.md` |
| API contract | `docs/API.md`, `README.md` if visible |
| Design tokens/components | `docs/DESIGN-SYSTEM.md` |
| Workflow assumptions | `docs/WORKFLOWS.md` |
| Domain vocabulary/IDs | `docs/GLOSSARY.md` |
| New pitfall or rule | This file |
