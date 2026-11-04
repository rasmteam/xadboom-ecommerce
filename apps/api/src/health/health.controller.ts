import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { PrismaService } from "../prisma/prisma.module";

@Controller("health")
@SkipThrottle()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.db.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({ status: "down", database: "unreachable" });
    }
    return { status: "ok", database: "up", timestamp: new Date().toISOString() };
  }
}
