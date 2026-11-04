import { getPrisma, hashPassword } from "../src/index";

const prisma = getPrisma();

const categories = [
  { slug: "seating-lounges", name: "Seating & Lounges", sortOrder: 1 },
  { slug: "tables-consoles", name: "Tables & Consoles", sortOrder: 2 },
  { slug: "architectural-lighting", name: "Architectural Lighting", sortOrder: 3 },
  { slug: "spatial-accents-storage", name: "Spatial Accents & Storage", sortOrder: 4 },
];

const designers = [
  { slug: "alireza-taghaboni", name: "Alireza Taghaboni", studio: "NextOffice", portrait: null },
  { slug: "studio-khazeni", name: "Studio Khazeni", studio: "Studio Khazeni", portrait: "/images/studio-khazeni.jpg" },
  { slug: "atelier-arpa", name: "Atelier Arpa", studio: "Atelier Arpa", portrait: "/images/atelier-arpa.jpg" },
  { slug: "mehrdad-zavareh", name: "Mehrdad Zavareh", studio: "MZ Architects", portrait: null },
];

// Sample catalogue carried over from the legacy prototype (prices in USD cents).
// Images are placeholders from the legacy asset folder until real photography arrives.
const pieces = [
  {
    sku: "LV-0312", slug: "lumen-void-lounge-chair", title: "Lumen Void Lounge Chair",
    designer: "alireza-taghaboni", category: "seating-lounges",
    materials: "Solid Carved Walnut & Boucle Wool", totalEditions: 12, sold: 9,
    priceUsdCents: 940000, leadTime: "6-8 Weeks", length: 840, width: 920, height: 760, weight: 28,
    martindale: "65,000 Cycles", provenance: "Tehran Atelier / Zurich Vault",
    image: "/images/radial-carved-ash-chair.jpg",
  },
  {
    sku: "PF-0206", slug: "primary-form-low-table", title: "Primary Form Low Table",
    designer: "studio-khazeni", category: "tables-consoles",
    materials: "Porous Travertine & Cast Oxidized Bronze", totalEditions: 6, sold: 4,
    priceUsdCents: 1480000, leadTime: "8-10 Weeks", length: 1400, width: 750, height: 320, weight: 95,
    martindale: "N/A (Solid Stone)", provenance: "Milan Vault / Zurich Node",
    image: "/images/travertine-table.jpg",
  },
  {
    sku: "LA-0820", slug: "luma-wood-arc-lamp", title: "Luma Wood Arc Lamp",
    designer: "atelier-arpa", category: "architectural-lighting",
    materials: "Bent Oiled Oak & Hand-Blown Opal Glass", totalEditions: 20, sold: 13,
    priceUsdCents: 520000, leadTime: "4-6 Weeks", length: 450, width: 1200, height: 1950, weight: 16,
    martindale: "CE / UL Architectural Standard", provenance: "Zurich Atelier",
    image: "/images/luma-arc-lamp.jpg",
  },
  {
    sku: "SF-0105", slug: "silence-fluted-credenza", title: "Silence Fluted Credenza",
    designer: "mehrdad-zavareh", category: "spatial-accents-storage",
    materials: "Charcoal Tinted Ash & Cast Iron Joinery", totalEditions: 5, sold: 4,
    priceUsdCents: 1850000, leadTime: "10-12 Weeks", length: 2100, width: 520, height: 720, weight: 82,
    martindale: "Matte Structural Finish", provenance: "Tehran Atelier",
    image: "/images/tectonic-console.jpg",
  },
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
        sku: p.sku, slug: p.slug, title: p.title, status: "PUBLISHED",
        designerId: desId[p.designer], categoryId: catId[p.category],
        materials: p.materials, provenance: p.provenance, leadTime: p.leadTime, martindale: p.martindale,
        priceUsdCents: p.priceUsdCents, totalEditions: p.totalEditions,
        lengthMm: p.length, widthMm: p.width, heightMm: p.height, weightKg: p.weight,
        images: { create: [{ url: p.image, alt: p.title, sortOrder: 0 }] },
        // first `sold` numbers are taken; the rest are available
        editions: {
          create: Array.from({ length: p.totalEditions }, (_, i) => ({
            number: i + 1, status: i < p.sold ? ("SOLD" as const) : ("AVAILABLE" as const),
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
