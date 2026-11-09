import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags } from "@nestjs/swagger";
import ExcelJS from "exceljs";
import type { Response } from "express";
import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { diskStorage, memoryStorage } from "multer";
import { Auth, CurrentUser } from "../auth/auth.guard";
import { AuthModule } from "../auth/auth.module";
import type { AuthUser } from "../auth/auth.service";
import { PrismaService } from "../prisma/prisma.module";
import { AdminPiecesModule, PiecesAdminService, uploadRoot } from "./pieces.module";

// ───────────── 3D / CAD / document assets ─────────────

type Kind = "GLB" | "OBJ" | "FBX" | "RHINO_3DM" | "IFC" | "RVT" | "SPEC_XLSX" | "TEARSHEET_PDF" | "OTHER";
const BY_EXT: Record<string, Kind> = {
  ".glb": "GLB",
  ".gltf": "GLB",
  ".obj": "OBJ",
  ".fbx": "FBX",
  ".3dm": "RHINO_3DM",
  ".ifc": "IFC",
  ".rvt": "RVT",
  ".xlsx": "SPEC_XLSX",
  ".pdf": "TEARSHEET_PDF",
};
const MAX_ASSET_BYTES = 150 * 1024 * 1024;

const assetDir = () => path.join(uploadRoot(), "assets");
const MAGIC: Partial<Record<string, (head: Buffer) => boolean>> = {
  ".glb": (b) => b.subarray(0, 4).toString("latin1") === "glTF",
  ".xlsx": (b) => b[0] === 0x50 && b[1] === 0x4b, // zip
  ".pdf": (b) => b.subarray(0, 4).toString("latin1") === "%PDF",
};

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  async attach(pieceId: string, file: Express.Multer.File, actor: AuthUser) {
    const db = this.prisma.db;
    const ext = path.extname(file.originalname).toLowerCase();
    try {
      if (!(await db.piece.findFirst({ where: { id: pieceId, deletedAt: null }, select: { id: true } }))) throw new NotFoundException("Piece not found");
      const kind = BY_EXT[ext];
      if (!kind) throw new BadRequestException("Supported files: .glb .gltf .obj .fbx .3dm .ifc .rvt .xlsx .pdf");
      const check = MAGIC[ext];
      if (check) {
        const fd = await (await import("node:fs/promises")).open(file.path, "r");
        const head = Buffer.alloc(8);
        await fd.read(head, 0, 8, 0);
        await fd.close();
        if (!check(head)) throw new BadRequestException(`The file does not look like a real ${ext} file`);
      }
      // checksum for integrity / duplicate detection
      const hash = createHash("sha256");
      await new Promise<void>((resolve, reject) => {
        createReadStream(file.path).on("data", (d) => hash.update(d)).on("end", resolve).on("error", reject);
      });
      const stored = `${randomUUID()}${ext}`;
      await mkdir(assetDir(), { recursive: true });
      await rename(file.path, path.join(assetDir(), stored));

      // only one viewer model per piece: the newest GLB wins
      const isViewer = kind === "GLB";
      if (isViewer) await db.pieceAsset.updateMany({ where: { pieceId, isViewerModel: true }, data: { isViewerModel: false } });
      const asset = await db.pieceAsset.create({
        data: { pieceId, kind, filename: file.originalname.slice(0, 200), url: `/api/uploads/assets/${stored}`, sizeBytes: file.size, checksum: hash.digest("hex"), isViewerModel: isViewer },
      });
      await db.auditLog.create({ data: { actorId: actor.id, action: "asset.upload", entity: "Piece", entityId: pieceId, diff: { kind, filename: asset.filename } } });
      return asset;
    } catch (e) {
      await unlink(file.path).catch(() => undefined);
      throw e;
    }
  }

  async remove(pieceId: string, assetId: string, actor: AuthUser) {
    const db = this.prisma.db;
    const a = await db.pieceAsset.findFirst({ where: { id: assetId, pieceId } });
    if (!a) throw new NotFoundException("Asset not found");
    await db.pieceAsset.delete({ where: { id: a.id } });
    await unlink(path.join(assetDir(), path.basename(a.url))).catch(() => undefined);
    await db.auditLog.create({ data: { actorId: actor.id, action: "asset.delete", entity: "Piece", entityId: pieceId, diff: { filename: a.filename } } });
  }

  list(pieceId: string) {
    return this.prisma.db.pieceAsset.findMany({ where: { pieceId }, orderBy: { createdAt: "asc" }, select: { id: true, kind: true, filename: true, url: true, sizeBytes: true, isViewerModel: true } });
  }
}

// ───────────── Excel: template, dimension parsing, bulk import/export ─────────────

type Dims = { lengthMm?: number; widthMm?: number; heightMm?: number; weightKg?: number };

