import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags } from "@nestjs/swagger";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { AuthModule } from "../auth/auth.module";
import { Auth, CurrentUser } from "../auth/auth.guard";
import type { AuthUser } from "../auth/auth.service";
import { ZodPipe } from "../common/zod.pipe";
import { PrismaService } from "../prisma/prisma.module";

export const uploadRoot = () => path.resolve(process.env.UPLOAD_DIR ?? "./uploads");

// ───────────── input ─────────────

const imageUrl = z.string().max(500).refine((u) => u.startsWith("/api/uploads/") || u.startsWith("/images/"), "Image must be an uploaded file");

const pieceInput = z
  .object({
    title: z.string().trim().min(1).max(160),
    designerId: z.string().min(1),
    categoryId: z.string().min(1),
    sku: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{3,24}$/, "Serial may use letters, numbers and dashes (3-24)").optional(),
    provenance: z.string().trim().max(200).nullish(),
    description: z.string().trim().max(8000).nullish(),
    leadTime: z.string().trim().max(120).nullish(),
    materials: z.array(z.string().trim().min(1).max(120)).max(12).default([]),
    images: z.array(z.object({ url: imageUrl, alt: z.string().trim().max(200).nullish() })).max(12).default([]),
    totalEditions: z.number().int().min(1).max(500),
    releasedEditions: z.number().int().min(0).max(500),
    priceUsd: z.number().min(0).max(100_000_000),
    lengthMm: z.number().int().min(1).max(100_000).nullish(),
    widthMm: z.number().int().min(1).max(100_000).nullish(),
    heightMm: z.number().int().min(1).max(100_000).nullish(),
    weightKg: z.number().min(0).max(100_000).nullish(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
    featured: z.boolean().default(false),
  })
  .refine((v) => v.releasedEditions <= v.totalEditions, { message: "Released units cannot exceed the edition run", path: ["releasedEditions"] })
  .refine((v) => v.status !== "PUBLISHED" || v.images.length > 0, { message: "Add at least one photograph before publishing", path: ["images"] });
type PieceInput = z.infer<typeof pieceInput>;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "piece";

// ───────────── service ─────────────

