import type { Metadata } from "next";
import { CatalogPage } from "@/components/legacy/catalog";
import { api } from "@/lib/api";

export const metadata: Metadata = {
  title: "Curated Architectural Assets — Xadboom Catalog",
  description:
    "Limited-run furniture and spatial objects, conceived by architects and fabricated in numbered editions.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const { category, page } = await searchParams;
  const data = await api.catalog(category, Math.max(1, Number(page) || 1));
  return <CatalogPage data={data} activeCategory={category} />;
}
