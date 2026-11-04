import type { Metadata } from "next";
import { ProductPage } from "@/components/legacy/product";
import { api } from "@/lib/api";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { card, description } = await api.piece(slug);
  const title = `${card.title} — ${card.designerName} | Xadboom`;
  const text = description ?? `${card.title} by ${card.designerLine}. ${card.editionLabel}.`;
  return {
    title,
    description: text,
    alternates: { canonical: `/product/${card.slug}` },
    openGraph: { title, description: text, type: "website", images: [card.image] },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const detail = await api.piece(slug);
  const { card } = detail;
  const base = process.env.APP_URL ?? "http://localhost:3000";

  // structured data so search engines can show price and availability
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: card.title,
    sku: card.sku,
    description: detail.description ?? card.materials,
    image: detail.images.map((i) => new URL(i.url, base).toString()),
    brand: { "@type": "Brand", name: card.studio ?? "Xadboom" },
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: card.price.usd ? card.price.usd.replace(/[^0-9.]/g, "") : undefined,
      availability: card.soldOut ? "https://schema.org/SoldOut" : card.lowStock ? "https://schema.org/LimitedAvailability" : "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductPage detail={detail} />
    </>
  );
}
