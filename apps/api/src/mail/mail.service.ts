import { Injectable, Logger } from "@nestjs/common";
import nodemailer, { type Transporter } from "nodemailer";
import { PrismaService } from "../prisma/prisma.module";

export type OrderMail = { number: string; token: string; name: string; email: string; total: string; items: string[]; provider?: string; dueAt?: Date | null; carrier?: string | null; trackingRef?: string | null; certId?: string | null };

const appUrl = () => (process.env.APP_URL ?? "http://localhost:3010").replace(/\/$/, "");
const orderLink = (o: { number: string; token: string }) => `${appUrl()}/order/${o.number}?t=${o.token}`;
const sign = "\n\nXadboom Atelier\nCurated interior architecture assets\n";

/**
 * Sends transactional email. With SMTP_HOST configured it sends through SMTP; without it the message is only
 * stored in the EmailLog table (status LOGGED), so nothing breaks before a mail server exists. Never throws.
 */
@Injectable()
export class MailService {
  private readonly log = new Logger("Mail");
  private transporter: Transporter | null | undefined;

  constructor(private readonly prisma: PrismaService) {}

  private get smtp(): Transporter | null {
    if (this.transporter !== undefined) return this.transporter;
    const host = process.env.SMTP_HOST;
    this.transporter = host
      ? nodemailer.createTransport({
          host,
          port: Number(process.env.SMTP_PORT ?? 587),
          secure: process.env.SMTP_SECURE === "true",
          auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
        })
      : null;
    return this.transporter;
  }

  private async deliver(template: string, to: string, subject: string, body: string) {
    let status = "LOGGED";
    let error: string | null = null;
    const t = this.smtp;
    if (t) {
      try {
        await t.sendMail({ from: process.env.MAIL_FROM ?? "Xadboom Atelier <no-reply@xadboom.local>", to, subject, text: body });
        status = "SENT";
      } catch (e) {
        status = "FAILED";
        error = e instanceof Error ? e.message : String(e);
        this.log.error(`send failed (${template} -> ${to}): ${error}`);
      }
    }
    await this.prisma.db.emailLog.create({ data: { to, subject, body, template, status, error } }).catch((e) => this.log.error(e));
  }

  /** Fire and forget: a mail problem must never fail an order or a sign-up. */
  private queue(template: string, to: string, subject: string, body: string) {
    void this.deliver(template, to, subject, body).catch((e) => this.log.error(e));
  }

  orderReceived(o: OrderMail) {
    const pay =
      o.provider === "manual"
        ? `We will email you an invoice with payment instructions shortly. Your edition is held until ${o.dueAt ? o.dueAt.toUTCString() : "payment is confirmed"}.`
        : "Your payment is being confirmed by the payment gateway.";
    this.queue(
      "order-received",
      o.email,
      `Allocation received — ${o.number}`,
      `Dear ${o.name},\n\nThank you. We have received your allocation request:\n\n${o.items.map((i) => `  - ${i}`).join("\n")}\n\nTotal: ${o.total}\n\n${pay}\n\nYour private order page: ${orderLink(o)}${sign}`,
    );
  }

  orderPaid(o: OrderMail) {
    this.queue(
      "order-paid",
      o.email,
      `Acquisition confirmed — ${o.number}`,
      `Dear ${o.name},\n\nWe have received your payment for ${o.number} (${o.total}). Your provenance certificate: ${o.certId ?? "issued shortly"}.\n\nYour piece is now being prepared for crating and dispatch.\n\nOrder page: ${orderLink(o)}${sign}`,
    );
  }

  orderDispatched(o: OrderMail) {
    this.queue(
      "order-dispatched",
      o.email,
      `Your piece is on its way — ${o.number}`,
      `Dear ${o.name},\n\nYour crate for ${o.number} has been dispatched${o.carrier ? ` with ${o.carrier}` : ""}${o.trackingRef ? ` (waybill ${o.trackingRef})` : ""}.\n\nOrder page: ${orderLink(o)}${sign}`,
    );
  }

  inquiryAck(to: string, name: string, number: string) {
    this.queue("inquiry-ack", to, `We received your inquiry — ${number}`, `Dear ${name},\n\nThank you for contacting the atelier. Your inquiry ${number} has been logged and a curator will reply within 3 hours during studio time.${sign}`);
  }

  welcome(to: string, name: string) {
    this.queue("welcome", to, "Welcome to Xadboom", `Dear ${name},\n\nYour collector account is ready. You can follow every acquisition in "My acquisitions": ${appUrl()}/account${sign}`);
  }
}
