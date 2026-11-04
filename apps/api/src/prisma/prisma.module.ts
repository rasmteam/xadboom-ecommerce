import { Global, Injectable, Module, OnModuleDestroy } from "@nestjs/common";
import { getPrisma } from "@xadboom/db";

/** Thin wrapper so services inject the shared Prisma client. */
@Injectable()
export class PrismaService implements OnModuleDestroy {
  readonly db = getPrisma();

  async onModuleDestroy() {
    await this.db.$disconnect();
  }
}

@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
