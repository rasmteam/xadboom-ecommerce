import { Body, Controller, Get, Injectable, Module, Patch, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { Auth, CurrentUser } from "../auth/auth.guard";
import type { AuthUser } from "../auth/auth.service";
import { displayPrice } from "../common/money";
import { ZodPipe } from "../common/zod.pipe";
import { PrismaService } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { SettingsModule, SettingsService } from "../settings/settings.module";

const ADMIN_PAGE_SIZE = 6;
const pad = (n: number) => String(n).padStart(2, "0");

const piecesQuery = z.object({
  search: z.string().trim().max(120).optional(),
  category: z.string().max(80).optional(),
  designer: z.string().max(80).optional(),
  status: z.enum(["available", "low", "reserved", "archived", "draft"]).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});
type PiecesQuery = z.infer<typeof piecesQuery>;

const settingsBody = z
  .object({
    currencyMode: z.enum(["USD", "TOMAN", "BOTH"]),
    usdToToman: z.number().int().min(1).max(100_000_000).nullable().optional(),
  })
  .refine((v) => v.currencyMode === "USD" || !!v.usdToToman, {
    message: "A Toman rate is required when Toman prices are shown",
    path: ["usdToToman"],
  });
type SettingsBody = z.infer<typeof settingsBody>;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  async pieces(q: PiecesQuery) {
    const db = this.prisma.db;
    const settings = await this.settings.getPriceSettings();

    const where: Record<string, unknown> = { deletedAt: null };
    if (q.category) where.category = { slug: q.category };
    if (q.designer) where.designer = { slug: q.designer };
    if (q.search) {
      where.OR = [
        { title: { contains: q.search, mode: "insensitive" } },
        { sku: { contains: q.search, mode: "insensitive" } },
        { designer: { name: { contains: q.search, mode: "insensitive" } } },
        { designer: { studio: { contains: q.search, mode: "insensitive" } } },
      ];
    }
    switch (q.status) {
      case "archived":
        where.status = "ARCHIVED";
        break;
      case "draft":
        where.status = "DRAFT";
        break;
      case "reserved":
        where.status = "PUBLISHED";
        where.editions = { some: { status: "RESERVED" } };
        break;
      case "available":
      case "low":
        where.status = "PUBLISHED";
        break;
      default:
        break;
    }

    const include = {
      category: true,
      designer: true,
      images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
      editions: { select: { status: true, number: true } },
      _count: { select: { assets: true } },
    };

    // availability filters depend on a computed count, so filter in memory (catalogues are small)
    const all = await db.piece.findMany({ where, include, orderBy: [{ createdAt: "asc" }, { sku: "asc" }] });
    const rows = all
      .map((p) => {
        const available = p.editions.filter((e) => e.status === "AVAILABLE");
        const next = available.length ? Math.min(...available.map((e) => e.number)) : null;
        let state: "available" | "low" | "soldout" | "draft" | "archived" = "available";
        if (p.status === "DRAFT") state = "draft";
        else if (p.status === "ARCHIVED") state = "archived";
        else if (available.length === 0) state = "soldout";
        else if (available.length === 1) state = "low";
        return {
          id: p.id,
          slug: p.slug,
          sku: p.sku,
          title: p.title,
          categoryName: p.category.name,
          image: p.images[0]?.url ?? "/images/placeholder.svg",
          designerName: p.designer.name,
          designerMeta: [p.designer.studio, p.designer.city].filter(Boolean).join(" / "),
          edition: `${pad(next ?? p.totalEditions)}/${pad(p.totalEditions)}`,
          availableCount: available.length,
          price: displayPrice(p, settings).primary,
          state,
          has3d: p._count.assets > 0,
        };
      })
      .filter((r) => (q.status === "available" ? r.state === "available" : q.status === "low" ? r.state === "low" : true));

    const total = rows.length;
    const page = Math.min(q.page, Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)));
    const slice = rows.slice((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE);

    const [categories, designers, editionCounts, assetPieces, totalPieces] = await Promise.all([
      db.category.findMany({
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { pieces: { where: { deletedAt: null } } } } },
      }),
      db.designer.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, name: true, studio: true } }),
      db.edition.groupBy({ by: ["status"], where: { piece: { deletedAt: null } }, _count: true }),
      db.piece.count({ where: { deletedAt: null, assets: { some: { kind: { in: ["GLB", "OBJ", "FBX", "RHINO_3DM", "IFC", "RVT"] } } } } }),
      db.piece.count({ where: { deletedAt: null } }),
    ]);
    const count = (s: string) => editionCounts.find((e) => e.status === s)?._count ?? 0;
    const editionsTotal = count("AVAILABLE") + count("RESERVED") + count("SOLD");

    return {
      rows: slice,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
      from: total === 0 ? 0 : (page - 1) * ADMIN_PAGE_SIZE + 1,
      to: (page - 1) * ADMIN_PAGE_SIZE + slice.length,
      stats: {
        totalPieces,
        typologies: categories.length,
        availableUnits: count("AVAILABLE"),
        allocationPercent: editionsTotal ? Math.round(((count("RESERVED") + count("SOLD")) / editionsTotal) * 100) : 0,
        lowStock: rows.filter((r) => r.state === "low").length,
        cadReadyPercent: totalPieces ? Math.round((assetPieces / totalPieces) * 100) : 0,
      },
      categories: categories.map((c) => ({ slug: c.slug, name: c.name, count: c._count.pieces })),
      designers,
    };
  }

  async updateSettings(body: SettingsBody, actorId: string) {
    const db = this.prisma.db;
    const row = await db.settings.upsert({
      where: { id: 1 },
      update: { currencyMode: body.currencyMode, usdToToman: body.usdToToman ?? null },
      create: { id: 1, currencyMode: body.currencyMode, usdToToman: body.usdToToman ?? null },
    });
    await db.auditLog.create({
      data: { actorId, action: "settings.currency", entity: "Settings", entityId: "1", diff: body },
    });
    return { currencyMode: row.currencyMode, usdToToman: row.usdToToman, updatedAt: row.updatedAt };
  }
}

@ApiTags("admin")
@Controller("admin")
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly settings: SettingsService,
  ) {}

  @Get("pieces")
  @Auth("ADMIN", "EDITOR")
  pieces(@Query(new ZodPipe(piecesQuery)) q: PiecesQuery) {
    return this.admin.pieces(q);
  }

  @Get("settings")
  @Auth("ADMIN", "EDITOR")
  getSettings() {
    return this.settings.getPriceSettings();
  }

  // only an ADMIN may change how prices are shown to customers
  @Patch("settings")
  @Auth("ADMIN")
  async patchSettings(@Body(new ZodPipe(settingsBody)) body: SettingsBody, @CurrentUser() user: AuthUser) {
    return this.admin.updateSettings(body, user.id);
  }
}

@Module({ imports: [AuthModule, SettingsModule], controllers: [AdminController], providers: [AdminService] })
export class AdminModule {}
