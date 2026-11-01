import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve newly generated architectural asset image
const generatedImagePath = path.join(__dirname, 'src/assets/images/xadboom_hero_piece_1793524952436.jpg');
app.get('/assets/xadboom_hero_piece.jpg', (req, res) => {
  if (fs.existsSync(generatedImagePath)) {
    res.sendFile(generatedImagePath);
  } else {
    res.status(404).send('Hero image not found');
  }
});

// In-Memory Atelier Data Layer
let pieces = [
  {
    id: "LV-0312",
    title: "Lumen Void Lounge Chair",
    designer: "Alireza Taghaboni",
    studio: "NextOffice",
    typology: "Seating & Lounges",
    materials: "Solid Carved Walnut & Bouclé Wool",
    edition: "03 / 12",
    totalEditions: 12,
    availableEditions: 3,
    price: "$9,400",
    priceNum: 9400,
    status: "Available",
    leadTime: "6-8 Weeks",
    image: "/assets/xadboom_hero_piece.jpg",
    dimensions: "840 × 920 × 760 mm",
    weight: "28 kg",
    martindale: "65,000 Cycles",
    provenance: "Tehran Atelier / Zurich Vault"
  },
  {
    id: "PF-0206",
    title: "Primary Form Low Table",
    designer: "Studio Khazeni",
    studio: "Studio Khazeni",
    typology: "Tables & Consoles",
    materials: "Porous Travertine & Cast Oxidized Bronze",
    edition: "02 / 06",
    totalEditions: 6,
    availableEditions: 2,
    price: "$14,800",
    priceNum: 14800,
    status: "Available",
    leadTime: "8-10 Weeks",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCSM-jyvzR-1NVMWLBLLQZkkIA68_3il6a96K7KRZOcY4-oGLfawAgfPkwIEGkgK9MGb4zK_A7jbeLztlxbx8aMIfQPh60nSL7DYInV59YgyxpHeHU92oFd1dUCnnuo5xOeyuUTA2tSIJ-lTaxDylHC8AqW30txUkaRmlkwAGL-I2-WWO60kJ0lRFyhN85FtYHrbUYBs-b1F6yF1DHZNwxoI9vl7WYf9X1ZkhtMTBhK",
    dimensions: "1400 × 750 × 320 mm",
    weight: "95 kg",
    martindale: "N/A (Solid Stone)",
    provenance: "Milan Vault / Zurich Node"
  },
  {
    id: "LA-0820",
    title: "Luma Wood Arc Lamp",
    designer: "Atelier Arpa",
    studio: "Atelier Arpa",
    typology: "Architectural Lighting",
    materials: "Bent Oiled Oak & Hand-Blown Opal Glass",
    edition: "08 / 20",
    totalEditions: 20,
    availableEditions: 7,
    price: "$5,200",
    priceNum: 5200,
    status: "Available",
    leadTime: "4-6 Weeks",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA0_nr4QU43k3k8QFJ3UX96jFWqBNw0IvU2pIGg3vnP28KZ7kLOVMQaxg_IEw_3PaitSV_4LQ1T-19Hmqm043EPrIgXTodTpLmp31w4E6Cnpb_cOrP33frmD9KjGmJpcusy44C9RqBiLm586cM00gN5rgyhFkXcK2yOeX_T2Xif_ISQeRTEof6Dcbo9jypmXVgqR2FUMVTBbL--veCNmY2ThyoNl_wOaFc9YwMvN4qN",
    dimensions: "450 × 1200 × 1950 mm",
    weight: "16 kg",
    martindale: "CE / UL Architectural Standard",
    provenance: "Zurich Atelier"
  },
  {
    id: "SF-0105",
    title: "Silence Fluted Credenza",
    designer: "Mehrdad Zavareh",
    studio: "MZ Architects",
    typology: "Spatial Accents & Storage",
    materials: "Charcoal Tinted Ash & Cast Iron Joinery",
    edition: "01 / 05",
    totalEditions: 5,
    availableEditions: 1,
    price: "$18,500",
    priceNum: 18500,
    status: "Low Stock",
    leadTime: "10-12 Weeks",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBF1NRAUZPKx7VJYHaPFPAVgx3ogJF31MVXSdHmwEp0AEypHs1tKZNk1KLa5fjRQ3-Pr_XdEz9PPgzgO-CRQMtk-U7NJMBqXu9HRweamguFhwRjHLkCTNo-tHE3tTnljwBpy0PVoNiqVnh6nRr91r7_QrtmlC6_os40KKDHRSId748ctZdZrdB9G0Dj6muVXmhTFtXrxzWwJK2x6XUiaca0kMGW_tfFaUbniFaRsaEF",
    dimensions: "2100 × 520 × 720 mm",
    weight: "82 kg",
    martindale: "Matte Structural Finish",
    provenance: "Tehran Atelier"
  }
];

