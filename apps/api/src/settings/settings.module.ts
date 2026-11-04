import { Controller, Get, Injectable, Module } from "@nestjs/common";
import type { PriceSettings } from "../common/money";
import { PrismaService } from "../prisma/prisma.module";

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Admin-controlled currency mode + Toman rate (a singleton row). */
  async getPriceSettings(): Promise<PriceSettings> {
    const s = await this.prisma.db.settings.findUnique({ where: { id: 1 } });
    return { currencyMode: s?.currencyMode ?? "USD", usdToToman: s?.usdToToman ?? null };
  }
}

@Controller("settings")
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  /** Public: the storefront needs the currency mode to render prices. */
  @Get("public")
  publicSettings() {
    return this.settings.getPriceSettings();
  }
}

@Module({ controllers: [SettingsController], providers: [SettingsService], exports: [SettingsService] })
export class SettingsModule {}