@Injectable()
export class PiecesAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async options() {
    const db = this.prisma.db;
    const [designers, categories] = await Promise.all([
      db.designer.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, studio: true } }),
      db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    ]);
    return { designers, categories };
  }

  async get(id: string) {
    const p = await this.prisma.db.piece.findFirst({
      where: { id, deletedAt: null },
      include: { images: { orderBy: { sortOrder: "asc" } }, editions: { select: { status: true } } },
    });
    if (!p) throw new NotFoundException("Piece not found");
    const count = (s: string) => p.editions.filter((e) => e.status === s).length;
    return {
      id: p.id,
      slug: p.slug,
      sku: p.sku,
      title: p.title,
      designerId: p.designerId,
      categoryId: p.categoryId,
      provenance: p.provenance,
      description: p.description,
      leadTime: p.leadTime,
      materials: p.materials ? p.materials.split(" & ") : [],
      images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
      totalEditions: p.totalEditions,
      releasedEditions: count("AVAILABLE"),
      placedEditions: count("SOLD") + count("RESERVED"),
      priceUsd: p.priceUsdCents / 100,
      lengthMm: p.lengthMm,
      widthMm: p.widthMm,
      heightMm: p.heightMm,
      weightKg: p.weightKg ? Number(p.weightKg) : null,
      status: p.status,
      featured: p.featured,
    };
  }

  private async uniqueSlug(base: string, ignoreId?: string) {
    const db = this.prisma.db;
    let slug = base;
    for (let n = 2; await db.piece.findFirst({ where: { slug, NOT: ignoreId ? { id: ignoreId } : undefined }, select: { id: true } }); n++) slug = `${base}-${n}`;
    return slug;
  }

  private async newSku(title: string) {
    const db = this.prisma.db;
    const initials = title.split(/\s+/).filter(Boolean).map((w) => w[0]).join("").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3) || "XB";
    for (;;) {
      const sku = `${initials}-${String(Math.floor(1000 + Math.random() * 9000))}`;
      if (!(await db.piece.findUnique({ where: { sku }, select: { id: true } }))) return sku;
    }
  }

  private async assertRefs(input: PieceInput) {
    const db = this.prisma.db;
    const [d, c] = await Promise.all([
      db.designer.findUnique({ where: { id: input.designerId }, select: { id: true } }),
      db.category.findUnique({ where: { id: input.categoryId }, select: { id: true } }),
    ]);
    if (!d) throw new BadRequestException("Unknown designer");
    if (!c) throw new BadRequestException("Unknown category");
  }

  async create(input: PieceInput, actor: AuthUser) {
    await this.assertRefs(input);
    const db = this.prisma.db;
    const sku = input.sku ?? (await this.newSku(input.title));
    if (await db.piece.findUnique({ where: { sku }, select: { id: true } })) throw new ConflictException("That serial code is already used");
    const slug = await this.uniqueSlug(slugify(input.title));
    const piece = await db.piece.create({
      data: {
        sku,
        slug,
        title: input.title,
        designerId: input.designerId,
        categoryId: input.categoryId,
        provenance: input.provenance ?? null,
        description: input.description ?? null,
        leadTime: input.leadTime ?? null,
        materials: input.materials.join(" & ") || null,
        priceUsdCents: Math.round(input.priceUsd * 100),
        lengthMm: input.lengthMm ?? null,
        widthMm: input.widthMm ?? null,
        heightMm: input.heightMm ?? null,
        weightKg: input.weightKg ?? null,
        totalEditions: input.totalEditions,
        status: input.status,
        featured: input.featured,
        images: { create: input.images.map((i, n) => ({ url: i.url, alt: i.alt ?? null, sortOrder: n })) },
        editions: {
          create: Array.from({ length: input.totalEditions }, (_, i) => ({
            number: i + 1,
            status: i < input.releasedEditions ? ("AVAILABLE" as const) : ("WITHHELD" as const),
          })),
        },
      },
      select: { id: true },
    });
    await db.auditLog.create({ data: { actorId: actor.id, action: "piece.create", entity: "Piece", entityId: piece.id, diff: { sku, title: input.title } } });
    return this.get(piece.id);
  }

  async update(id: string, input: PieceInput, actor: AuthUser) {
    await this.assertRefs(input);
    const db = this.prisma.db;
    const existing = await db.piece.findFirst({ where: { id, deletedAt: null }, select: { id: true, sku: true, title: true, slug: true } });
    if (!existing) throw new NotFoundException("Piece not found");
    const sku = input.sku ?? existing.sku;
    if (sku !== existing.sku && (await db.piece.findUnique({ where: { sku }, select: { id: true } }))) throw new ConflictException("That serial code is already used");

    await db.$transaction(async (tx) => {
      const editions = await tx.edition.findMany({ where: { pieceId: id }, orderBy: { number: "asc" } });
      const locked = editions.filter((e) => e.status === "SOLD" || e.status === "RESERVED");
      if (locked.some((e) => e.number > input.totalEditions)) throw new ConflictException("Units above the new run size are already sold or reserved");

      // drop units above the new run size, add missing ones
      await tx.edition.deleteMany({ where: { pieceId: id, number: { gt: input.totalEditions } } });
      const have = new Set(editions.filter((e) => e.number <= input.totalEditions).map((e) => e.number));
      const missing = Array.from({ length: input.totalEditions }, (_, i) => i + 1).filter((n) => !have.has(n));
      if (missing.length) await tx.edition.createMany({ data: missing.map((n) => ({ pieceId: id, number: n, status: "WITHHELD" as const })) });

      // release the lowest free numbers up to the requested count
      const free = (await tx.edition.findMany({ where: { pieceId: id, status: { in: ["AVAILABLE", "WITHHELD"] } }, orderBy: { number: "asc" }, select: { id: true } })).map((e) => e.id);
      if (input.releasedEditions > free.length) throw new BadRequestException(`Only ${free.length} units are free to release`);
      await tx.edition.updateMany({ where: { id: { in: free.slice(0, input.releasedEditions) } }, data: { status: "AVAILABLE" } });
      await tx.edition.updateMany({ where: { id: { in: free.slice(input.releasedEditions) } }, data: { status: "WITHHELD" } });

      await tx.pieceImage.deleteMany({ where: { pieceId: id } });
      await tx.piece.update({
        where: { id },
        data: {
          sku,
          title: input.title,
          slug: existing.title === input.title ? existing.slug : await this.uniqueSlug(slugify(input.title), id),
          designerId: input.designerId,
          categoryId: input.categoryId,
          provenance: input.provenance ?? null,
          description: input.description ?? null,
          leadTime: input.leadTime ?? null,
          materials: input.materials.join(" & ") || null,
          priceUsdCents: Math.round(input.priceUsd * 100),
          lengthMm: input.lengthMm ?? null,
          widthMm: input.widthMm ?? null,
          heightMm: input.heightMm ?? null,
          weightKg: input.weightKg ?? null,
          totalEditions: input.totalEditions,
          status: input.status,
          featured: input.featured,
          images: { create: input.images.map((i, n) => ({ url: i.url, alt: i.alt ?? null, sortOrder: n })) },
        },
      });
    });
    await db.auditLog.create({ data: { actorId: actor.id, action: "piece.update", entity: "Piece", entityId: id, diff: { sku, title: input.title, status: input.status } } });
    return this.get(id);
  }

  async remove(id: string, actor: AuthUser) {
    const db = this.prisma.db;
    const sold = await db.edition.count({ where: { pieceId: id, status: { in: ["SOLD", "RESERVED"] } } });
    if (sold) throw new ConflictException("This piece has sold or reserved units; archive it instead");
    const r = await db.piece.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date(), status: "ARCHIVED", featured: false } });
    if (!r.count) throw new NotFoundException("Piece not found");
    await db.auditLog.create({ data: { actorId: actor.id, action: "piece.delete", entity: "Piece", entityId: id } });
  }
}