let inquiries = [
  {
    id: "INQ-2026-089",
    type: "Curatorial Consultation",
    client: "Studio Liaigre Paris",
    email: "specifications@liaigre.fr",
    project: "Haussmann Private Residence, 8th Arrondissement",
    piece: "Lumen Void Lounge Chair (Pair)",
    message: "Requesting dimensional tolerance validation and wood substrate finish samples for Paris commission.",
    status: "Active Review",
    slaRemaining: "1h 45m",
    timestamp: "2026-11-01 07:15"
  },
  {
    id: "INQ-2026-088",
    type: "Bespoke Architectural Commission",
    client: "Atelier Bow-Wow Specifiers",
    email: "t.tsukamoto@bow-wow.jp",
    project: "Karuizawa Forest Villa Commission",
    piece: "Primary Form Low Table (Custom 1800mm Travertine)",
    message: "Custom slab selection inquiry with un-filled raw travertine edge detailing.",
    status: "Triage Passed",
    slaRemaining: "2h 30m",
    timestamp: "2026-11-01 06:40"
  },
  {
    id: "INQ-2026-087",
    type: "Private Viewing Request",
    client: "Dr. Elena Rostova",
    email: "e.rostova@private-vault.ch",
    project: "Zurich Atelier In-Person Examination",
    piece: "Silence Fluted Credenza (Ed. 01/05)",
    message: "Client requesting Zurich vault appointment with chief curator.",
    status: "Confirmed",
    slaRemaining: "Completed",
    timestamp: "2026-10-31 16:20"
  }
];

// Active 15-Minute Reservation Lock Session
let cartState = {
  items: [
    {
      ...pieces[0],
      reservedEdition: "03 of 12",
      reservedAt: Date.now(),
      lockExpiresAt: Date.now() + 15 * 60 * 1000
    }
  ],
  completedOrders: []
};

// Periodic check for expired locks
setInterval(() => {
  const now = Date.now();
  if (cartState.items.length > 0) {
    cartState.items = cartState.items.filter(item => {
      if (item.lockExpiresAt && item.lockExpiresAt < now) {
        console.log(`[Atelier Vault] Lock expired for ${item.title} ${item.reservedEdition} — released back to pool.`);
        return false;
      }
      return true;
    });
  }
}, 10000);

// API Endpoints
app.get('/api/pieces', (req, res) => {
  res.json(pieces);
});

app.post('/api/pieces', (req, res) => {
  const newPiece = {
    id: `XB-${Math.floor(1000 + Math.random() * 9000)}`,
    title: req.body.title || 'Untitled Architectural Piece',
    designer: req.body.designer || 'Collaborating Architect',
    studio: req.body.studio || 'Atelier Partner',
    typology: req.body.typology || 'Seating & Lounges',
    materials: req.body.materials || 'Solid Walnut & Bronze',
    edition: `01 / ${req.body.totalEditions || 12}`,
    totalEditions: parseInt(req.body.totalEditions || 12, 10),
    availableEditions: parseInt(req.body.totalEditions || 12, 10),
    price: req.body.price ? (req.body.price.startsWith('$') ? req.body.price : `$${req.body.price}`) : '$8,500',
    priceNum: parseInt((req.body.price || '8500').replace(/[^0-9]/g, ''), 10) || 8500,
    status: 'Available',
    leadTime: '6-8 Weeks',
    image: req.body.image || '/assets/xadboom_hero_piece.jpg',
    dimensions: req.body.dimensions || '800 × 800 × 750 mm',
    weight: req.body.weight || '30 kg',
    martindale: 'Commercial Spec',
    provenance: 'Tehran / Zurich Node'
  };
  pieces.unshift(newPiece);
  res.json({ success: true, piece: newPiece });
});

app.get('/api/cart', (req, res) => {
  const now = Date.now();
  const validItems = cartState.items.filter(item => !item.lockExpiresAt || item.lockExpiresAt > now);
  cartState.items = validItems;
  res.json({
    items: validItems,
    count: validItems.length,
    activeLock: validItems.length > 0,
    remainingSeconds: validItems.length > 0 ? Math.max(0, Math.floor((validItems[0].lockExpiresAt - now) / 1000)) : 0
  });
});

app.post('/api/cart/add', (req, res) => {
  const pieceId = req.body.pieceId || 'LV-0312';
  const target = pieces.find(p => p.id === pieceId) || pieces[0];
  const now = Date.now();
  const lockExpiresAt = now + 15 * 60 * 1000; // 15 mins lock
  
  const newItem = {
    ...target,
    reservedEdition: target.edition.replace('/', 'of'),
    reservedAt: now,
    lockExpiresAt: lockExpiresAt
  };

  // Replace or add
  cartState.items = [newItem];
  res.json({
    success: true,
    message: `Edition unit ${newItem.reservedEdition} placed under 15-minute cryptographic reservation lock.`,
    cart: cartState
  });
});

