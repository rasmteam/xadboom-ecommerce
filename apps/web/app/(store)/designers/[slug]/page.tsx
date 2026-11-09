/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { api } from "@/lib/api";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { designer: d } = await api.designer(slug);
  const title = `${d.name}${d.studio ? ` — ${d.studio}` : ""} | Xadboom`;
  const description = d.bio ?? `${d.name}${d.title ? `, ${d.title}` : ""}. Limited editions made with Xadboom.`;
  return { title, description, alternates: { canonical: `/designers/${d.slug}` }, openGraph: { title, description, type: "profile", images: d.profileImage ?? d.portrait ? [d.profileImage ?? d.portrait!] : undefined } };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const { designer: d, cards } = await api.designer(slug);
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const jsonLd = { "@context": "https://schema.org", "@type": "Person", name: d.name, jobTitle: d.title ?? undefined, description: d.bio ?? undefined, image: d.profileImage ?? d.portrait ? new URL((d.profileImage ?? d.portrait)!, base).toString() : undefined, worksFor: d.studio ? { "@type": "Organization", name: d.studio } : undefined };
  const facts = [["Studio", d.studio], ["Based in", d.city], ["Discipline", d.discipline], ["Materiality", d.materiality]].filter(([, v]) => v) as [string, string][];
  return (
    <div className="theme-home page-home">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader active="designers" />
      <main className="px-6 md:px-12 pt-28 pb-24">
        <div className="max-w-[1360px] mx-auto space-y-16">
          <nav className="font-mono text-[11px] tracking-wider uppercase text-brand-dark/60 flex gap-2">
            <a href="/" className="hover:text-brand-dark">Index</a>/<a href="/designers" className="hover:text-brand-dark">Designers</a>/<span className="text-brand-dark">{d.name}</span>
          </nav>
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5">
              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-stone-200 border border-brand-border">
                <img alt={`${d.name} portrait`} className="w-full h-full object-cover" src={d.profileImage ?? d.portrait ?? "/images/placeholder.svg"} />
              </div>
            </div>
            <div className="lg:col-span-7 space-y-6">
              {d.title && <span className="inline-block font-mono text-[11px] tracking-widest uppercase px-3 py-1 rounded-full bg-brand-dark text-white">{d.title}</span>}
              <h1 className="text-4xl md:text-6xl font-medium tracking-tight">{d.name}</h1>
              {d.bio && <p className="text-base md:text-lg text-brand-dark/85 leading-relaxed max-w-2xl whitespace-pre-line">{d.bio}</p>}
              {facts.length > 0 && (
                <dl className="max-w-md font-mono text-[11px] tracking-wider uppercase">
                  {facts.map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-brand-border py-2"><dt className="text-brand-dark/60">{k}</dt><dd className="font-semibold text-right">{v}</dd></div>
                  ))}
                </dl>
              )}
            </div>
          </section>
          <section className="space-y-6">
            <h2 className="text-2xl font-medium tracking-tight">{cards.length ? `Editions by ${d.name}` : "No editions released yet"}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cards.map((c) => (
                <article key={c.id} className="group relative">
                  <a href={`/product/${c.slug}`} aria-label={c.title} className="absolute inset-0 z-10" />
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-stone-200 border border-brand-border mb-3">
                    <img alt={`${c.title} by ${c.designerName}`} className="w-full h-full object-cover group-hover:scale-[1.035] transition-transform duration-700" src={c.image} />
                    <span className="absolute bottom-3 right-3 bg-brand-dark/90 text-white px-3 py-1 rounded text-[10px] font-mono tracking-widest uppercase">{c.editionLabel}</span>
                  </div>
                  <h3 className="text-lg font-medium">{c.title}</h3>
                  <div className="flex justify-between text-sm text-brand-dark/70"><span>{c.price.primary}</span><span className="font-mono text-[10px] tracking-widest uppercase">{c.availabilityLabel}</span></div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
