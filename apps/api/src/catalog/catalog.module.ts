import { Controller, Get, Module, Param, Query } from "@nestjs/common";
import { z } from "zod";
import { ZodPipe } from "../common/zod.pipe";
import { SettingsModule } from "../settings/settings.module";
import { CatalogService } from "./catalog.service";

const listQuery = z.object({
  category: z.string().max(80).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});
type ListQuery = z.infer<typeof listQuery>;

/** Public, read-only storefront endpoints. */
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("catalog")
  list(@Query(new ZodPipe(listQuery)) q: ListQuery) {
    return this.catalog.list(q);
  }

  @Get("catalog/featured")
  featured() {
    return this.catalog.featured(4);
  }

  @Get("pieces/:slug")
  piece(@Param("slug") slug: string) {
    return this.catalog.bySlug(slug);
  }

  @Get("designers")
  designers() {
    return this.catalog.designers();
  }
}

@Module({ imports: [SettingsModule], controllers: [CatalogController], providers: [CatalogService], exports: [CatalogService] })
export class CatalogModule {}