app.post('/api/cart/remove', (req, res) => {
  cartState.items = [];
  res.json({ success: true, message: 'Reservation hold released back to atelier inventory.' });
});

app.post('/api/cart/checkout', (req, res) => {
  if (cartState.items.length === 0) {
    return res.status(400).json({ error: 'No active reservation in allocation bag.' });
  }
  const purchased = cartState.items[0];
  const orderNumber = `XB-DISPATCH-${Date.now().toString().slice(-6)}`;
  const certId = `PROV-CERT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  const orderRecord = {
    orderNumber,
    certId,
    piece: purchased.title,
    edition: purchased.reservedEdition,
    price: purchased.price,
    collector: req.body.collector || 'Verified Private Collector',
    email: req.body.email || 'collector@atelier-vault.com',
    destination: req.body.destination || 'Zurich, Switzerland',
    crateCarrier: 'Swiss Post Priority Fine Art Logistics',
    status: 'Dual-Sign Cryptographic Lock Verified',
    timestamp: new Date().toISOString()
  };

  cartState.completedOrders.unshift(orderRecord);
  cartState.items = []; // Cleared after checkout

  res.json({
    success: true,
    order: orderRecord
  });
});

app.get('/api/inquiries', (req, res) => {
  res.json(inquiries);
});

app.post('/api/inquiries', (req, res) => {
  const newInq = {
    id: `INQ-2026-${Math.floor(100 + Math.random() * 900)}`,
    type: req.body.type || 'Curatorial Consultation',
    client: req.body.name || req.body.client || 'Architectural Specifier',
    email: req.body.email || 'specifier@architecture.com',
    project: req.body.project || 'Residential Architectural Commission',
    piece: req.body.piece || 'Lumen Void Lounge Chair',
    message: req.body.message || 'Trade consultation request for custom dimensional integration.',
    status: 'Active Review',
    slaRemaining: '3h 00m',
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
  };
  inquiries.unshift(newInq);
  res.json({ success: true, inquiry: newInq });
});

// Downloadable architectural spec sheet generator (CSV)
app.get('/api/download-spec/:id?', (req, res) => {
  const target = pieces.find(p => p.id === req.params.id) || pieces[0];
  const csvContent = `XADBOOM CURATED INTERIOR ARCHITECTURE — SPECIFICATION SHEET
Archive ID,${target.id}
Piece Title,${target.title}
Collaborating Architect,${target.designer}
Affiliated Studio,${target.studio}
Typology,${target.typology}
Materials / Substrates,${target.materials}
Standard Dimensions,${target.dimensions}
Net Weight,${target.weight}
Textile Martindale Rating,${target.martindale}
Edition Run,${target.edition}
Current Batch Status,${target.status}
Atelier Crate Logistics,Rigid Plywood Museum Crate / Shockwatch Monitored
Provenance Node,${target.provenance}
Specification Standards,ISO 9001 / BIM 3D Lightweight Compatible (.OBJ / .GLB)
Atelier Contact,curatorial@xadboom.com
Registry URL,https://www.xadboom.com/product/${target.id}
`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="Xadboom_Spec_${target.id}_${target.title.replace(/\s+/g, '_')}.csv"`);
  res.send(csvContent);
});