const norm = (v: unknown) => String(v ?? "").toLowerCase().replace(/[^a-z]/g, "");
const num = (v: unknown): number | undefined => {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (v && typeof v === "object" && "result" in (v as object)) return num((v as { result: unknown }).result);
  const m = String(v ?? "").replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : undefined;
};
const cellText = (c: ExcelJS.CellValue): unknown => (c && typeof c === "object" && "richText" in c ? (c.richText as { text: string }[]).map((t) => t.text).join("") : c);

// order matters: "Height / Seat Rake" is a height, "Net weight (kg)" is a weight
const dimKey = (label: string): keyof Dims | undefined => {
  if (!label) return undefined;
  if (label.includes("weight")) return "weightKg";
  if (label.includes("height")) return "heightMm";
  if (label.includes("width")) return "widthMm";
  if (label.includes("length") || label.includes("depth")) return "lengthMm";
  return undefined;
};

/** Reads length/width/height/weight from either a header row + data row, or label/value rows. */
export function parseDimensions(ws: ExcelJS.Worksheet): { dims: Dims; notes: string[] } {
  const dims: Dims = {};
  const notes: string[] = [];
  const rows: unknown[][] = [];
  ws.eachRow({ includeEmpty: false }, (row) => rows.push((row.values as unknown[]).slice(1).map((c) => cellText(c as ExcelJS.CellValue))));

  // layout A: a header row naming the dimensions, values on the next row
  for (let i = 0; i < rows.length - 1; i++) {
    const hits = rows[i].map((c, col) => ({ col, key: dimKey(norm(c)) })).filter((h) => h.key);
    if (hits.length >= 2) {
      for (const h of hits) {
        const v = num(rows[i + 1][h.col]);
        if (v !== undefined && dims[h.key!] === undefined) dims[h.key!] = v;
      }
      break;
    }
  }
  // layout B: label | value pairs
  if (Object.keys(dims).length === 0) {
    for (const r of rows) {
      const key = dimKey(norm(r[0]));
      const v = num(r[1]);
      if (key && v !== undefined && dims[key] === undefined) dims[key] = v;
    }
  }
  // sanity: dimensions are millimetres, so centimetre-sized values are flagged
  for (const k of ["lengthMm", "widthMm", "heightMm"] as const) {
    if (dims[k] !== undefined && dims[k]! < 20) notes.push(`${k} is ${dims[k]}: expected millimetres`);
  }
  return { dims, notes };
}

async function templateBook() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Xadboom Atelier";
  const ws = wb.addWorksheet("Dimensions");
  ws.columns = [
    { header: "Length / Depth (mm)", key: "l", width: 22 },
    { header: "Width (mm)", key: "w", width: 16 },
    { header: "Height (mm)", key: "h", width: 16 },
    { header: "Net weight (kg)", key: "kg", width: 18 },
  ];
  ws.addRow({ l: 600, w: 500, h: 830, kg: 18.4 });
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFECDAD4" } };
  const help = wb.addWorksheet("Instructions");
  help.getColumn(1).width = 110;
  [
    "Xadboom dimension sheet",
    "Fill the first row under the headings with the piece's finished dimensions in MILLIMETRES and the net weight in KILOGRAMS.",
    "Upload this file on the piece's page in the admin; the values fill the dimension fields automatically.",
    "A two-column layout also works: put the label (Length, Width, Height, Weight) in column A and the number in column B.",
  ].forEach((t) => help.addRow([t]));
  help.getRow(1).font = { bold: true, size: 14 };
  return wb;
}

const IMPORT_HEADERS = ["SKU", "Title", "Designer", "Category", "Price (USD)", "Total editions", "Released editions", "Status", "Materials", "Lead time", "Provenance", "Length (mm)", "Width (mm)", "Height (mm)", "Weight (kg)", "Description"];

