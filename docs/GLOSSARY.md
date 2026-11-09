# Glossary and Content Conventions

Use this to keep generated copy, IDs, and fictional details consistent with the existing prototype.

## Brand and world

| Term | Meaning in this project |
| --- | --- |
| Xadboom | The brand: a curatorial atelier for limited-run furniture and spatial objects |
| Atelier | The studio/workshop; also the admin console's framing ("Atelier Admin", "Atelier Operations") |
| Curatorial | The editorial/gallery voice used for inquiries, essays, and curator roles |
| Vault | The fictional secure storage/registry for editions and provenance ("Zurich Vault", "vault synced") |
| Ledger | The fictional record of pieces, reservations, provenance, and dispatches |
| Node | A vault location, e.g. "Zurich Node", "Tehran / Zurich Node" |
| Registry | The archive of edition records; also the public product URL pattern |
| Tectonic Atelier | Name of the primary storefront design system |
| Collectible Design & Architectural Monographs | Name of the editorial/monograph design system |

Recurring locations: Zurich, Tehran, New York, Milan, Paris, Berlin. Recurring fictional nodes/ateliers: Tehran Atelier, Zurich Atelier, Zurich Vault, Milan Vault.

Recurring personas:

| Person | Role in copy |
| --- | --- |
| Helena Vane | Principal Curator / Admin (admin sidebar) |
| Jean-Claude M. / Jean-Claude Moreau | Chief Curator (admin headers, Paris curator option) |
| Nader Khademi | Tehran curator option |

## Objects and commerce

| Term | Meaning |
| --- | --- |
| Piece | A collectible furniture or spatial object |
| Edition | A numbered unit within a limited run, e.g. `03 / 12` |
| Edition run | The total production count, e.g. `Ed. of 12` |
| Available editions | Remaining units in the run |
| Allocation | A reserved edition unit held for a collector |
| Reservation lock / vault lock | The 15-minute hold placed when a piece is added to the bag |
| Provenance | The documented ownership/material history |
| Provenance certificate | Fictional certificate issued at checkout (`PROV-CERT-*`) |
| Dispatch | A completed acquisition shipment; also the newsletter name ("Architectural Dispatch") |
| Crate | Museum-grade shipping crate (white-glove, shock-monitored) |
| White-glove | Premium handling/delivery language |
| Typology | Category of object, e.g. Seating & Lounges, Tables & Consoles, Architectural Lighting |
| Spec sheet / tear sheet | Downloadable specification document |
| BIM | Building information modeling; the 3D asset offering |
| Monograph | Editorial profile/catalog format |
| Plate | A numbered image in a product gallery (`PLATE NO. 01`) |
| Drop | A curated release of new editions |
| Patron / collector | Buyer persona; "patron" is used in admin copy |
| Trade | Architect/interior-designer professional audience |

## Statuses and service terms

| Term | Use |
| --- | --- |
| `Available` | Piece status; normal inventory |
| `Low Stock` | Piece status; low remaining editions |
| `Active Review` | New inquiry default status |
| `Triage Passed` | Inquiry status after initial review |
| `Confirmed` | Inquiry/appointment confirmed |
| `Dual-Sign Cryptographic Lock Verified` | Checkout order status |
| `15-MIN LOCK ACTIVE` | Bag banner |
| SLA | Curatorial response window; UI promises around 3 hours |
| KYC | Identity verification reference in admin users copy |
| MoM | Month-over-month metric in admin dashboards |

## ID formats

| Entity | Format | Example |
| --- | --- | --- |
| Seed piece | Two uppercase letters + hyphen + four digits | `LV-0312`, `PF-0206`, `LA-0820`, `SF-0105` |
| Generated piece | `XB-` + four digits | `XB-4821` |
| Inquiry | `INQ-2026-` + three digits | `INQ-2026-089` |
| Order | `XB-DISPATCH-` + six digits | `XB-DISPATCH-482913` |
| Certificate | `PROV-CERT-` + seven uppercase alphanumerics | `PROV-CERT-AB12CD3` |
| Seeded reservation edition | `03 of 12` (client-facing) | `03 of 12` |
| UI edition label | `03 / 12`, `Ed. 03 / 12`, or `ALLOCATE ED. 03/12` | depends on context |

Do not invent new prefixes without updating `docs/API.md` and `server.js`.

## Seed catalog

| ID | Piece | Designer / Studio | Typology | Edition | Available | Price | Lead time |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `LV-0312` | Lumen Void Lounge Chair | Alireza Taghaboni / NextOffice | Seating & Lounges | 03 / 12 | 3 | $9,400 | 6-8 Weeks |
| `PF-0206` | Primary Form Low Table | Studio Khazeni | Tables & Consoles | 02 / 06 | 2 | $14,800 | 8-10 Weeks |
| `LA-0820` | Luma Wood Arc Lamp | Atelier Arpa | Architectural Lighting | 08 / 20 | 7 | $5,200 | 4-6 Weeks |
| `SF-0105` | Silence Fluted Credenza | Mehrdad Zavareh / MZ Architects | Spatial Accents & Storage | 01 / 05 | 1 | $18,500 | 10-12 Weeks |

Materials:

- Lumen Void: Solid Carved Walnut & Bouclé Wool
- Primary Form: Porous Travertine & Cast Oxidized Bronze
- Luma Arc: Bent Oiled Oak & Hand-Blown Opal Glass
- Silence Fluted: Charcoal Tinted Ash & Cast Iron Joinery

Dimensions are always `W × D × H mm` with spaced multiplication signs.

## Seed inquiries

| ID | Client | Type | Status | SLA |
| --- | --- | --- | --- | --- |
| `INQ-2026-089` | Studio Liaigre Paris | Curatorial Consultation | Active Review | 1h 45m |
| `INQ-2026-088` | Atelier Bow-Wow Specifiers | Bespoke Architectural Commission | Triage Passed | 2h 30m |
| `INQ-2026-087` | Dr. Elena Rostova | Private Viewing Request | Confirmed | Completed |

## Copy conventions

- Voice: quiet, precise, material-led, slightly editorial. Avoid exclamation marks and hard-sell language.
- Labels: uppercase mono with wide tracking; body: sentence case.
- Punctuation:
  - Edition runs: `03 / 12`
  - Ranges: en dash, `2024-2026`, `6-8 Weeks`
  - Multiplication: `840 × 920 × 760 mm`
  - Prices: `$9,400` (comma thousands)
  - Arrows: `→`, `↗`, `←` only where the page already uses them
- Material names use ampersands: "Walnut & Bouclé Wool".
- Inquiry language references "curatorial desk", "atelier registry", "3-hour SLA".
- Cart language references "allocation bag", "reservation lock", "release back to inventory".
- Download language references "specification sheet", "tear sheet", "3D/BIM archive".

## Design vocabulary

| Term | Meaning |
| --- | --- |
| Hairline | `1px` structural border used instead of shadows |
| Plaster / lime-wash | Warm `#ECDAD4` canvas metaphor |
| Obsidian / basalt | Near-black ink surfaces (`#0A0A0A`, `#1C1917`, `#292524`) |
| Terracotta | Warm accent (`#844C38`, `#C99187`) |
| Tracked mono | Uppercase Space Grotesk labels with `0.08em`+ letter spacing |
| Editorial plate | Archival-style image presentation with a catalog index |
| Planar tiering | Depth via tinted surfaces, not box shadows |

If you add a new recurring term, ID prefix, status, or persona, add it here so later agents stay consistent.