// Downloadable lightweight 3D architectural model generator (.OBJ)
app.get('/api/download-3d/:id?', (req, res) => {
  const target = pieces.find(p => p.id === req.params.id) || pieces[0];
  const objContent = `# XADBOOM ARCHITECTURAL ASSETS — LIGHTWEIGHT 3D MODEL
# Piece: ${target.title} (${target.id})
# Architect: ${target.designer}
# Scale: 1 unit = 1 millimeter
# Vertices for ${target.title}
v -420.000 0.000 -380.000
v 420.000 0.000 -380.000
v 420.000 0.000 380.000
v -420.000 0.000 380.000
v -420.000 760.000 -380.000
v 420.000 760.000 -380.000
v 420.000 760.000 380.000
v -420.000 760.000 380.000
# Seat Rake Geometry
v -380.000 420.000 -200.000
v 380.000 420.000 -200.000
v 380.000 380.000 280.000
v -380.000 380.000 280.000
vn 0.000 1.000 0.000
vn 0.000 0.000 1.000
vn 0.000 0.000 -1.000
vn 1.000 0.000 0.000
vn -1.000 0.000 0.000
s 1
f 1//1 2//1 3//1 4//1
f 5//2 6//2 7//2 8//2
f 1//3 5//3 6//3 2//3
f 2//4 6//4 7//4 3//4
f 3//2 7//2 8//2 4//2
f 4//5 8//5 5//5 1//5
f 9//1 10//1 11//1 12//1
`;
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename="xadboom_${target.id.toLowerCase()}_model.obj"`);
  res.send(objContent);
});

// Design System Screens Definition
const SCREENS = [
  { id: 'home', group: 'Storefront', label: 'Curated Home', route: '/', file: 'xadboom_curated_interior_architecture_homepage_harmonized/code.html' },
  { id: 'catalog', group: 'Storefront', label: 'Typologies Catalog', route: '/catalog', file: 'curated_architectural_assets_physical_typologies_xadboom/code.html' },
  { id: 'product', group: 'Storefront', label: 'Lumen Void Chair', route: '/product', file: 'lumen_void_lounge_chair_product_detail_xadboom/code.html' },
  { id: 'designers', group: 'Storefront', label: 'Visionaries (1)', route: '/designers', file: 'designers_collaborating_visionaries_xadboom_1/code.html' },
  { id: 'designers-2', group: 'Storefront', label: 'Visionaries (2)', route: '/designers-2', file: 'designers_collaborating_visionaries_xadboom_2/code.html' },
  { id: 'contact', group: 'Storefront', label: 'Curatorial Inquiries', route: '/contact', file: 'contact_curatorial_inquiries_xadboom/code.html' },
  { id: 'admin-overview', group: 'Atelier Admin', label: 'Operations & Ledger', route: '/admin', file: 'xadboom_atelier_admin_operations_inventory_lock_harmonized/code.html' },
  { id: 'admin-pieces', group: 'Atelier Admin', label: 'Pieces Catalog', route: '/admin/pieces', file: 'pieces_catalog_xadboom_atelier_admin/code.html' },
  { id: 'admin-add-piece', group: 'Atelier Admin', label: '+ Add Piece', route: '/admin/pieces/new', file: 'add_new_piece_xadboom_atelier_admin/code.html' },
  { id: 'admin-categories', group: 'Atelier Admin', label: 'Categories', route: '/admin/categories', file: 'categories_typologies_xadboom_atelier_admin/code.html' },
  { id: 'admin-designers', group: 'Atelier Admin', label: 'Collaborators', route: '/admin/designers', file: 'designers_collaborators_xadboom_atelier_admin/code.html' },
  { id: 'admin-orders', group: 'Atelier Admin', label: 'Orders & Dispatches', route: '/admin/orders', file: 'orders_dispatches_xadboom_atelier_admin/code.html' },
  { id: 'admin-inquiries', group: 'Atelier Admin', label: 'Inquiries & Forms', route: '/admin/inquiries', file: 'inquiries_forms_xadboom_atelier_admin/code.html' },
  { id: 'admin-users', group: 'Atelier Admin', label: 'Users & Accounts', route: '/admin/users', file: 'users_accounts_xadboom_atelier_admin/code.html' },
];

// Helper to inject navigation enhancement and interactive 15-minute Cart Drawer into served HTML
function enhanceHtml(html, activeScreenId) {
  const currentScreen = SCREENS.find(s => s.id === activeScreenId) || SCREENS[0];

  const storefrontLinks = SCREENS.filter(s => s.group === 'Storefront').map(s => {
    const isActive = s.id === currentScreen.id;
    return `<a href="${s.route}" class="px-2.5 py-1 rounded text-[11px] font-mono tracking-wider transition-all ${
      isActive
        ? 'bg-[#0A0A0A] text-[#FFF8F6] font-semibold'
        : 'text-[#4D4540] hover:text-[#0A0A0A] hover:bg-[#ECDAD4]'
    }">${s.label}</a>`;
  }).join('');

  const adminLinks = SCREENS.filter(s => s.group === 'Atelier Admin').map(s => {
    const isActive = s.id === currentScreen.id;
    return `<a href="${s.route}" class="px-2.5 py-1 rounded text-[11px] font-mono tracking-wider transition-all ${
      isActive
        ? 'bg-[#0A0A0A] text-[#FFF8F6] font-semibold'
        : 'text-[#4D4540] hover:text-[#0A0A0A] hover:bg-[#ECDAD4]'
    }">${s.label}</a>`;
  }).join('');

  const injection = `
<!-- BEGIN: Interactive Cart Drawer (15-Minute Allocation Lock Engine) -->
<div id="xadboom-cart-drawer" style="display:none;position:fixed;top:0;right:0;bottom:0;width:100%;max-width:440px;background:#FFF8F6;box-shadow:-12px 0 40px rgba(35,26,22,0.2);z-index:100000;border-left:1px solid #D8C3BC;font-family:'DM Sans',sans-serif;color:#1C1917;flex-direction:column;">
  <!-- Drawer Header -->
  <div style="padding:20px 24px;border-bottom:1px solid #D8C3BC;display:flex;align-items:center;justify-content:between;background:#ECDAD4;">
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="width:8px;height:8px;border-radius:50%;background:#0A0A0A;"></span>
      <h3 style="margin:0;font-family:'Space Grotesk',monospace;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">Allocation Bag &amp; Reservation</h3>
    </div>
    <button id="xadboom-cart-close" style="background:transparent;border:0;font-size:18px;cursor:pointer;color:#1C1917;padding:4px 8px;font-family:monospace;" aria-label="Close Bag">✕</button>
  </div>

  <!-- 15-Minute Reservation Lock Banner -->
  <div id="xadboom-lock-banner" style="background:#FFF1EC;border-bottom:1px solid #E2CECB;padding:12px 24px;display:flex;align-items:center;justify-content:between;">
    <div style="display:flex;align-items:center;gap:8px;">
      <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#844C38;animation:pulse 1.5s infinite;"></span>
      <span style="font-family:'Space Grotesk',monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#844C38;font-weight:600;">15-MIN LOCK ACTIVE</span>
    </div>
    <div id="xadboom-countdown" style="font-family:'Space Grotesk',monospace;font-size:12px;font-weight:700;color:#0A0A0A;letter-spacing:0.08em;">
      14:45
    </div>
  </div>

  <!-- Drawer Body -->
  <div id="xadboom-cart-items" style="flex:1;overflow-y:auto;padding:24px;">
    <!-- Rendered dynamically -->
  </div>

  <!-- Drawer Footer -->
  <div style="padding:20px 24px;border-top:1px solid #D8C3BC;background:#FFF1EC;">
    <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:11px;font-family:'Space Grotesk',monospace;text-transform:uppercase;letter-spacing:0.06em;color:#7A6E69;">
      <span>Atelier White-Glove Crate</span>
      <span style="color:#0A0A0A;font-weight:600;">COMPLIMENTARY</span>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:14px;font-weight:700;">
      <span style="font-family:'Space Grotesk',monospace;text-transform:uppercase;letter-spacing:0.06em;">Total Acquisition</span>
      <span id="xadboom-cart-total" style="font-family:'Space Grotesk',monospace;">$9,400</span>
    </div>
    <button id="xadboom-checkout-btn" style="width:100%;padding:14px;background:#0A0A0A;color:#FFF8F6;border:0;border-radius:9999px;font-family:'Space Grotesk',monospace;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;cursor:pointer;margin-bottom:8px;transition:opacity 0.2s;">
      PROCEED TO ALLOCATION CHECKOUT ↗
    </button>
    <button id="xadboom-release-btn" style="width:100%;padding:8px;background:transparent;color:#7A6E69;border:0;font-family:'Space Grotesk',monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;cursor:pointer;">
      Release Vault Lock Back to Inventory
    </button>
  </div>
</div>
<div id="xadboom-cart-backdrop" style="display:none;position:fixed;inset:0;background:rgba(28,25,23,0.4);backdrop-filter:blur(2px);z-index:99999;"></div>

<!-- Quick Architectural Switcher Pill -->
<div id="xadboom-quick-nav" style="position:fixed;bottom:14px;left:50%;transform:translateX(-50%);z-index:99998;font-family:'Space Grotesk',sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="box-shadow:0 8px 32px rgba(35,26,22,0.18);border:1px solid #D8C3BC;background:rgba(255,248,246,0.96);backdrop-filter:blur(16px);border-radius:9999px;padding:6px 14px;display:flex;align-items:center;gap:12px;">
    
    <div style="display:flex;align-items:center;gap:8px;">
      <span style="width:7px;height:7px;border-radius:50%;background:#844C38;display:inline-block;"></span>
      <span style="font-size:10.5px;font-family:'Space Grotesk',monospace;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;color:#1C1917;">Xadboom</span>
      <span style="font-size:10px;color:#7A6E69;font-family:monospace;">[${currentScreen.label}]</span>
    </div>

    <div id="xadboom-nav-expanded" style="display:flex;align-items:center;gap:10px;border-left:1px solid #D8C3BC;padding-left:12px;">
      <div style="display:flex;align-items:center;gap:4px;">
        <span style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:#7A6E69;font-family:monospace;margin-right:2px;">Store:</span>
        ${storefrontLinks}
      </div>
      <div style="height:14px;width:1px;background:#D8C3BC;"></div>
      <div style="display:flex;align-items:center;gap:4px;">
        <span style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:#844C38;font-family:monospace;margin-right:2px;">Admin:</span>
        ${adminLinks}
      </div>
    </div>

    <!-- Bag Opener Pill in Bar -->
    <button id="xadboom-open-cart-pill" style="background:#0A0A0A;color:#FFF8F6;border:0;border-radius:9999px;padding:3px 10px;font-size:10px;font-family:monospace;font-weight:700;letter-spacing:0.06em;cursor:pointer;display:flex;align-items:center;gap:4px;">
      <span>BAG</span>
      <span id="xadboom-pill-cart-count" style="background:#844C38;border-radius:50%;padding:1px 5px;font-size:9px;">1</span>
    </button>

    <button id="xadboom-nav-toggle" style="background:#ECDAD4;border:1px solid #D8C3BC;border-radius:9999px;padding:3px 8px;font-size:10px;font-family:monospace;cursor:pointer;color:#1C1917;font-weight:600;" title="Toggle Bar">
      ▾
    </button>
  </div>
</div>

<script>
(function() {
  // Navigation Bar Collapse
  var expanded = document.getElementById('xadboom-nav-expanded');
  var toggle = document.getElementById('xadboom-nav-toggle');
  if (toggle && expanded) {
    var isCollapsed = localStorage.getItem('xadboom_nav_collapsed') === 'true';
    if (isCollapsed) {
      expanded.style.display = 'none';
      toggle.innerText = '▴ Expand';
    }
    toggle.addEventListener('click', function() {
      if (expanded.style.display === 'none') {
        expanded.style.display = 'flex';
        toggle.innerText = '▾';
        localStorage.setItem('xadboom_nav_collapsed', 'false');
      } else {
        expanded.style.display = 'none';
        toggle.innerText = '▴ Expand';
        localStorage.setItem('xadboom_nav_collapsed', 'true');
      }
    });
  }

  // Cart Drawer Logic
  var drawer = document.getElementById('xadboom-cart-drawer');
  var backdrop = document.getElementById('xadboom-cart-backdrop');
  var closeBtn = document.getElementById('xadboom-cart-close');
  var openPill = document.getElementById('xadboom-open-cart-pill');
  var countdownEl = document.getElementById('xadboom-countdown');
  var itemsContainer = document.getElementById('xadboom-cart-items');
  var totalEl = document.getElementById('xadboom-cart-total');
  var pillCount = document.getElementById('xadboom-pill-cart-count');
  var checkoutBtn = document.getElementById('xadboom-checkout-btn');
  var releaseBtn = document.getElementById('xadboom-release-btn');

  function openCart() {
    drawer.style.display = 'flex';
    backdrop.style.display = 'block';
    refreshCart();
  }

  function closeCart() {
    drawer.style.display = 'none';
    backdrop.style.display = 'none';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeCart);
  if (backdrop) backdrop.addEventListener('click', closeCart);
  if (openPill) openPill.addEventListener('click', openCart);

  // Hook all existing "Bag" buttons in headers
  document.querySelectorAll('button, a').forEach(function(el) {
    var txt = (el.innerText || '').toLowerCase();
    if (txt.includes('bag') && !el.id.includes('xadboom')) {
      el.addEventListener('click', function(e) {
        e.preventDefault();
        openCart();
      });
    }
  });

  // Countdown timer handler
  var remainingSeconds = 885;
  setInterval(function() {
    if (remainingSeconds > 0) {
      remainingSeconds--;
      var m = Math.floor(remainingSeconds / 60);
      var s = remainingSeconds % 60;
      if (countdownEl) {
        countdownEl.innerText = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
      }
    } else {
      if (countdownEl) countdownEl.innerText = '00:00 (EXPIRED)';
    }
  }, 1000);

  function refreshCart() {
    fetch('/api/cart')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (pillCount) pillCount.innerText = data.count;
        if (data.remainingSeconds) remainingSeconds = data.remainingSeconds;

        if (data.items.length === 0) {
          itemsContainer.innerHTML = '<div style="text-align:center;padding:40px 10px;color:#7A6E69;font-family:monospace;font-size:12px;">NO ACTIVE ALLOCATIONS IN BAG.<br><br><a href="/catalog" style="display:inline-block;padding:8px 16px;background:#0A0A0A;color:#fff;border-radius:9999px;text-decoration:none;font-size:11px;margin-top:10px;">EXPLORE CATALOG ↗</a></div>';
          totalEl.innerText = '$0';
          return;
        }

        var item = data.items[0];
        totalEl.innerText = item.price;
        itemsContainer.innerHTML = 
          '<div style="border:1px solid #E2CECB;border-radius:12px;padding:16px;background:#FFF1EC;margin-bottom:16px;">' +
            '<div style="display:flex;gap:14px;align-items:start;">' +
              '<img src="' + item.image + '" style="width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid #D8C3BC;">' +
              '<div style="flex:1;">' +
                '<span style="font-family:Space Grotesk,monospace;font-size:9px;color:#844C38;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;display:block;">EDITION ALLOCATION</span>' +
                '<h4 style="margin:2px 0 4px;font-size:14px;font-weight:700;">' + item.title + '</h4>' +
                '<p style="margin:0;font-size:11px;color:#7A6E69;">' + item.designer + ' · ' + item.materials + '</p>' +
                '<div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center;">' +
                  '<span style="font-family:Space Grotesk,monospace;font-size:10px;background:#0A0A0A;color:#fff;padding:2px 6px;border-radius:4px;">' + item.reservedEdition + '</span>' +
                  '<span style="font-family:Space Grotesk,monospace;font-size:13px;font-weight:700;">' + item.price + '</span>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div style="margin-top:12px;padding-top:10px;border-top:1px dashed #D8C3BC;font-size:10.5px;color:#554B47;display:flex;align-items:center;gap:6px;">' +
              '<span>🛡️</span>' +
              '<span>Cryptographic Provenance Token: <strong>XB-PROV-' + item.id + '</strong></span>' +
            '</div>' +
          '</div>';
      });
  }

  // Release lock
  if (releaseBtn) {
    releaseBtn.addEventListener('click', function() {
      fetch('/api/cart/remove', { method: 'POST' })
        .then(function() {
          refreshCart();
          alert('Allocation hold released back to atelier inventory.');
        });
    });
  }

  // Checkout action
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function() {
      checkoutBtn.innerText = 'DISPATCHING TO LEDGER...';
      fetch('/api/cart/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collector: 'Faraz Yavari', destination: 'Zurich / Private Collector' })
      })
      .then(function(r) { return r.json(); })
      .then(function(res) {
        if (res.success) {
          itemsContainer.innerHTML = 
            '<div style="text-align:center;padding:30px 10px;">' +
              '<div style="width:48px;height:48px;border-radius:50%;background:#0A0A0A;color:#fff;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:22px;">✓</div>' +
              '<h4 style="font-family:Space Grotesk,monospace;font-size:15px;margin:0 0 8px;text-transform:uppercase;">ACQUISITION CONFIRMED</h4>' +
              '<p style="font-size:12px;color:#7A6E69;line-height:1.5;">' + res.order.orderNumber + '<br>Certificate: ' + res.order.certId + '</p>' +
              '<p style="font-size:11px;background:#FFF1EC;padding:10px;border-radius:8px;border:1px solid #D8C3BC;margin-top:16px;">Curatorial crate scheduled for dual-signed courier dispatch. Provenance ledger synchronized.</p>' +
            '</div>';
          totalEl.innerText = '$0';
          if (pillCount) pillCount.innerText = '0';
          checkoutBtn.style.display = 'none';
          releaseBtn.style.display = 'none';
        }
      });
    });
  }

  // Hook "ACQUIRE / RESERVE" buttons
  document.querySelectorAll('button, a').forEach(function(el) {
    var txt = (el.innerText || '').toLowerCase();
    if (txt.includes('acquire') || txt.includes('reserve') || txt.includes('the collection') || txt.includes('take allocation')) {
      el.addEventListener('click', function(e) {
        if (el.getAttribute('href') === '/catalog' || el.getAttribute('href') === '#assets') return;
        e.preventDefault();
        fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pieceId: 'LV-0312' })
        }).then(function() {
          openCart();
        });
      });
    }
  });

  // Hook "3D / SPEC" & Spec download buttons
  document.querySelectorAll('button, a').forEach(function(el) {
    var txt = (el.innerText || '').toLowerCase();
    if (txt.includes('spec') || txt.includes('3d') || txt.includes('tear sheet')) {
      if (!el.getAttribute('href') || el.getAttribute('href') === '#' || el.getAttribute('href').startsWith('#spec')) {
        el.addEventListener('click', function(e) {
          e.preventDefault();
          window.location.href = '/api/download-spec/LV-0312';
        });
      }
    }
  });

  // Hook Contact Form submissions to live API
  document.querySelectorAll('form').forEach(function(form) {
    form.addEventListener('submit', function(e) {
      var emailInput = form.querySelector('input[type="email"]');
      var nameInput = form.querySelector('input[name="name"], input[placeholder*="Name"], input[id*="name"]');
      var msgInput = form.querySelector('textarea');
      if (emailInput && !form.getAttribute('action')) {
        e.preventDefault();
        var submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('button');
        var originalText = submitBtn ? submitBtn.innerText : 'Submit';
        if (submitBtn) submitBtn.innerText = 'SUBMITTING TO CURATORIAL DESK...';
        
        fetch('/api/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client: nameInput ? nameInput.value : 'Architectural Specifier',
            email: emailInput.value,
            message: msgInput ? msgInput.value : 'Consultation request for limited editions.',
            piece: 'Lumen Void Lounge Chair'
          })
        }).then(function() {
          if (submitBtn) submitBtn.innerText = '✓ INQUIRY REGISTERED (SLA: 3H)';
          setTimeout(function() {
            alert('Your curatorial inquiry has been registered with the Xadboom Atelier desk. Reference: INQ-2026. Curator SLA response time: 3 hours.');
            if (submitBtn) submitBtn.innerText = originalText;
          }, 400);
        });
      }
    });
  });

  // Wire Admin Sidebar links
  document.querySelectorAll('nav [data-path]').forEach(function(el) {
    var p = el.getAttribute('data-path');
    var map = {
      'overview': '/admin',
      'pieces-catalog': '/admin/pieces',
      'curatorial-archives': '/admin/categories',
      'acquisitions': '/admin/orders',
      'provenance-records': '/admin/inquiries',
      'settings': '/admin/users'
    };
    if (map[p]) el.setAttribute('href', map[p]);
  });

  document.querySelectorAll('aside a, nav a').forEach(function(a) {
    var txt = (a.innerText || '').trim();
    if (txt.includes('Overview & Dashboard')) a.setAttribute('href', '/admin');
    else if (txt.includes('Pieces Catalog')) a.setAttribute('href', '/admin/pieces');
    else if (txt.includes('Categories')) a.setAttribute('href', '/admin/categories');
    else if (txt.includes('Designers & Collaborators')) a.setAttribute('href', '/admin/designers');
    else if (txt.includes('Orders & Dispatches')) a.setAttribute('href', '/admin/orders');
    else if (txt.includes('Users & Accounts')) a.setAttribute('href', '/admin/users');
    else if (txt.includes('Inquiries & Forms')) a.setAttribute('href', '/admin/inquiries');
  });

  // Direct piece card clicks to product detail page
  document.querySelectorAll('[data-purpose="product-card"], article').forEach(function(card) {
    var txt = card.innerText || '';
    if (txt.includes('Lumen Void Lounge Chair')) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', function(e) {
        if (!e.target.closest('a') && !e.target.closest('button')) {
          window.location.href = '/product';
        }
      });
    }
  });

  // Wire "+ Add New Piece" button
  document.querySelectorAll('button, a').forEach(function(btn) {
    var txt = (btn.innerText || '').trim();
    if (txt.includes('Add New Piece')) {
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/admin/pieces/new';
      });
    }
  });
})();
</script>
<!-- END: Interactive Cart Drawer -->
`;

  if (html.includes('</body>')) {
    return html.replace('</body>', `${injection}</body>`);
  }
  return html + injection;
}

