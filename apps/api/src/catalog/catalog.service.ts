import { Injectable } from "@nestjs/common";
import { NotFoundException } from "@nestjs/common";
import { displayPrice, type PriceSettings } from "../common/money";
import { PrismaService } from "../prisma/prisma.module";
import { SettingsService } from "../settings/settings.module";

export const PAGE_SIZE = 6;

const pad = (n: number) => String(n).padStart(2, "0");

// short badge shown on catalogue cards
const CATEGORY_TAG: Record<string, string> = {
  "seating-lounges": "SEATING",
  "tables-consoles": "CONSOLES",
  "architectural-lighting": "LIGHTING",
  "spatial-accents-storage": "ACCENT",
};

function disciplineFilterKey(discipline: string | null) {
  if (discipline === "Structural Tectonics") return "tectonics";
  if (discipline === "Avant-Garde Spatial") return "avantgarde";
  return "materials";
}

const publishedWhere = { status: "PUBLISHED" as const, deletedAt: null };

const pieceInclude = {
  designer: true,
  category: true,
  images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
  editions: { where: { status: "AVAILABLE" as const }, orderBy: { number: "asc" as const } },
};

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  private loadPieces(where: object, opts: { skip?: number; take?: number } = {}) {
    return this.prisma.db.piece.findMany({
      where: { ...publishedWhere, ...where },
      include: pieceInclude,
      orderBy: [{ createdAt: "asc" }, { sku: "asc" }],
      ...opts,
    });
  }

  /** Display strings are resolved here once, so the frontend only renders. */
  private toCard(p: Awaited<ReturnType<CatalogService["loadPieces"]>>[number], settings: PriceSettings) {
    const available = p.editions.length;
    const next = p.editions[0]?.number ?? null;
    const price = displayPrice(p, settings);
    let availabilityLabel = `${available} AVAILABLE`;
    if (available === 0) availabilityLabel = "SOLD OUT";
    else if (available === 1) availabilityLabel = "1 LEFT (LOW STOCK)";
    let stockLabel = "IN-STOCK";
    if (available === 0) stockLabel = "SOLD OUT";
    else if (available === 1) stockLabel = "1 REMAINING";
    let priceUnit = "USD / EX-WORKS";
    if (price.usd && price.toman) priceUnit = `${price.toman} / EX-WORKS`;
    else if (!price.usd) priceUnit = "EX-WORKS";
    return {
      id: p.id,
      sku: p.sku,
      slug: p.slug,
      title: p.title,
      designerName: p.designer.name,
      designerLine: [p.designer.name, p.designer.studio].filter(Boolean).join(" / "),
      studio: p.designer.studio,
      materials: p.materials,
      categorySlug: p.category.slug,
      categoryName: p.category.name,
      tag: CATEGORY_TAG[p.category.slug] ?? p.category.name.split(" ")[0].toUpperCase(),
      image: p.images[0]?.url ?? "/images/placeholder.svg",
      total: p.totalEditions,
      available,
      nextEdition: next,
      editionLabel: next ? `EDITION ${pad(next)} OF ${pad(p.totalEditions)}` : `EDITION RUN OF ${pad(p.totalEditions)}`,
      availabilityLabel,
      stockLabel,
      lowStock: available === 1,
      soldOut: available === 0,
      price,
      priceUnit,
    };
  }

  async list(opts: { category?: string; page: number }) {
    const settings = await this.settings.getPriceSettings();
    const where = opts.category ? { category: { slug: opts.category } } : {};
    const db = this.prisma.db;
    const [rows, total, categories, allCount, availableEditions] = await Promise.all([
      this.loadPieces(where, { skip: (opts.page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
      db.piece.count({ where: { ...publishedWhere, ...where } }),
      db.category.findMany({
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { pieces: { where: publishedWhere } } } },
      }),
      db.piece.count({ where: publishedWhere }),
      db.edition.count({ where: { status: "AVAILABLE", piece: publishedWhere } }),
    ]);
    return {
      cards: rows.map((r) => this.toCard(r, settings)),
      total,
      page: opts.page,
      pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      allCount,
      availableEditions,
      categories: categories.map((c) => ({ slug: c.slug, name: c.name, count: c._count.pieces })),
    };
  }

  async featured(take = 4) {
    const settings = await this.settings.getPriceSettings();
    const [rows, total] = await Promise.all([
      this.loadPieces({ featured: true }, { take }),
      this.prisma.db.piece.count({ where: publishedWhere }),
    ]);
    return { cards: rows.map((r) => this.toCard(r, settings)), total };
  }

  async bySlug(slug: string) {
    const piece = await this.prisma.db.piece.findFirst({
      where: { slug, ...publishedWhere },
      include: { ...pieceInclude, images: { orderBy: { sortOrder: "asc" } }, assets: true },
    });
    if (!piece) throw new NotFoundException("Piece not found");
    const settings = await this.settings.getPriceSettings();
    return {
      card: this.toCard(piece, settings),
      description: piece.description,
      leadTime: piece.leadTime,
      provenance: piece.provenance,
      martindale: piece.martindale,
      dimensions: { lengthMm: piece.lengthMm, widthMm: piece.widthMm, heightMm: piece.heightMm, weightKg: piece.weightKg ? Number(piece.weightKg) : null },
      images: piece.images.map((i) => ({ url: i.url, alt: i.alt })),
      assets: piece.assets.map((a) => ({ id: a.id, kind: a.kind, filename: a.filename, url: a.url, isViewerModel: a.isViewerModel })),
    };
  }

  async designers() {
    const rows = await this.prisma.db.designer.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { pieces: { where: publishedWhere } } },
        pieces: { where: publishedWhere, orderBy: { createdAt: "asc" }, take: 1, select: { title: true, slug: true } },
      },
    });
    return rows.map(({ _count, pieces, ...d }) => ({
      ...d,
      pieceCount: _count.pieces,
      featuredPiece: pieces[0] ?? null,
      // grouping used by the page's discipline filter pills
      filterKey: disciplineFilterKey(d.discipline),
    }));
  }
}
