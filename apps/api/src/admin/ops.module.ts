import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { hashPassword } from "@xadboom/db";
import { Auth, CurrentUser } from "../auth/auth.guard";
import { AuthModule } from "../auth/auth.module";
import type { AuthUser } from "../auth/auth.service";
import { CommerceModule, CommerceService } from "../commerce/commerce.module";
import { ZodPipe } from "../common/zod.pipe";
import { PrismaService } from "../prisma/prisma.module";

const PAGE = 8;
const page = z.coerce.number().int().min(1).max(1000).default(1);
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "item";
const pages = (total: number) => Math.max(1, Math.ceil(total / PAGE));
const fmtMoney = (currency: "USD" | "TOMAN", n: number) => (currency === "USD" ? `$${(n / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}` : `${n.toLocaleString("en-US")} Toman`);

// ───────────────────────── orders ─────────────────────────

const ordersQuery = z.object({
  status: z.enum(["PENDING_PAYMENT", "PAID", "IN_CRATING", "DISPATCHED", "DELIVERED", "CANCELLED", "REFUNDED"]).optional(),
  search: z.string().trim().max(120).optional(),
  page,
});
const fulfilmentBody = z.object({
  status: z.enum(["IN_CRATING", "DISPATCHED", "DELIVERED"]),
  crateStatus: z.string().trim().max(160).optional(),
  carrier: z.string().trim().max(160).optional(),
  trackingRef: z.string().trim().max(120).optional(),
  note: z.string().trim().max(300).optional(),
});

