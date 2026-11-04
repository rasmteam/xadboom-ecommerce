import { getPrisma, hashPassword } from "../src/index";

const prisma = getPrisma();

const categories = [
  { slug: "seating-lounges", name: "Seating & Lounges", sortOrder: 1 },
  { slug: "tables-consoles", name: "Tables & Consoles", sortOrder: 2 },
  { slug: "spatial-accents-storage", name: "Spatial Accents & Storage", sortOrder: 3 },
  { slug: "architectural-lighting", name: "Architectural Lighting", sortOrder: 4 },
];

// Directory of collaborating studios, taken from the designers pages of the prototype.
const designers = [
  { slug: "alireza-taghaboni", profileImage: "/images/remote/96545e34c560.jpg", name: "Alireza Taghaboni", sortName: "Taghaboni, Alireza", studio: "NextOffice", city: "Tehran", title: "Principal Architect", discipline: "Structural Tectonics", materiality: "Cast Bronze & Volcanic Basalt", portrait: "/images/remote/bafbdc188857.jpg", sortOrder: 1,
    bio: "Renowned for dynamic facades & tectonic clarity (Sharifi-ha House). Investigating sculptural mass and responsive domestic spaces." },
  { slug: "farshid-moussavi", profileImage: "/images/remote/514c93e35ac3.jpg", name: "Farshid Moussavi", sortName: "Moussavi, Farshid", studio: "FMA Architecture", city: "London / Tehran", title: "Architect & Educator", discipline: "Avant-Garde Spatial", materiality: "Tessellated Ceramics & Envelopes", portrait: "/images/remote/dfab50db1f01.jpg", sortOrder: 2,
    bio: "Internationally acclaimed for structural tessellation and dynamic surfaces (MOCA Cleveland, London V&A Pavilion)." },
  { slug: "mehrdad-zavareh", profileImage: "/images/remote/cad0a37c9618.jpg", name: "Mehrdad Zavareh", sortName: "Zavareh, Mehrdad", studio: "Studio Zavareh", city: "Milan / Tehran", title: "Industrial Architect", discipline: "Material Exploration", materiality: "Sand-Cast Bronze & Woven Cane", portrait: "/images/remote/a2ca9bcfe499.jpg", sortOrder: 3,
    bio: "Pioneering organic joinery and tactile architectural objects created with raw stone quarries and century-old timber techniques." },
  { slug: "studio-khazeni", profileImage: "/images/remote/4a8dc1c0411e.jpg", name: "Reza Khazeni", sortName: "Khazeni, Reza", studio: "Studio Khazeni", city: "Tehran / Zurich", title: "Spatial Research Practice", discipline: "Structural Tectonics", materiality: "Blackened Ash & Mortise Stone", portrait: "/images/remote/bb0c4193a872.jpg", sortOrder: 4,
    bio: "Specializing in monolithic travertine furniture sculptures and bespoke metal accents with hand-finished cast bronze." },
  { slug: "atelier-arpa", name: "Niloufar & Danial", sortName: "Atelier Arpa", studio: "Atelier Arpa", city: "Isfahan / Milan", title: "Lighting & Timber Atelier", discipline: "Lighting & Timber", materiality: "Bent Ash & Opaline Glass", portrait: "/images/remote/664884ebac71.jpg", sortOrder: 5, bio: null },
  { slug: "parastoo-karimi", name: "Parastoo Karimi", sortName: "Karimi, Parastoo", studio: "ArchiVoid Practices", city: "Zurich / Tehran", title: null, discipline: "Structural Tectonics", materiality: "Basalt Monoliths & Volcanic Masonry", portrait: "/images/remote/0b4942b071de.jpg", sortOrder: 6, bio: null },
  { slug: "shayan-ebrahimi", name: "Shayan Ebrahimi", sortName: "Ebrahimi, Shayan", studio: "Ebrahimi Atelier", city: "Tehran", title: null, discipline: "Avant-Garde Spatial", materiality: "Cold Patinated Steel & Kilim", portrait: "/images/remote/583c687212ee.jpg", sortOrder: 7, bio: null },
];