// ───────────── controllers ─────────────

const IMAGE_TYPES: Record<string, { ext: string; magic: (b: Buffer) => boolean }> = {
  "image/jpeg": { ext: "jpg", magic: (b) => b[0] === 0xff && b[1] === 0xd8 },
  "image/png": { ext: "png", magic: (b) => b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])) },
  "image/webp": { ext: "webp", magic: (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP" },
};

@ApiTags("admin")
@Controller("admin")
export class AdminPiecesController {
  constructor(private readonly pieces: PiecesAdminService) {}

  @Get("options")
  @Auth("ADMIN", "EDITOR")
  options() {
    return this.pieces.options();
  }

  @Get("pieces/:id")
  @Auth("ADMIN", "EDITOR")
  one(@Param("id") id: string) {
    return this.pieces.get(id);
  }

  @Post("pieces")
  @HttpCode(201)
  @Auth("ADMIN", "EDITOR")
  create(@Body(new ZodPipe(pieceInput)) body: PieceInput, @CurrentUser() user: AuthUser) {
    return this.pieces.create(body, user);
  }

  @Patch("pieces/:id")
  @Auth("ADMIN", "EDITOR")
  update(@Param("id") id: string, @Body(new ZodPipe(pieceInput)) body: PieceInput, @CurrentUser() user: AuthUser) {
    return this.pieces.update(id, body, user);
  }

  @Delete("pieces/:id")
  @HttpCode(204)
  @Auth("ADMIN")
  async remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    await this.pieces.remove(id, user);
  }

  /** Photograph upload: stored under UPLOAD_DIR/images and served from /api/uploads/images/... */
  @Post("uploads/image")
  @HttpCode(201)
  @Auth("ADMIN", "EDITOR")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 25 * 1024 * 1024, files: 1 } }))
  async uploadImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("No file received");
    const type = IMAGE_TYPES[file.mimetype];
    // trust the bytes, not the declared type
    if (!type || !type.magic(file.buffer)) throw new BadRequestException("Only JPEG, PNG or WebP images are accepted");
    const dir = path.join(uploadRoot(), "images");
    await mkdir(dir, { recursive: true });
    const name = `${randomUUID()}.${type.ext}`;
    await writeFile(path.join(dir, name), file.buffer);
    return { url: `/api/uploads/images/${name}`, size: file.size };
  }
}

@Module({ imports: [AuthModule], controllers: [AdminPiecesController], providers: [PiecesAdminService] })
export class AdminPiecesModule {}
