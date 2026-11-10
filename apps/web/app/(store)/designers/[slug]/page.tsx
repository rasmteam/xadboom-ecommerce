import type { Metadata } from "next";
import { DesignerProfile } from "@/components/designer/designer-profile";
import { api } from "@/lib/api";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { designer: d } = await api.designer(slug);
  const title = `${d.name}${d.studio ? ` — ${d.studio}` : ""} | Xadboom`;
  const description = d.tagline ?? d.bio ?? `${d.name}${d.title ? `, ${d.title}` : ""}. Limited editions made with Xadboom.`;
  const image = d.profileImage ?? d.portrait;
  return { title, description, alternates: { canonical: `/designers/${d.slug}` }, openGraph: { title, description, type: "profile", images: image ? [image] : undefined } };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const { designer: d, cards, others } = await api.designer(slug);
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const image = d.profileImage ?? d.portrait;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: d.name,
    jobTitle: d.title ?? undefined,
    description: d.bio ?? d.tagline ?? undefined,
    image: image ? new URL(image, base).toString() : undefined,
    url: `${base}/designers/${d.slug}`,
    worksFor: d.studio ? { "@type": "Organization", name: d.studio } : undefined,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DesignerProfile d={d} cards={cards} others={others} />
    </>
  );
}
