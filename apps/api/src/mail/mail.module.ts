import { Controller, Get, Global, Module, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Auth } from "../auth/auth.guard";
import { AuthModule } from "../auth/auth.module";
import { PrismaService } from "../prisma/prisma.module";
import { MailService } from "./mail.service";

export { MailService };

@ApiTags("admin")
@Controller("admin/emails")
export class MailAdminController {
  constructor(private readonly prisma: PrismaService) {}

  /** The latest emails the system sent (or logged), for administrators. */
  @Get()
  @Auth("ADMIN")
  async list(@Query("take") take = "50") {
    const n = Math.min(200, Math.max(1, Number(take) || 50));
    return this.prisma.db.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: n });
  }
}

@Global()
@Module({ imports: [AuthModule], controllers: [MailAdminController], providers: [MailService], exports: [MailService] })
export class MailModule {}