@Injectable()
export class OrdersAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commerce: CommerceService,
  ) {}

  async list(q: z.infer<typeof ordersQuery>) {
    const db = this.prisma.db;
    const where: Record<string, unknown> = {};
    if (q.status) where.status = q.status;
    if (q.search) {
      where.OR = [
        { number: { contains: q.search, mode: "insensitive" } },
        { collectorName: { contains: q.search, mode: "insensitive" } },
        { collectorEmail: { contains: q.search, mode: "insensitive" } },
        { shipCity: { contains: q.search, mode: "insensitive" } },
      ];
    }
    const [rows, total, grouped, paidUsd, paidToman] = await Promise.all([
      db.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * PAGE,
        take: PAGE,
        include: { items: { select: { titleSnap: true, skuSnap: true, edition: { select: { number: true, piece: { select: { totalEditions: true } } } } } }, shipments: { take: 1, orderBy: { createdAt: "desc" } }, payments: { take: 1, orderBy: { createdAt: "desc" }, select: { provider: true, status: true } } },
      }),
      db.order.count({ where }),
      db.order.groupBy({ by: ["status"], _count: true }),
      db.order.aggregate({ where: { status: { in: ["PAID", "IN_CRATING", "DISPATCHED", "DELIVERED"] }, currency: "USD" }, _sum: { totalAmount: true } }),
      db.order.aggregate({ where: { status: { in: ["PAID", "IN_CRATING", "DISPATCHED", "DELIVERED"] }, currency: "TOMAN" }, _sum: { totalAmount: true } }),
    ]);
    const n = (s: string) => grouped.find((g) => g.status === s)?._count ?? 0;
    return {
      rows: rows.map((o) => ({
        id: o.id,
        number: o.number,
        createdAt: o.createdAt.toISOString(),
        status: o.status,
        collectorName: o.collectorName,
        collectorEmail: o.collectorEmail,
        destination: `${o.shipCity}, ${o.shipCountry}`,
        items: o.items.map((i) => ({ title: i.titleSnap, sku: i.skuSnap, edition: `${String(i.edition.number).padStart(2, "0")}/${String(i.edition.piece.totalEditions).padStart(2, "0")}` })),
        total: fmtMoney(o.currency, o.totalAmount),
        carrier: o.shipments[0]?.carrier ?? null,
        crateStatus: o.shipments[0]?.crateStatus ?? null,
        trackingRef: o.shipments[0]?.trackingRef ?? null,
        provider: o.payments[0]?.provider ?? null,
      })),
      total,
      page: q.page,
      pages: pages(total),
      counts: {
        all: grouped.reduce((s, g) => s + g._count, 0),
        pending: n("PENDING_PAYMENT"),
        paid: n("PAID"),
        crating: n("IN_CRATING"),
        dispatched: n("DISPATCHED"),
        delivered: n("DELIVERED"),
        cancelled: n("CANCELLED"),
      },
      volume: { usd: fmtMoney("USD", paidUsd._sum.totalAmount ?? 0), toman: fmtMoney("TOMAN", paidToman._sum.totalAmount ?? 0) },
    };
  }

  private async find(id: string) {
    const o = await this.prisma.db.order.findUnique({ where: { id }, include: { items: { select: { editionId: true } } } });
    if (!o) throw new NotFoundException("Order not found");
    return o;
  }

  async markPaid(id: string, actor: AuthUser) {
    const o = await this.find(id);
    if (o.status !== "PENDING_PAYMENT") throw new ConflictException("Only unpaid orders can be marked as paid");
    const r = await this.commerce.markPaid(id, "manual");
    await this.prisma.db.auditLog.create({ data: { actorId: actor.id, action: "order.mark_paid", entity: "Order", entityId: id } });
    return { status: r.status };
  }

  async cancel(id: string, actor: AuthUser) {
    const o = await this.find(id);
    if (o.status !== "PENDING_PAYMENT") throw new ConflictException("Only unpaid orders can be cancelled");
    await this.commerce.cancelOrder(id, `Cancelled by ${actor.email}`);
    await this.prisma.db.auditLog.create({ data: { actorId: actor.id, action: "order.cancel", entity: "Order", entityId: id } });
    return { status: "CANCELLED" };
  }

  async fulfil(id: string, body: z.infer<typeof fulfilmentBody>, actor: AuthUser) {
    const db = this.prisma.db;
    const o = await this.find(id);
    if (!["PAID", "IN_CRATING", "DISPATCHED"].includes(o.status)) throw new ConflictException("The order must be paid before it can be fulfilled");
    const shipment = await db.shipment.findFirst({ where: { orderId: id }, orderBy: { createdAt: "desc" } });
    const label = body.note ?? ({ IN_CRATING: "Crating started", DISPATCHED: "Dispatched", DELIVERED: "Delivered" } as const)[body.status];
    const events: { at: string; label: string }[] = [...((shipment?.events as { at: string; label: string }[] | null) ?? []), { at: new Date().toISOString(), label }];
    await db.$transaction([
      db.order.update({ where: { id }, data: { status: body.status } }),
      shipment
        ? db.shipment.update({ where: { id: shipment.id }, data: { crateStatus: body.crateStatus ?? shipment.crateStatus, carrier: body.carrier ?? shipment.carrier, trackingRef: body.trackingRef ?? shipment.trackingRef, events } })
        : db.shipment.create({ data: { orderId: id, crateStatus: body.crateStatus, carrier: body.carrier, trackingRef: body.trackingRef, events } }),
      db.auditLog.create({ data: { actorId: actor.id, action: `order.${body.status.toLowerCase()}`, entity: "Order", entityId: id } }),
    ]);
    return { status: body.status };
  }
}

@ApiTags("admin")
@Controller("admin/orders")
export class OrdersAdminController {
  constructor(private readonly orders: OrdersAdminService) {}

  @Get()
  @Auth("ADMIN", "EDITOR")
  list(@Query(new ZodPipe(ordersQuery)) q: z.infer<typeof ordersQuery>) {
    return this.orders.list(q);
  }

  @Post(":id/mark-paid")
  @HttpCode(200)
  @Auth("ADMIN", "EDITOR")
  markPaid(@Param("id") id: string, @CurrentUser() u: AuthUser) {
    return this.orders.markPaid(id, u);
  }

  @Post(":id/cancel")
  @HttpCode(200)
  @Auth("ADMIN", "EDITOR")
  cancel(@Param("id") id: string, @CurrentUser() u: AuthUser) {
    return this.orders.cancel(id, u);
  }