// `ed` = the next numbered edition on offer, `avail` = units still available from that number on.
// Prices (USD) come from the catalogue/product pages; the two pieces only in the old server keep its price.
const pieces = [
  { sku: "LV-0312", featured: true, slug: "lumen-void-lounge-chair", title: "Lumen Void Lounge Chair", designer: "alireza-taghaboni", category: "seating-lounges",
    description: "Sculptural dynamic cantilever armchair engineered in kiln-cured Iranian walnut and tactile heavy-gauge olive bouclé wool.", materials: "Solid Carved Walnut & Boucle Wool", total: 12, ed: 3, avail: 3, priceUsdCents: 245000, leadTime: "6-8 Weeks",
    length: 840, width: 920, height: 760, weight: 28, martindale: "65,000 Cycles", provenance: "Tehran Atelier / Zurich Vault",
    image: "/images/remote/551f32debaa3.jpg" },
  { sku: "PF-0206", featured: true, slug: "primary-form-low-table", title: "Primary Form Low Table", designer: "studio-khazeni", category: "tables-consoles",
    materials: "Porous Travertine & Cast Oxidized Bronze", total: 6, ed: 2, avail: 2, priceUsdCents: 1480000, leadTime: "8-10 Weeks",
    length: 1400, width: 750, height: 320, weight: 95, martindale: "N/A (Solid Stone)", provenance: "Milan Vault / Zurich Node",
    image: "/images/remote/5543dbd8a045.jpg" },
  { sku: "TM-0402", slug: "tectonic-monolith-console", title: "Tectonic Monolith Console", designer: "alireza-taghaboni", category: "tables-consoles",
    materials: "Cast Bronze & Volcanic Basalt", total: 6, ed: 2, avail: 2, priceUsdCents: 380000, leadTime: "8-10 Weeks",
    length: null, width: null, height: null, weight: null, martindale: null, provenance: "Tehran Atelier",
    image: "/images/tectonic-console.jpg" },
  { sku: "LA-0820", featured: true, slug: "luma-wood-arc-lamp", title: "Luma Wood Arc Lamp", designer: "atelier-arpa", category: "architectural-lighting",
    materials: "Bent Oiled Oak & Hand-Blown Opal Glass", total: 20, ed: 8, avail: 5, priceUsdCents: 185000, leadTime: "4-6 Weeks",
    length: 450, width: 1200, height: 1950, weight: 16, martindale: "CE / UL Architectural Standard", provenance: "Zurich Atelier",
    image: "/images/remote/06c359e77b76.jpg" },
  { sku: "CD-0105", slug: "cantilever-cane-daybed", title: "Cantilever Cane Daybed", designer: "mehrdad-zavareh", category: "seating-lounges",
    materials: "Sand-Cast Bronze & Woven Cane", total: 5, ed: 1, avail: 1, priceUsdCents: 420000, leadTime: "10-12 Weeks",
    length: null, width: null, height: null, weight: null, martindale: null, provenance: "Milan Vault",
    image: "/images/cantilever-daybed.jpg" },
  { sku: "RC-0516", slug: "radial-carved-ash-chair", title: "Radial Carved Ash Chair", designer: "studio-khazeni", category: "seating-lounges",
    materials: "Blackened Ash", total: 16, ed: 5, avail: 6, priceUsdCents: 165000, leadTime: "6-8 Weeks",
    length: null, width: null, height: null, weight: null, martindale: null, provenance: "Zurich Atelier",
    image: "/images/radial-carved-ash-chair.jpg" },
  { sku: "SF-0105", featured: true, slug: "silence-fluted-credenza", title: "Silence Fluted Credenza", designer: "mehrdad-zavareh", category: "spatial-accents-storage",
    materials: "Charcoal Tinted Ash & Cast Iron Joinery", total: 5, ed: 1, avail: 1, priceUsdCents: 1850000, leadTime: "10-12 Weeks",
    length: 2100, width: 520, height: 720, weight: 82, martindale: "Matte Structural Finish", provenance: "Tehran Atelier",
    image: "/images/remote/b236d62e6593.jpg" },
];

