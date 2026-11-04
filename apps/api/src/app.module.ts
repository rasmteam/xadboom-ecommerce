import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
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
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