  @Post(":id/fulfil")
  @HttpCode(200)
  @Auth("ADMIN", "EDITOR")
  fulfil(@Param("id") id: string, @Body(new ZodPipe(fulfilmentBody)) body: z.infer<typeof fulfilmentBody>, @CurrentUser() u: AuthUser) {
    return this.orders.fulfil(id, body, u);
  }
}

// ───────────────────────── inquiries ─────────────────────────

const inquiriesQuery = z.object({
  status: z.enum(["NEW", "ACTIVE_REVIEW", "TRIAGE_PASSED", "CONFIRMED", "CLOSED"]).optional(),
  type: z.string().max(80).optional(),
  assignee: z.string().max(40).optional(), // user id or "none"
  search: z.string().trim().max(120).optional(),
  page,
});
const inquiryPatch = z.object({
  status: z.enum(["NEW", "ACTIVE_REVIEW", "TRIAGE_PASSED", "CONFIRMED", "CLOSED"]).optional(),
  assigneeId: z.string().nullable().optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
});
const manualInquiry = z.object({
  type: z.string().trim().min(1).max(80),
  client: z.string().trim().min(1).max(160),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  project: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1).max(5000),
});

@Controller("admin/inquiries")
@ApiTags("admin")
export class InquiriesAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Auth("ADMIN", "EDITOR")
  async list(@Query(new ZodPipe(inquiriesQuery)) q: z.infer<typeof inquiriesQuery>) {
    const db = this.prisma.db;
    const where: Record<string, unknown> = {};
    if (q.status) where.status = q.status;
    if (q.type) where.type = q.type;
    if (q.assignee) where.assigneeId = q.assignee === "none" ? null : q.assignee;
    if (q.search) where.OR = [{ client: { contains: q.search, mode: "insensitive" } }, { email: { contains: q.search, mode: "insensitive" } }, { project: { contains: q.search, mode: "insensitive" } }, { message: { contains: q.search, mode: "insensitive" } }];
    const [rows, total, byStatus, byType, staff] = await Promise.all([
      db.inquiry.findMany({ where, orderBy: { createdAt: "desc" }, skip: (q.page - 1) * PAGE, take: PAGE, include: { piece: { select: { title: true, slug: true, designer: { select: { name: true } } } }, assignee: { select: { id: true, name: true } } } }),
      db.inquiry.count({ where }),
      db.inquiry.groupBy({ by: ["status"], _count: true }),
      db.inquiry.groupBy({ by: ["type"], _count: true }),
      db.user.findMany({ where: { role: { in: ["ADMIN", "EDITOR"] } }, select: { id: true, name: true } }),
    ]);
    const now = Date.now();
    return {
      rows: rows.map((i) => ({
        id: i.id,
        number: i.number,
        client: i.client,
        email: i.email,
        project: i.project,
        type: i.type,
        piece: i.piece ? { title: i.piece.title, slug: i.piece.slug, designer: i.piece.designer.name } : null,
        message: i.message,
        status: i.status,
        notes: i.notes,
        assignee: i.assignee,
        createdAt: i.createdAt.toISOString(),
        slaMinutes: i.slaDueAt && !["CONFIRMED", "CLOSED"].includes(i.status) ? Math.round((i.slaDueAt.getTime() - now) / 60000) : null,
      })),
      total,
      page: q.page,
      pages: pages(total),
      stats: {
        total: byStatus.reduce((s, g) => s + g._count, 0),
        open: byStatus.filter((g) => !["CONFIRMED", "CLOSED"].includes(g.status)).reduce((s, g) => s + g._count, 0),
        unassigned: await db.inquiry.count({ where: { assigneeId: null, status: { notIn: ["CONFIRMED", "CLOSED"] } } }),
        byStatus: Object.fromEntries(byStatus.map((g) => [g.status, g._count])),
      },
      types: byType.map((t) => ({ type: t.type, count: t._count })),
      staff,
    };
  }

  @Patch(":id")
  @Auth("ADMIN", "EDITOR")
  async patch(@Param("id") id: string, @Body(new ZodPipe(inquiryPatch)) body: z.infer<typeof inquiryPatch>, @CurrentUser() u: AuthUser) {
    const db = this.prisma.db;
    if (!(await db.inquiry.findUnique({ where: { id }, select: { id: true } }))) throw new NotFoundException();
    if (body.assigneeId) {
      const a = await db.user.findFirst({ where: { id: body.assigneeId, role: { in: ["ADMIN", "EDITOR"] } }, select: { id: true } });
      if (!a) throw new BadRequestException("Unknown curator");
    }
    const r = await db.inquiry.update({ where: { id }, data: body, select: { id: true, status: true, assigneeId: true, notes: true } });
    await db.auditLog.create({ data: { actorId: u.id, action: "inquiry.update", entity: "Inquiry", entityId: id, diff: body } });
    return r;
  }

  @Post()
  @HttpCode(201)
  @Auth("ADMIN", "EDITOR")
  async log(@Body(new ZodPipe(manualInquiry)) body: z.infer<typeof manualInquiry>, @CurrentUser() u: AuthUser) {
    const db = this.prisma.db;
    const count = await db.inquiry.count();
    const number = `INQ-${new Date().getFullYear()}-${String(count + 100).padStart(3, "0")}-${randomBytes(2).toString("hex").toUpperCase().slice(0, 3)}`;
    return db.inquiry.create({ data: { ...body, number, status: "ACTIVE_REVIEW", assigneeId: u.id, slaDueAt: new Date(Date.now() + 3 * 3600_000) }, select: { id: true, number: true } });
  }
}

