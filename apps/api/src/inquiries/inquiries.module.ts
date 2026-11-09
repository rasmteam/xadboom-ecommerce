import { Body, Controller, HttpCode, Injectable, Module, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { z } from "zod";
import { ZodPipe } from "../common/zod.pipe";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.module";

const inquirySchema = z.object({
  type: z.string().trim().min(1).max(80).default("Curatorial Consultation"),
  client: z.string().trim().min(1).max(160),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  project: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1).max(5000),
  pieceSlug: z.string().max(120).optional(),
});
type InquiryBody = z.infer<typeof inquirySchema>;

@Injectable()
export class InquiriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async create({ pieceSlug, ...input }: InquiryBody) {
    const db = this.prisma.db;
    const piece = pieceSlug ? await db.piece.findUnique({ where: { slug: pieceSlug }, select: { id: true } }) : null;
    const year = new Date().getFullYear();
    const count = await db.inquiry.count();
    // 3h response target, shown in the admin as the SLA countdown
    const slaDueAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
    const created = await db.inquiry.create({
      data: { ...input, pieceId: piece?.id, number: `INQ-${year}-${String(count + 100).padStart(3, "0")}-${suffix}`, status: "NEW", slaDueAt },
      select: { number: true, slaDueAt: true },
    });
    this.mail.inquiryAck(input.email, input.client, created.number);
    return created;
  }
}

@Controller("inquiries")
export class InquiriesController {
  constructor(private readonly inquiries: InquiriesService) {}

  // public form: 5 submissions / 10 min per IP
  @Post()
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 10 * 60 * 1000 } })
  create(@Body(new ZodPipe(inquirySchema)) body: InquiryBody) {
    return this.inquiries.create(body);
  }
}

@Module({ controllers: [InquiriesController], providers: [InquiriesService] })
export class InquiriesModule {}
