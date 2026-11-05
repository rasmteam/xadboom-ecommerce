import {
  BadRequestException,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  Module,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  Param,
  Post,
  Query,
  Body,
  Req,
  Res,
  Logger,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { randomBytes, randomInt } from "node:crypto";
import type { Request, Response } from "express";
import { z } from "zod";
import { displayPrice, tomanFor } from "../common/money";
import { ZodPipe } from "../common/zod.pipe";
import { PrismaService } from "../prisma/prisma.module";
import { SettingsModule, SettingsService } from "../settings/settings.module";
import { getPaymentProvider, type PayableOrder } from "./payment";

const CART_COOKIE = "xb_cart";
const MAX_ITEMS = 3;
const MANUAL_HOLD_HOURS = 48;
const GATEWAY_WINDOW_MIN = 30;

const checkoutSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  phone: z.string().trim().max(40).optional(),
  country: z.string().trim().min(1).max(80),
  city: z.string().trim().min(1).max(80),
  address: z.string().trim().min(1).max(500),
  currency: z.enum(["USD", "TOMAN"]).optional(),
});
type CheckoutBody = z.infer<typeof checkoutSchema>;
const addSchema = z.object({ slug: z.string().min(1).max(120) });

const cookieOpts = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "true" : process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

@Injectable()
export class CommerceService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger("Commerce");
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  onModuleInit() {
    // release expired holds even when nobody opens the cart
    this.timer = setInterval(() => void this.sweep().catch((e) => this.log.error(e)), 30_000);
  }
  onModuleDestroy() {
    clearInterval(this.timer);
  }

  // ───────── expiry ─────────

  /** Release timed-out cart holds and cancel unpaid orders whose payment window closed. */
  async sweep() {
    const db = this.prisma.db;
    const now = new Date();

    const expired = await db.reservation.findMany({ where: { status: "ACTIVE", expiresAt: { lt: now } }, select: { id: true, editionId: true } });
    for (const r of expired) {
      await db.$transaction([
        db.reservation.update({ where: { id: r.id }, data: { status: "EXPIRED" } }),
        db.edition.updateMany({ where: { id: r.editionId, status: "RESERVED" }, data: { status: "AVAILABLE", reservedUntil: null } }),
      ]);
    }

    const stale = await db.order.findMany({ where: { status: "PENDING_PAYMENT", paymentDueAt: { lt: now } }, include: { items: { select: { editionId: true } } } });
    for (const o of stale) await this.cancelOrder(o.id, "Payment window expired", o.items.map((i) => i.editionId));
    if (expired.length || stale.length) this.log.log(`released ${expired.length} holds, cancelled ${stale.length} unpaid orders`);
  }

  async cancelOrder(orderId: string, reason: string, editionIds?: string[]) {
    const db = this.prisma.db;
    const ids = editionIds ?? (await db.orderItem.findMany({ where: { orderId }, select: { editionId: true } })).map((i) => i.editionId);
    await db.$transaction([
      db.order.update({ where: { id: orderId }, data: { status: "CANCELLED", notes: reason } }),
      db.edition.updateMany({ where: { id: { in: ids }, status: "RESERVED" }, data: { status: "AVAILABLE", reservedUntil: null } }),
      db.reservation.updateMany({ where: { editionId: { in: ids }, status: "CONVERTED" }, data: { status: "RELEASED" } }),
    ]);
  }

  // ───────── cart ─────────

  async cart(sessionId: string | undefined) {
    if (!sessionId) return { items: [], count: 0, totals: null, lockMinutes: 15 };
    await this.sweep();
    const db = this.prisma.db;
    const settings = await this.settings.getPriceSettings();
    const lockMinutes = (await db.settings.findUnique({ where: { id: 1 }, select: { lockMinutes: true } }))?.lockMinutes ?? 15;
    const rows = await db.reservation.findMany({
      where: { sessionId, status: "ACTIVE", expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "asc" },
      include: { edition: { include: { piece: { include: { designer: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } } } } },
    });
    const now = Date.now();
    const items = rows.map((r) => {
      const p = r.edition.piece;
      return {
        reservationId: r.id,
        slug: p.slug,
        title: p.title,
        sku: p.sku,
        designerLine: [p.designer.name, p.materials].filter(Boolean).join(" · "),
        image: p.images[0]?.url ?? "/images/placeholder.svg",
        edition: `${String(r.edition.number).padStart(2, "0")} of ${String(p.totalEditions).padStart(2, "0")}`,
        price: displayPrice(p, settings),
        priceUsdCents: p.priceUsdCents,
        expiresAt: r.expiresAt.toISOString(),
        remainingSeconds: Math.max(0, Math.floor((r.expiresAt.getTime() - now) / 1000)),
      };
    });
    const usd = items.reduce((n, i) => n + i.priceUsdCents, 0);
    const tomanTotal = settings.usdToToman
      ? rows.reduce((n, r) => n + (tomanFor(r.edition.piece, settings.usdToToman) ?? 0), 0)
      : null;
    return {
      items,
      count: items.length,
      lockMinutes,
      currencyMode: settings.currencyMode,
      totals: items.length ? displayPrice({ priceUsdCents: usd, priceTomanOverride: tomanTotal && settings.currencyMode !== "USD" ? tomanTotal : null }, settings) : null,
    };
  }

  /** Reserve the lowest free edition of a piece for this browser session. */
  async add(sessionId: string, slug: string) {
    const db = this.prisma.db;
    await this.sweep();
    const piece = await db.piece.findFirst({ where: { slug, status: "PUBLISHED", deletedAt: null }, select: { id: true } });
    if (!piece) throw new NotFoundException("Piece not found");
    const lock = await db.settings.findUnique({ where: { id: 1 }, select: { lockMinutes: true } });
    const minutes = lock?.lockMinutes ?? 15;

    await db.$transaction(async (tx) => {
      const mine = await tx.reservation.findMany({ where: { sessionId, status: "ACTIVE", expiresAt: { gt: new Date() } }, include: { edition: { select: { pieceId: true } } } });
      if (mine.some((r) => r.edition.pieceId === piece.id)) return; // already holding one of this piece
      if (mine.length >= MAX_ITEMS) throw new ConflictException(`You can hold up to ${MAX_ITEMS} pieces at once`);

      // row lock so two collectors can never get the same numbered unit
      const picked = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Edition"
        WHERE "pieceId" = ${piece.id} AND status = 'AVAILABLE'::"EditionStatus"
        ORDER BY number ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1`;
      if (!picked.length) throw new ConflictException("No edition of this piece is available right now");

      const expiresAt = new Date(Date.now() + minutes * 60_000);
      await tx.edition.update({ where: { id: picked[0].id }, data: { status: "RESERVED", reservedUntil: expiresAt } });
      await tx.reservation.create({ data: { editionId: picked[0].id, sessionId, status: "ACTIVE", expiresAt } });
    });
  }

  async release(sessionId: string, reservationId: string) {
    const db = this.prisma.db;
    const r = await db.reservation.findFirst({ where: { id: reservationId, sessionId, status: "ACTIVE" } });
    if (!r) throw new NotFoundException("Reservation not found");
    await db.$transaction([
      db.reservation.update({ where: { id: r.id }, data: { status: "RELEASED" } }),
      db.edition.updateMany({ where: { id: r.editionId, status: "RESERVED" }, data: { status: "AVAILABLE", reservedUntil: null } }),
    ]);
  }

  // ───────── checkout ─────────

  private async uniqueOrderNumber() {
    for (;;) {
      const number = `XB-DISPATCH-${String(randomInt(0, 1_000_000)).padStart(6, "0")}`;
      if (!(await this.prisma.db.order.findUnique({ where: { number }, select: { id: true } }))) return number;
    }
  }

  async checkout(sessionId: string, body: CheckoutBody) {
    const db = this.prisma.db;
    await this.sweep();
    const reservations = await db.reservation.findMany({
      where: { sessionId, status: "ACTIVE", expiresAt: { gt: new Date() } },
      include: { edition: { include: { piece: true } } },
    });
    if (!reservations.length) throw new BadRequestException("Your reservation has expired or the bag is empty");

    const settings = await this.settings.getPriceSettings();
    const provider = getPaymentProvider();
    // the online gateway settles in Toman only
    let currency: "USD" | "TOMAN" = settings.currencyMode === "TOMAN" ? "TOMAN" : (body.currency ?? "USD");
    if (provider.name === "zarinpal") currency = "TOMAN";
    if (currency === "TOMAN" && !settings.usdToToman && reservations.some((r) => !r.edition.piece.priceTomanOverride)) {
      throw new BadRequestException("Toman prices are not configured yet");
    }

    const priced = reservations.map((r) => ({
      r,
      amount: currency === "USD" ? r.edition.piece.priceUsdCents : (tomanFor(r.edition.piece, settings.usdToToman) ?? 0),
    }));
    const total = priced.reduce((n, x) => n + x.amount, 0);
    const number = await this.uniqueOrderNumber();
    const dueAt = new Date(Date.now() + (provider.name === "manual" ? MANUAL_HOLD_HOURS * 60 : GATEWAY_WINDOW_MIN) * 60_000);

    const order = await db.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          number,
          status: "PENDING_PAYMENT",
          currency,
          usdToTomanRate: settings.usdToToman,
          totalAmount: total,
          collectorName: body.name,
          collectorEmail: body.email,
          collectorPhone: body.phone ?? null,
          shipCountry: body.country,
          shipCity: body.city,
          shipAddress: body.address,
          paymentDueAt: dueAt,
          items: { create: priced.map(({ r, amount }) => ({ editionId: r.editionId, titleSnap: r.edition.piece.title, skuSnap: r.edition.piece.sku, priceSnap: amount })) },
        },
      });
      // the units stay held for the payment window; the cart lock itself is finished
      await tx.reservation.updateMany({ where: { id: { in: reservations.map((r) => r.id) } }, data: { status: "CONVERTED" } });
      await tx.edition.updateMany({ where: { id: { in: reservations.map((r) => r.editionId) } }, data: { reservedUntil: dueAt } });
      return o;
    });

    const payable: PayableOrder = { number, currency, totalAmount: total, collectorEmail: body.email, collectorPhone: body.phone ?? null };
    const base = process.env.APP_URL ?? "http://localhost:3000";
    let redirectUrl: string | null = null;
    try {
      const started = await provider.start(payable, `${base}/api/payments/${provider.name}/callback?n=${number}`);
      redirectUrl = started.redirectUrl ?? null;
      await db.payment.create({ data: { orderId: order.id, provider: provider.name, authority: started.authority ?? null, amount: total, currency, status: "INITIATED" } });
    } catch (e) {
      this.log.error(`payment start failed for ${number}: ${e instanceof Error ? e.message : e}`);
      await this.cancelOrder(order.id, "Payment gateway unavailable");
      throw new ConflictException("The payment gateway is unavailable. Your hold was released; please try again shortly.");
    }
    return { number, token: order.publicToken, provider: provider.name, redirectUrl };
  }

  // ───────── payment result ─────────

  async markPaid(orderId: string, provider: string, refId?: string, raw?: unknown) {
    const db = this.prisma.db;
    const order = await db.order.findUnique({ where: { id: orderId }, include: { items: { select: { editionId: true } } } });
    if (!order) throw new NotFoundException("Order not found");
    if (order.status === "PAID" || order.status === "IN_CRATING" || order.status === "DISPATCHED" || order.status === "DELIVERED") return order;
    if (order.status === "CANCELLED") throw new ConflictException("Order was cancelled");
    const editionIds = order.items.map((i) => i.editionId);
    const certId = `PROV-CERT-${randomBytes(4).toString("hex").toUpperCase()}`;
    await db.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { status: "PAID", paidAt: new Date(), provenanceCertId: certId } });
      await tx.edition.updateMany({ where: { id: { in: editionIds } }, data: { status: "SOLD", reservedUntil: null } });
      const pay = await tx.payment.findFirst({ where: { orderId, provider }, orderBy: { createdAt: "desc" } });
      if (pay) await tx.payment.update({ where: { id: pay.id }, data: { status: "SUCCEEDED", refId: refId ?? null, verifiedAt: new Date(), raw: raw as object | undefined } });
      else await tx.payment.create({ data: { orderId, provider, amount: order.totalAmount, currency: order.currency, status: "SUCCEEDED", refId: refId ?? null, verifiedAt: new Date() } });
      await tx.shipment.create({ data: { orderId, carrier: "Swiss Post Priority Fine Art Logistics", crateStatus: "Awaiting crating", events: [{ at: new Date().toISOString(), label: "Payment confirmed" }] } });
    });
    return db.order.findUniqueOrThrow({ where: { id: orderId } });
  }

  async gatewayCallback(providerName: string, orderNumber: string, authority: string | undefined, status: string | undefined) {
    const db = this.prisma.db;
    const order = await db.order.findUnique({ where: { number: orderNumber } });
    if (!order) throw new NotFoundException("Order not found");
    const provider = getPaymentProvider();
    if (provider.name !== providerName) throw new BadRequestException("Unknown payment provider");
    const payment = authority ? await db.payment.findFirst({ where: { orderId: order.id, provider: providerName, authority } }) : null;
    if (!payment || status !== "OK") {
      if (payment) await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
      return order;
    }
    const result = await provider.verify(authority!, { number: order.number, currency: order.currency, totalAmount: order.totalAmount, collectorEmail: order.collectorEmail, collectorPhone: order.collectorPhone });
    if (!result.ok) {
      await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED", raw: result.raw as object | undefined } });
      return order;
    }
    return this.markPaid(order.id, providerName, result.refId, result.raw);
  }

  async publicOrder(number: string, token: string) {
    const o = await this.prisma.db.order.findFirst({
      where: { number, publicToken: token },
      include: { items: { include: { edition: { select: { number: true, piece: { select: { slug: true, totalEditions: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } } } } } }, shipments: true },
    });
    if (!o) throw new NotFoundException("Order not found");
    const fmt = (n: number) => (o.currency === "USD" ? `$${(n / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}` : `${n.toLocaleString("en-US")} Toman`);
    return {
      number: o.number,
      status: o.status,
      provider: getPaymentProvider().name,
      currency: o.currency,
      total: fmt(o.totalAmount),
      certId: o.provenanceCertId,
      paymentDueAt: o.paymentDueAt?.toISOString() ?? null,
      collector: { name: o.collectorName, email: o.collectorEmail },
      shipTo: `${o.shipAddress}, ${o.shipCity}, ${o.shipCountry}`,
      createdAt: o.createdAt.toISOString(),
      items: o.items.map((i) => ({
        title: i.titleSnap,
        sku: i.skuSnap,
        slug: i.edition.piece.slug,
        edition: `${String(i.edition.number).padStart(2, "0")} of ${String(i.edition.piece.totalEditions).padStart(2, "0")}`,
        image: i.edition.piece.images[0]?.url ?? "/images/placeholder.svg",
        price: fmt(i.priceSnap),
      })),
      crateStatus: o.shipments[0]?.crateStatus ?? null,
    };
  }
}

@Controller()
export class CommerceController {
  constructor(private readonly commerce: CommerceService) {}

  private session(req: Request) {
    return req.cookies?.[CART_COOKIE] as string | undefined;
  }

  @Get("cart")
  cart(@Req() req: Request) {
    return this.commerce.cart(this.session(req));
  }

  @Post("cart/items")
  @HttpCode(201)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async add(@Body(new ZodPipe(addSchema)) body: z.infer<typeof addSchema>, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    let sid = this.session(req);
    if (!sid) {
      sid = randomBytes(24).toString("hex");
      res.cookie(CART_COOKIE, sid, cookieOpts());
    }
    await this.commerce.add(sid, body.slug);
    return this.commerce.cart(sid);
  }

  @Delete("cart/items/:id")
  @HttpCode(200)
  async remove(@Param("id") id: string, @Req() req: Request) {
    const sid = this.session(req);
    if (!sid) throw new NotFoundException();
    await this.commerce.release(sid, id);
    return this.commerce.cart(sid);
  }

  @Post("checkout")
  @HttpCode(201)
  @Throttle({ default: { limit: 10, ttl: 10 * 60_000 } })
  checkout(@Body(new ZodPipe(checkoutSchema)) body: CheckoutBody, @Req() req: Request) {
    const sid = this.session(req);
    if (!sid) throw new BadRequestException("Your bag is empty");
    return this.commerce.checkout(sid, body);
  }

  @Get("orders/:number")
  order(@Param("number") number: string, @Query("t") token: string) {
    if (!token) throw new NotFoundException();
    return this.commerce.publicOrder(number, token);
  }

  /** The gateway sends the buyer back here; we verify with the gateway, then show the order page. */
  @Get("payments/:provider/callback")
  async callback(
    @Param("provider") provider: string,
    @Query("n") n: string,
    @Query("Authority") authority: string | undefined,
    @Query("Status") status: string | undefined,
    @Res() res: Response,
  ) {
    const order = await this.commerce.gatewayCallback(provider, n, authority, status);
    res.redirect(302, `/order/${order.number}?t=${order.publicToken}`);
  }
}

@Module({ imports: [SettingsModule], controllers: [CommerceController], providers: [CommerceService], exports: [CommerceService] })
export class CommerceModule {}