// ───────────────────────── designers & categories ─────────────────────────

const designerBody = z.object({
  name: z.string().trim().min(1).max(160),
  studio: z.string().trim().max(160).nullish(),
  city: z.string().trim().max(160).nullish(),
  title: z.string().trim().max(160).nullish(),
  discipline: z.string().trim().max(160).nullish(),
  materiality: z.string().trim().max(200).nullish(),
  sortName: z.string().trim().max(160).nullish(),
  bio: z.string().trim().max(4000).nullish(),
  portrait: z.string().max(500).refine((u) => u.startsWith("/api/uploads/") || u.startsWith("/images/"), "Portrait must be an uploaded image").nullish(),
  profileImage: z.string().max(500).refine((u) => u.startsWith("/api/uploads/") || u.startsWith("/images/"), "Image must be an uploaded image").nullish(),
  published: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
});
const categoryBody = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).nullish(),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
});

@Controller("admin")
@ApiTags("admin")
export class CatalogAdminController {
  constructor(private readonly prisma: PrismaService) {}

  private async uniqueSlug(model: "designer" | "category", base: string, ignoreId?: string) {
    const db = this.prisma.db;
    let slug = base;
    for (let n = 2; ; n++) {
      const hit = await (db[model] as unknown as { findFirst: (a: unknown) => Promise<{ id: string } | null> }).findFirst({ where: { slug, NOT: ignoreId ? { id: ignoreId } : undefined }, select: { id: true } });
      if (!hit) return slug;
      slug = `${base}-${n}`;
    }
  }