@Injectable()
export class ExcelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pieces: PiecesAdminService,
  ) {}

  async load(buffer: Buffer) {
    const wb = new ExcelJS.Workbook();
    try {
      await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    } catch {
      throw new BadRequestException("This is not a valid .xlsx file");
    }
    if (!wb.worksheets.length) throw new BadRequestException("The workbook has no sheets");
    return wb;
  }

  async exportPieces() {
    const rows = await this.prisma.db.piece.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: { designer: true, category: true, editions: { select: { status: true } } },
    });
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Pieces");
    ws.addRow(IMPORT_HEADERS);
    for (const p of rows) {
      ws.addRow([
        p.sku, p.title, p.designer.name, p.category.name, p.priceUsdCents / 100, p.totalEditions,
        p.editions.filter((e) => e.status === "AVAILABLE").length, p.status, p.materials ?? "", p.leadTime ?? "", p.provenance ?? "",
        p.lengthMm ?? "", p.widthMm ?? "", p.heightMm ?? "", p.weightKg ? Number(p.weightKg) : "", p.description ?? "",
      ]);
    }
    ws.getRow(1).font = { bold: true };
    ws.columns.forEach((c, i) => (c.width = [14, 30, 24, 26, 14, 14, 16, 12, 34, 14, 28, 12, 12, 12, 12, 50][i] ?? 16));
    ws.views = [{ state: "frozen", ySplit: 1 }];
    return wb;
  }

  async importPieces(buffer: Buffer, apply: boolean, actor: AuthUser) {
    const wb = await this.load(buffer);
    const ws = wb.worksheets[0];
    const header = (ws.getRow(1).values as unknown[]).slice(1).map((h) => norm(cellText(h as ExcelJS.CellValue)));
    const col = (name: string) => header.indexOf(norm(name));
    for (const need of ["Title", "Designer", "Category", "Price (USD)", "Total editions"]) {
      if (col(need) < 0) throw new BadRequestException(`Missing column "${need}". Download the export for the expected layout.`);
    }
    const [designers, categories] = await Promise.all([
      this.prisma.db.designer.findMany({ select: { id: true, name: true, studio: true } }),
      this.prisma.db.category.findMany({ select: { id: true, name: true } }),
    ]);
    const findBy = <T extends { name: string }>(list: T[], v: string, extra?: (t: T) => string | null) => list.find((t) => norm(t.name) === norm(v) || (extra && norm(extra(t)) === norm(v)));

    const report: { row: number; sku: string | null; action: "create" | "update" | "error"; message: string }[] = [];
    const total = ws.rowCount;
    for (let r = 2; r <= total; r++) {
      const row = ws.getRow(r);
      const get = (name: string) => (col(name) < 0 ? undefined : cellText(row.getCell(col(name) + 1).value as ExcelJS.CellValue));
      if (!row.hasValues) continue;
      const title = String(get("Title") ?? "").trim();
      const skuRaw = col("SKU") >= 0 ? String(get("SKU") ?? "").trim().toUpperCase() : "";
      try {
        if (!title) throw new Error("Title is empty");
        const designer = findBy(designers, String(get("Designer") ?? ""), (d) => d.studio);
        if (!designer) throw new Error(`Unknown designer "${get("Designer")}"`);
        const category = findBy(categories, String(get("Category") ?? ""));
        if (!category) throw new Error(`Unknown category "${get("Category")}"`);
        const price = num(get("Price (USD)"));
        const totalEd = num(get("Total editions"));
        if (price === undefined || price < 0) throw new Error("Price (USD) must be a number");
        if (!totalEd || totalEd < 1) throw new Error("Total editions must be 1 or more");
        const released = col("Released editions") >= 0 ? (num(get("Released editions")) ?? 0) : 0;
        const statusRaw = String(get("Status") ?? "").toUpperCase();
        const status = (["DRAFT", "PUBLISHED", "ARCHIVED"].includes(statusRaw) ? statusRaw : "DRAFT") as "DRAFT" | "PUBLISHED" | "ARCHIVED";
        const text = (n: string) => (col(n) >= 0 ? (String(get(n) ?? "").trim() || null) : null);
        const existing = skuRaw ? await this.prisma.db.piece.findFirst({ where: { sku: skuRaw, deletedAt: null }, select: { id: true } }) : null;
        const base = {
          title, designerId: designer.id, categoryId: category.id,
          sku: skuRaw || undefined,
          provenance: text("Provenance"), description: text("Description"), leadTime: text("Lead time"),
          materials: (text("Materials") ?? "").split(/\s*&\s*|\s*;\s*/).map((m) => m.trim()).filter(Boolean),
          totalEditions: Math.round(totalEd), releasedEditions: Math.min(Math.round(released), Math.round(totalEd)), priceUsd: price,
          lengthMm: num(get("Length (mm)")) ? Math.round(num(get("Length (mm)"))!) : null,
          widthMm: num(get("Width (mm)")) ? Math.round(num(get("Width (mm)"))!) : null,
          heightMm: num(get("Height (mm)")) ? Math.round(num(get("Height (mm)"))!) : null,
          weightKg: num(get("Weight (kg)")) ?? null,
        };
        if (existing) {
          if (apply) {
            const cur = await this.pieces.get(existing.id);
            // keep what a spreadsheet cannot carry: photographs, story, featured flag
            const finalStatus = status === "PUBLISHED" && cur.images.length === 0 ? "DRAFT" : status;
            await this.pieces.update(existing.id, { ...base, images: cur.images, storyTitle: cur.storyTitle, story: cur.story, quote: cur.quote, quoteBy: cur.quoteBy, featured: cur.featured, status: finalStatus }, actor);
          }
          report.push({ row: r, sku: skuRaw, action: "update", message: `${title}: updated` });
        } else {
          if (apply) await this.pieces.create({ ...base, images: [], featured: false, status: "DRAFT" }, actor); // new pieces need photos before publishing
          report.push({ row: r, sku: skuRaw || null, action: "create", message: `${title}: created as draft (add photographs, then publish)` });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        report.push({ row: r, sku: skuRaw || null, action: "error", message: (e as { response?: { issues?: { path: string; message: string }[] } }).response?.issues?.map((i) => `${i.path}: ${i.message}`).join("; ") ?? msg });
      }
    }
    const errors = report.filter((x) => x.action === "error").length;
    await this.prisma.db.importJob.create({
      data: { kind: "pieces", filename: "upload.xlsx", fileUrl: "-", status: apply ? (errors ? "FAILED" : "APPLIED") : "DRY_RUN_OK", report, userId: actor.id },
    });
    return { applied: apply, rows: report.length, created: report.filter((x) => x.action === "create").length, updated: report.filter((x) => x.action === "update").length, errors, report };
  }
}

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