const inquiries = [
  { number: "INQ-2026-089", type: "Curatorial Consultation", client: "Studio Liaigre Paris", email: "specifications@liaigre.fr",
    project: "Haussmann Private Residence, 8th Arrondissement", piece: "LV-0312", status: "ACTIVE_REVIEW" as const,
    message: "Requesting dimensional tolerance validation and wood substrate finish samples for Paris commission." },
  { number: "INQ-2026-088", type: "Bespoke Architectural Commission", client: "Atelier Bow-Wow Specifiers", email: "t.tsukamoto@bow-wow.jp",
    project: "Karuizawa Forest Villa Commission", piece: "PF-0206", status: "TRIAGE_PASSED" as const,
    message: "Custom slab selection inquiry with un-filled raw travertine edge detailing." },
  { number: "INQ-2026-087", type: "Private Viewing Request", client: "Dr. Elena Rostova", email: "e.rostova@private-vault.ch",
    project: "Zurich Atelier In-Person Examination", piece: "SF-0105", status: "CONFIRMED" as const,
    message: "Client requesting Zurich vault appointment with chief curator." },
];

async function main() {
  await prisma.settings.upsert({
    where: { id: 1 }, update: {}, create: { id: 1, currencyMode: "USD" },
  });

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@xadboom.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword && process.env.NODE_ENV === "production") {
    throw new Error("SEED_ADMIN_PASSWORD is required in production");
  }
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail, name: "Atelier Admin", role: "ADMIN", kycStatus: "VERIFIED",
      passwordHash: await hashPassword(adminPassword ?? "change-me-now"),
    },
  });

  const catId: Record<string, string> = {};
  for (const c of categories) {
    catId[c.slug] = (await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c })).id;
  }
  const desId: Record<string, string> = {};
  for (const d of designers) {
    desId[d.slug] = (await prisma.designer.upsert({ where: { slug: d.slug }, update: {}, create: d })).id;
  }

  const pieceId: Record<string, string> = {};
  for (const p of pieces) {
    const piece = await prisma.piece.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku, slug: p.slug, title: p.title, status: "PUBLISHED", featured: "featured" in p,
        designerId: desId[p.designer], categoryId: catId[p.category],
        description: (p as { description?: string }).description, materials: p.materials, provenance: p.provenance, leadTime: p.leadTime, martindale: p.martindale,
        priceUsdCents: p.priceUsdCents, totalEditions: p.total,
        lengthMm: p.length, widthMm: p.width, heightMm: p.height, weightKg: p.weight,
        images: { create: [{ url: p.image, alt: p.title, sortOrder: 0 }] },
        // numbers ed .. ed+avail-1 are on offer, every other number in the run is already placed
        editions: {
          create: Array.from({ length: p.total }, (_, i) => ({
            number: i + 1,
            status: i + 1 >= p.ed && i + 1 < p.ed + p.avail ? ("AVAILABLE" as const) : ("SOLD" as const),
          })),
        },
      },
    });
    pieceId[p.sku] = piece.id;
  }

  for (const q of inquiries) {
    await prisma.inquiry.upsert({
      where: { number: q.number },
      update: {},
      create: {
        number: q.number, type: q.type, client: q.client, email: q.email, project: q.project,
        message: q.message, status: q.status, pieceId: pieceId[q.piece], assigneeId: admin.id,
      },
    });
  }

  console.log(
    `seeded: settings, admin (${adminEmail}), ${categories.length} categories, ` +
      `${designers.length} designers, ${pieces.length} pieces, ${inquiries.length} inquiries`,
  );
}

main().finally(() => prisma.$disconnect());