  @Get("designers")
  @Auth("ADMIN", "EDITOR")
  async designers() {
    const rows = await this.prisma.db.designer.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { pieces: { where: { deletedAt: null } } } } } });
    return rows.map(({ _count, ...d }) => ({ ...d, pieceCount: _count.pieces }));
  }

  @Post("designers")
  @HttpCode(201)
  @Auth("ADMIN", "EDITOR")
  async createDesigner(@Body(new ZodPipe(designerBody)) body: z.infer<typeof designerBody>, @CurrentUser() u: AuthUser) {
    const slug = await this.uniqueSlug("designer", slugify(body.studio || body.name));
    const d = await this.prisma.db.designer.create({ data: { ...body, slug } });
    await this.prisma.db.auditLog.create({ data: { actorId: u.id, action: "designer.create", entity: "Designer", entityId: d.id } });
    return d;
  }

  @Patch("designers/:id")
  @Auth("ADMIN", "EDITOR")
  async updateDesigner(@Param("id") id: string, @Body(new ZodPipe(designerBody)) body: z.infer<typeof designerBody>, @CurrentUser() u: AuthUser) {
    if (!(await this.prisma.db.designer.findUnique({ where: { id }, select: { id: true } }))) throw new NotFoundException();
    const d = await this.prisma.db.designer.update({ where: { id }, data: body });
    await this.prisma.db.auditLog.create({ data: { actorId: u.id, action: "designer.update", entity: "Designer", entityId: id } });
    return d;
  }

  @Delete("designers/:id")
  @HttpCode(204)
  @Auth("ADMIN")
  async deleteDesigner(@Param("id") id: string, @CurrentUser() u: AuthUser) {
    const db = this.prisma.db;
    if (await db.piece.count({ where: { designerId: id } })) throw new ConflictException("This designer still has pieces; unpublish them instead");
    await db.designer.delete({ where: { id } }).catch(() => { throw new NotFoundException(); });
    await db.auditLog.create({ data: { actorId: u.id, action: "designer.delete", entity: "Designer", entityId: id } });
  }

  @Get("categories")
  @Auth("ADMIN", "EDITOR")
  async categories() {
    const rows = await this.prisma.db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { pieces: { where: { deletedAt: null } } } } } });
    return rows.map(({ _count, ...c }) => ({ ...c, pieceCount: _count.pieces }));
  }

  @Post("categories")
  @HttpCode(201)
  @Auth("ADMIN", "EDITOR")
  async createCategory(@Body(new ZodPipe(categoryBody)) body: z.infer<typeof categoryBody>, @CurrentUser() u: AuthUser) {
    const slug = await this.uniqueSlug("category", slugify(body.name));
    const c = await this.prisma.db.category.create({ data: { ...body, slug } });
    await this.prisma.db.auditLog.create({ data: { actorId: u.id, action: "category.create", entity: "Category", entityId: c.id } });
    return c;
  }

  @Patch("categories/:id")
  @Auth("ADMIN", "EDITOR")
  async updateCategory(@Param("id") id: string, @Body(new ZodPipe(categoryBody)) body: z.infer<typeof categoryBody>, @CurrentUser() u: AuthUser) {
    if (!(await this.prisma.db.category.findUnique({ where: { id }, select: { id: true } }))) throw new NotFoundException();
    const c = await this.prisma.db.category.update({ where: { id }, data: body });
    await this.prisma.db.auditLog.create({ data: { actorId: u.id, action: "category.update", entity: "Category", entityId: id } });
    return c;
  }

  @Delete("categories/:id")
  @HttpCode(204)
  @Auth("ADMIN")
  async deleteCategory(@Param("id") id: string, @CurrentUser() u: AuthUser) {
    const db = this.prisma.db;
    if (await db.piece.count({ where: { categoryId: id } })) throw new ConflictException("This typology still has pieces");
    await db.category.delete({ where: { id } }).catch(() => { throw new NotFoundException(); });
    await db.auditLog.create({ data: { actorId: u.id, action: "category.delete", entity: "Category", entityId: id } });
  }
}

// ───────────────────────── users ─────────────────────────

const usersQuery = z.object({ role: z.enum(["ADMIN", "EDITOR", "COLLECTOR"]).optional(), kyc: z.enum(["UNVERIFIED", "PENDING", "VERIFIED"]).optional(), search: z.string().trim().max(120).optional(), page });
const userPatch = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  role: z.enum(["ADMIN", "EDITOR", "COLLECTOR"]).optional(),
  tier: z.string().trim().max(80).nullable().optional(),
  kycStatus: z.enum(["UNVERIFIED", "PENDING", "VERIFIED"]).optional(),
  regionHub: z.string().trim().max(120).nullable().optional(),
});
const userCreate = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  role: z.enum(["ADMIN", "EDITOR", "COLLECTOR"]),
  tier: z.string().trim().max(80).nullish(),
  regionHub: z.string().trim().max(120).nullish(),
});

