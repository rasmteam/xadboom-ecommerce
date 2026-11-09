# API Reference

All endpoints are defined in `server.js`. Base URL: `http://localhost:3000`. They are demo endpoints backed by in-memory state; there is no authentication, validation layer, rate limiting, or persistence.

Responses are JSON unless noted. POST bodies accept JSON or URL-encoded form data (`express.json()` + `express.urlencoded()`).

## Endpoint summary

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Server and demo-state health |
| GET | `/api/pieces` | List all pieces |
| POST | `/api/pieces` | Add a piece |
| GET | `/api/cart` | Read the active allocation bag |
| POST | `/api/cart/add` | Reserve one piece for 15 minutes |
| POST | `/api/cart/remove` | Release the reservation |
| POST | `/api/cart/checkout` | Complete the acquisition |
| GET | `/api/inquiries` | List all inquiries |
| POST | `/api/inquiries` | Create an inquiry |
| GET | `/api/download-spec/:id?` | Download a CSV spec sheet |
| GET | `/api/download-3d/:id?` | Download a stub OBJ model |
| GET | `/assets/xadboom_hero_piece.jpg` | Local hero image |

## Health

### `GET /api/health`

```json
{
  "status": "ok",
  "screens": 14,
  "activePieces": 4,
  "inquiries": 3,
  "cartHolds": 1,
  "timestamp": "2026-11-09T10:00:00.000Z"
}
```

Counts reflect current in-memory state.

## Pieces

### `GET /api/pieces`

Returns the full `pieces` array in seed order. New pieces are unshifted to the front.

```json
[
  {
    "id": "LV-0312",
    "title": "Lumen Void Lounge Chair",
    "designer": "Alireza Taghaboni",
    "studio": "NextOffice",
    "typology": "Seating & Lounges",
    "materials": "Solid Carved Walnut & Bouclé Wool",
    "edition": "03 / 12",
    "totalEditions": 12,
    "availableEditions": 3,
    "price": "$9,400",
    "priceNum": 9400,
    "status": "Available",
    "leadTime": "6-8 Weeks",
    "image": "/assets/xadboom_hero_piece.jpg",
    "dimensions": "840 × 920 × 760 mm",
    "weight": "28 kg",
    "martindale": "65,000 Cycles",
    "provenance": "Tehran Atelier / Zurich Vault"
  }
]
```

### `POST /api/pieces`

Adds a piece. Every field is optional; defaults apply.

| Field | Type | Default / behavior |
| --- | --- | --- |
| `title` | string | `Untitled Architectural Piece` |
| `designer` | string | `Collaborating Architect` |
| `studio` | string | `Atelier Partner` |
| `typology` | string | `Seating & Lounges` |
| `materials` | string | `Solid Walnut & Bronze` |
| `totalEditions` | number/string | `12`; also sets `availableEditions` |
| `price` | string/number | `$8,500`; a missing `$` is prepended; digits become `priceNum` |
| `image` | string | `/assets/xadboom_hero_piece.jpg` |
| `dimensions` | string | `800 × 800 × 750 mm` |
| `weight` | string | `30 kg` |

Generated fields: `id: "XB-####"`, `edition: "01 / <total>"`, `status: "Available"`, `leadTime: "6-8 Weeks"`, `martindale: "Commercial Spec"`, `provenance: "Tehran / Zurich Node"`.

```json
{
  "success": true,
  "piece": { "id": "XB-4821", "title": "...", "...": "..." }
}
```

Not called by any current UI. The admin add-piece screen is visual only.

## Cart / reservation bag

The cart holds **at most one** piece. There is no quantity and adding replaces the existing allocation.

Cart item = the piece fields plus:

| Field | Type | Meaning |
| --- | --- | --- |
| `reservedEdition` | string | e.g. `03 of 12` |
| `reservedAt` | number | Epoch ms |
| `lockExpiresAt` | number | Epoch ms; 15 minutes after add |

### `GET /api/cart`

Expired items are filtered from state before responding.

```json
{
  "items": [
    {
      "id": "LV-0312",
      "title": "Lumen Void Lounge Chair",
      "price": "$9,400",
      "reservedEdition": "03 of 12",
      "lockExpiresAt": 1762700000000,
      "...": "..."
    }
  ],
  "count": 1,
  "activeLock": true,
  "remainingSeconds": 843
}
```

Empty bag: `items: []`, `count: 0`, `activeLock: false`, `remainingSeconds: 0`.

### `POST /api/cart/add`

Body:

| Field | Type | Default |
| --- | --- | --- |
| `pieceId` | string | `LV-0312`; unknown ids fall back to the first piece |

Behavior: replaces `cartState.items` with one item, sets a 15-minute lock, returns the whole cart state.

```json
{
  "success": true,
  "message": "Edition unit 03 of 12 placed under 15-minute cryptographic reservation lock.",
  "cart": {
    "items": ["..."],
    "completedOrders": ["..."]
  }
}
```