// Serve configured screens
SCREENS.forEach(screen => {
  const handler = (req, res) => {
    const filePath = path.join(__dirname, screen.file);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send(`Screen file not found: ${screen.file}`);
    }
    let rawHtml = fs.readFileSync(filePath, 'utf-8');

    // Sync newly generated architectural photograph in the hero and product detail if appropriate
    if (screen.id === 'home' || screen.id === 'product') {
      rawHtml = rawHtml.replace('https://lh3.googleusercontent.com/aida-public/AB6AXuAQdUauC7vpysuiA9tx1JOB53hI_4-RiNjQDKniBfEPLq-y0SxlS5ps5TmG8h8si9FVw-yjNJEp7B4sIOJb8BHX9eug-PxO0KeV_jqtx7ckHqdkv3C2kG94CELMw_S6APet6Vq2VR8n89mghqyVK18TcUHQdXF6rQKhdEnjc1zr37M8lIu7qDSb9Mflx2pEX8b9BxL1tTACK1Yh-dkNmxDPxGCKy2mRfv-wv6H5mLZN', '/assets/xadboom_hero_piece.jpg');
    }

    const enhanced = enhanceHtml(rawHtml, screen.id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(enhanced);
  };

  app.get(screen.route, handler);
  if (screen.route === '/') {
    app.get('/home', handler);
  }
  if (screen.route === '/catalog') {
    app.get('/assets', handler);
  }
  if (screen.route === '/product') {
    app.get('/chair', handler);
    app.get('/product/lumen-void', handler);
    app.get('/product/:id', handler);
  }
  if (screen.route === '/designers') {
    app.get('/designers-1', handler);
    app.get('/designer-monograph', handler);
  }
  if (screen.route === '/admin') {
    app.get('/admin/overview', handler);
  }
});

// Direct access to directories containing code.html
app.get('/:dir', (req, res, next) => {
  const dirPath = path.join(__dirname, req.params.dir);
  const codePath = path.join(dirPath, 'code.html');
  if (fs.existsSync(codePath)) {
    const matched = SCREENS.find(s => s.file.startsWith(req.params.dir));
    const raw = fs.readFileSync(codePath, 'utf-8');
    return res.send(enhanceHtml(raw, matched ? matched.id : ''));
  }
  next();
});

// Static assets
app.use(express.static(__dirname));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    screens: SCREENS.length,
    activePieces: pieces.length,
    inquiries: inquiries.length,
    cartHolds: cartState.items.length,
    timestamp: new Date().toISOString()
  });
});

// 404 fallback to Home
app.use((req, res) => {
  res.redirect('/');
});

app.listen(PORT, HOST, () => {
  console.log(`Xadboom Atelier dev server running on http://${HOST}:${PORT}`);
});