@Controller("admin/users")
@ApiTags("admin")
export class UsersAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Auth("ADMIN")
  async list(@Query(new ZodPipe(usersQuery)) q: z.infer<typeof usersQuery>) {
    const db = this.prisma.db;
    const where: Record<string, unknown> = {};
    if (q.role) where.role = q.role;
    if (q.kyc) where.kycStatus = q.kyc;
    if (q.search) where.OR = [{ name: { contains: q.search, mode: "insensitive" } }, { email: { contains: q.search, mode: "insensitive" } }, { studio: { contains: q.search, mode: "insensitive" } }];
    const [rows, total, roles, verified] = await Promise.all([
      db.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (q.page - 1) * PAGE, take: PAGE, select: { id: true, name: true, email: true, studio: true, role: true, tier: true, kycStatus: true, regionHub: true, lastActiveAt: true, createdAt: true, _count: { select: { orders: true } } } }),
      db.user.count({ where }),
      db.user.groupBy({ by: ["role"], _count: true }),
      db.user.count({ where: { kycStatus: "VERIFIED" } }),
    ]);
    return {
      rows: rows.map(({ _count, ...u }) => ({ ...u, orders: _count.orders, lastActiveAt: u.lastActiveAt?.toISOString() ?? null, createdAt: u.createdAt.toISOString() })),
      total,
      page: q.page,
      pages: pages(total),
      stats: { total: roles.reduce((s, r) => s + r._count, 0), staff: roles.filter((r) => r.role !== "COLLECTOR").reduce((s, r) => s + r._count, 0), collectors: roles.find((r) => r.role === "COLLECTOR")?._count ?? 0, verified },
    };
  }

  @Patch(":id")
  @Auth("ADMIN")
  async patch(@Param("id") id: string, @Body(new ZodPipe(userPatch)) body: z.infer<typeof userPatch>, @CurrentUser() me: AuthUser) {
    const db = this.prisma.db;
    const target = await db.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!target) throw new NotFoundException();
    if (body.role && body.role !== target.role && id === me.id) throw new ForbiddenException("You cannot change your own role");
    if (body.role && target.role === "ADMIN" && body.role !== "ADMIN" && (await db.user.count({ where: { role: "ADMIN" } })) <= 1) throw new ConflictException("At least one administrator is required");
    const u = await db.user.update({ where: { id }, data: body, select: { id: true, role: true, tier: true, kycStatus: true } });
    await db.auditLog.create({ data: { actorId: me.id, action: "user.update", entity: "User", entityId: id, diff: body } });
    return u;
  }

  /** Creates an account with a one-time temporary password, shown once to the administrator. */
  @Post()
  @HttpCode(201)
  @Auth("ADMIN")
  async create(@Body(new ZodPipe(userCreate)) body: z.infer<typeof userCreate>, @CurrentUser() me: AuthUser) {
    const db = this.prisma.db;
    if (await db.user.findUnique({ where: { email: body.email }, select: { id: true } })) throw new ConflictException("An account with this email already exists");
    const temporaryPassword = randomBytes(9).toString("base64url");
    const u = await db.user.create({ data: { ...body, passwordHash: await hashPassword(temporaryPassword) }, select: { id: true, email: true } });
    await db.auditLog.create({ data: { actorId: me.id, action: "user.create", entity: "User", entityId: u.id } });
    return { ...u, temporaryPassword };
  }

  @Delete(":id")
  @HttpCode(204)
  @Auth("ADMIN")
  async remove(@Param("id") id: string, @CurrentUser() me: AuthUser) {
    const db = this.prisma.db;
    if (id === me.id) throw new ForbiddenException("You cannot delete your own account");
    if (await db.order.count({ where: { userId: id } })) throw new ConflictException("This account has orders and cannot be deleted");
    await db.user.delete({ where: { id } }).catch(() => { throw new NotFoundException(); });
    await db.auditLog.create({ data: { actorId: me.id, action: "user.delete", entity: "User", entityId: id } });
  }
}

// ───────────────────────── overview ─────────────────────────