### `POST /api/cart/remove`

Clears the active allocation.

```json
{
  "success": true,
  "message": "Reservation hold released back to atelier inventory."
}
```

### `POST /api/cart/checkout`

Requires an active item. Returns `400` when empty.

Body (all optional): `collector`, `email`, `destination`.

Defaults: `Verified Private Collector`, `collector@atelier-vault.com`, `Zurich, Switzerland`.

```json
{
  "success": true,
  "order": {
    "orderNumber": "XB-DISPATCH-123456",
    "certId": "PROV-CERT-AB12CD3",
    "piece": "Lumen Void Lounge Chair",
    "edition": "03 of 12",
    "price": "$9,400",
    "collector": "Faraz Yavari",
    "email": "collector@atelier-vault.com",
    "destination": "Zurich, Switzerland",
    "crateCarrier": "Swiss Post Priority Fine Art Logistics",
    "status": "Dual-Sign Cryptographic Lock Verified",
    "timestamp": "2026-11-09T10:04:00.000Z"
  }
}
```

Side effects: unshifts the order into `cartState.completedOrders`, clears `cartState.items`.

Expiry: a server interval runs every 10 seconds and removes expired items, logging to the console. The client drawer also refreshes when opened.

## Inquiries

### `GET /api/inquiries`

Returns the inquiry array, newest first.

```json
[
  {
    "id": "INQ-2026-089",
    "type": "Curatorial Consultation",
    "client": "Studio Liaigre Paris",
    "email": "specifications@liaigre.fr",
    "project": "Haussmann Private Residence, 8th Arrondissement",
    "piece": "Lumen Void Lounge Chair (Pair)",
    "message": "Requesting dimensional tolerance validation...",
    "status": "Active Review",
    "slaRemaining": "1h 45m",
    "timestamp": "2026-11-01 07:15"
  }
]
```

### `POST /api/inquiries`

Body:

| Field | Type | Default |
| --- | --- | --- |
| `type` | string | `Curatorial Consultation` |
| `name` | string | fallback `client` |
| `client` | string | `Architectural Specifier` |
| `email` | string | `specifier@architecture.com` |
| `project` | string | `Residential Architectural Commission` |
| `piece` | string | `Lumen Void Lounge Chair` |
| `message` | string | `Trade consultation request for custom dimensional integration.` |

Generated: `id: "INQ-2026-###"`, `status: "Active Review"`, `slaRemaining: "3h 00m"`, timestamp string.

```json
{
  "success": true,
  "inquiry": { "id": "INQ-2026-401", "...": "..." }
}
```

Client usage: the injected script posts any form that has an email input and no `action`. The contact page's real form also runs its own `showConfirmation()`. Newsletter forms without an `action` are also caught.

## Downloads

### `GET /api/download-spec/:id?`

Returns `text/csv` as an attachment named `Xadboom_Spec_<id>_<title>.csv`. Unknown or missing `id` falls back to `pieces[0]`.

Columns include archive ID, title, architect, studio, typology, materials, dimensions, weight, martindale, edition run, batch status, crate logistics, provenance, standards, contact, and registry URL.

The injected UI sends most spec/tear-sheet/3D buttons here with `LV-0312`.

### `GET /api/download-3d/:id?`

Returns `text/plain` as an attachment named `xadboom_<id>_model.obj`. The OBJ is a fixed stub box/seat geometry with a header comment naming the piece. Not currently linked from the UI.

## Hero image

### `GET /assets/xadboom_hero_piece.jpg`

Serves `src/assets/images/xadboom_hero_piece_1793524952436.jpg` if present, otherwise `404` with `Hero image not found`.

The home and product screen handlers replace one specific remote hero URL with this path at render time.

## Errors and routing behavior

| Situation | Response |
| --- | --- |
| Missing screen file | `404` text: `Screen file not found: <file>` |
| Checkout with empty bag | `400` JSON: `{ "error": "No active reservation in allocation bag." }` |
| Unknown route | Redirect to `/` |
| Missing hero image | `404` text |

There is no CORS configuration, so the API is intended for same-origin use. There is no API-level validation, authorization, CSRF protection, or persistence.

## Client usage map

| Caller | Endpoints |
| --- | --- |
| Injected drawer script (`server.js:487-773`) | `GET /api/cart`, `POST /api/cart/add`, `POST /api/cart/remove`, `POST /api/cart/checkout`, `POST /api/inquiries`, `GET /api/download-spec/:id` |
| Contact page inline script | Presentation only; the network call comes from the injection |
| Admin screens | None; all admin data is static markup |
| `src/prototype-navigation.js` | None |

## State reset

Restarting the Node process restores:

- `pieces` to the four seed pieces
- `inquiries` to the three seed inquiries
- `cartState.items` to one pre-locked Lumen Void allocation (15 minutes from process start)
- `completedOrders` to empty
