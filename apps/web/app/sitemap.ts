import type { MetadataRoute } from "next";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const first = await api.catalog(undefined, 1);
  const cards = [...first.cards];
  for (let p = 2; p <= first.pages; p++) cards.push(...(await api.catalog(undefined, p)).cards);
  const fixed = ["", "/catalog", "/designers", "/contact"].map((path) => ({ url: base + path, changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.7 }));
  return [...fixed, ...cards.map((c) => ({ url: `${base}/product/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.9 }))];
}