@Controller("admin/overview")
@ApiTags("admin")
export class OverviewController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Auth("ADMIN", "EDITOR")
  async overview() {
    const db = this.prisma.db;
    const now = new Date();
    const paid = ["PAID", "IN_CRATING", "DISPATCHED", "DELIVERED"] as const;
    const [pieces, editions, holds, openInquiries, slaRisk, pending, usd, toman, recentOrders, recentInquiries] = await Promise.all([
      db.piece.count({ where: { status: "PUBLISHED", deletedAt: null } }),
      db.edition.groupBy({ by: ["status"], where: { piece: { deletedAt: null } }, _count: true }),
      db.reservation.count({ where: { status: "ACTIVE", expiresAt: { gt: now } } }),
      db.inquiry.count({ where: { status: { notIn: ["CONFIRMED", "CLOSED"] } } }),
      db.inquiry.count({ where: { status: { notIn: ["CONFIRMED", "CLOSED"] }, slaDueAt: { lt: new Date(Date.now() + 3600_000) } } }),
      db.order.count({ where: { status: "PENDING_PAYMENT" } }),
      db.order.aggregate({ where: { status: { in: [...paid] }, currency: "USD" }, _sum: { totalAmount: true }, _count: true }),
      db.order.aggregate({ where: { status: { in: [...paid] }, currency: "TOMAN" }, _sum: { totalAmount: true }, _count: true }),
      db.order.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, number: true, status: true, collectorName: true, totalAmount: true, currency: true, createdAt: true } }),
      db.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, number: true, client: true, type: true, status: true, createdAt: true } }),
    ]);
    const e = (s: string) => editions.find((x) => x.status === s)?._count ?? 0;
    return {
      pieces,
      units: { available: e("AVAILABLE"), reserved: e("RESERVED"), sold: e("SOLD"), withheld: e("WITHHELD") },
      activeHolds: holds,
      pendingOrders: pending,
      openInquiries,
      slaRisk,
      revenue: { usd: fmtMoney("USD", usd._sum.totalAmount ?? 0), toman: fmtMoney("TOMAN", toman._sum.totalAmount ?? 0), orders: usd._count + toman._count },
      recentOrders: recentOrders.map((o) => ({ ...o, total: fmtMoney(o.currency, o.totalAmount), createdAt: o.createdAt.toISOString() })),
      recentInquiries: recentInquiries.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() })),
    };
  }
}

@Controller("admin/holds")
@ApiTags("admin")
export class HoldsAdminController {
  constructor(private readonly prisma: PrismaService) {}

  /** Live cart reservations (15-minute locks) with the time left. */
  @Get()
  @Auth("ADMIN", "EDITOR")
  async list() {
    const rows = await this.prisma.db.reservation.findMany({
      where: { status: "ACTIVE", expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: "asc" },
      include: { edition: { select: { number: true, piece: { select: { title: true, sku: true, totalEditions: true } } } } },
    });
    const now = Date.now();
    return rows.map((r) => ({
      id: r.id,
      title: r.edition.piece.title,
      sku: r.edition.piece.sku,
      edition: `${String(r.edition.number).padStart(2, "0")}/${String(r.edition.piece.totalEditions).padStart(2, "0")}`,
      remainingSeconds: Math.max(0, Math.floor((r.expiresAt.getTime() - now) / 1000)),
      session: (r.sessionId ?? "").slice(0, 6),
    }));
  }

  @Post(":id/release")
  @HttpCode(200)
  @Auth("ADMIN", "EDITOR")
  async release(@Param("id") id: string, @CurrentUser() u: AuthUser) {
    const db = this.prisma.db;
    const r = await db.reservation.findFirst({ where: { id, status: "ACTIVE" } });
    if (!r) throw new NotFoundException("Hold not found");
    await db.$transaction([
      db.reservation.update({ where: { id }, data: { status: "RELEASED" } }),
      db.edition.updateMany({ where: { id: r.editionId, status: "RESERVED" }, data: { status: "AVAILABLE", reservedUntil: null } }),
      db.auditLog.create({ data: { actorId: u.id, action: "hold.release", entity: "Reservation", entityId: id } }),
    ]);
    return { released: true };
  }
}

@Module({
  imports: [AuthModule, CommerceModule],
  controllers: [OrdersAdminController, InquiriesAdminController, CatalogAdminController, UsersAdminController, OverviewController, HoldsAdminController],
  providers: [OrdersAdminService],
})
export class AdminOpsModule {}
