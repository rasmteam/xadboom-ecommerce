import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AdminModule } from "./admin/admin.module";
import { AdminOpsModule } from "./admin/ops.module";
import { AdminPiecesModule } from "./admin/pieces.module";
import { CommerceModule } from "./commerce/commerce.module";
import { AssetsModule } from "./admin/assets.module";
import { MailModule } from "./mail/mail.module";
import { AuthModule } from "./auth/auth.module";
import { CatalogModule } from "./catalog/catalog.module";
import { HealthController } from "./health/health.controller";
import { InquiriesModule } from "./inquiries/inquiries.module";
import { PrismaModule } from "./prisma/prisma.module";
import { SettingsModule } from "./settings/settings.module";

@Module({
  imports: [
    // generous global default; sensitive routes tighten it with @Throttle
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    SettingsModule,
    AuthModule,
    CatalogModule,
    InquiriesModule,
    AdminModule,
    AdminPiecesModule,
    AdminOpsModule,
    CommerceModule,
    MailModule,
    AssetsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