@ApiTags("admin")
@Controller("admin")
export class AssetsController {
  constructor(
    private readonly assets: AssetsService,
    private readonly excel: ExcelService,
  ) {}

  @Get("pieces/:id/assets")
  @Auth("ADMIN", "EDITOR")
  list(@Param("id") id: string) {
    return this.assets.list(id);
  }

  /** 3D models, CAD/BIM files, spec sheets and tear sheets for one piece (up to 150 MB, streamed to disk). */
  @Post("pieces/:id/assets")
  @HttpCode(201)
  @Auth("ADMIN", "EDITOR")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_ASSET_BYTES, files: 1 },
      storage: diskStorage({
        destination: (_req, _file, cb) => mkdir(path.join(uploadRoot(), "tmp"), { recursive: true }).then(() => cb(null, path.join(uploadRoot(), "tmp")), (e) => cb(e, "")),
        filename: (_req, _file, cb) => cb(null, `${randomUUID()}.part`),
      }),
    }),
  )
  async upload(@Param("id") id: string, @UploadedFile() file: Express.Multer.File | undefined, @CurrentUser() user: AuthUser) {
    if (!file) throw new BadRequestException("No file received");
    return this.assets.attach(id, file, user);
  }

  @Delete("pieces/:id/assets/:assetId")
  @HttpCode(204)
  @Auth("ADMIN", "EDITOR")
  async removeAsset(@Param("id") id: string, @Param("assetId") assetId: string, @CurrentUser() user: AuthUser) {
    await this.assets.remove(id, assetId, user);
  }

  @Get("excel/template")
  @Auth("ADMIN", "EDITOR")
  async template(@Res() res: Response) {
    const wb = await templateBook();
    res.setHeader("Content-Type", XLSX_MIME);
    res.setHeader("Content-Disposition", 'attachment; filename="xadboom-dimension-template.xlsx"');
    await wb.xlsx.write(res);
    res.end();
  }

  /** Reads a filled dimension sheet and returns the values (the form applies them). */
  @Post("excel/parse-dimensions")
  @HttpCode(200)
  @Auth("ADMIN", "EDITOR")
  @UseInterceptors(FileInterceptor("file", { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } }))
  async parseDims(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("No file received");
    const wb = await this.excel.load(file.buffer);
    for (const ws of wb.worksheets) {
      const { dims, notes } = parseDimensions(ws);
      if (Object.keys(dims).length) return { sheet: ws.name, dims, notes };
    }
    throw new BadRequestException("No Length, Width, Height or Weight values were found. Use the template sheet.");
  }

  @Get("excel/export/pieces")
  @Auth("ADMIN", "EDITOR")
  async exportPieces(@Res() res: Response) {
    const wb = await this.excel.exportPieces();
    res.setHeader("Content-Type", XLSX_MIME);
    res.setHeader("Content-Disposition", `attachment; filename="xadboom-catalog-${new Date().toISOString().slice(0, 10)}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  }

  /** Bulk create/update by SKU. `?apply=true` writes; without it you get a dry-run report. */
  @Post("excel/import/pieces")
  @HttpCode(200)
  @Auth("ADMIN", "EDITOR")
  @UseInterceptors(FileInterceptor("file", { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } }))
  async importPieces(@UploadedFile() file: Express.Multer.File | undefined, @Query("apply") apply: string | undefined, @CurrentUser() user: AuthUser) {
    if (!file) throw new BadRequestException("No file received");
    return this.excel.importPieces(file.buffer, apply === "true", user);
  }
}

@Module({ imports: [AuthModule, AdminPiecesModule], controllers: [AssetsController], providers: [AssetsService, ExcelService] })
export class AssetsModule {}
