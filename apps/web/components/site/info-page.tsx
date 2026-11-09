import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function InfoPage({ title, intro, sections }: { title: string; intro: string; sections: { heading: string; body: string }[] }) {
  return (
    <div className="theme-home page-home">
      <SiteHeader />
      <main className="px-6 md:px-12 pt-32 pb-24">
        <div className="max-w-3xl mx-auto space-y-8">
          <h1 className="text-4xl font-medium tracking-tight">{title}</h1>
          <p className="text-base text-brand-dark/80 leading-relaxed">{intro}</p>
          {sections.map((s) => (
            <section key={s.heading} className="space-y-2">
              <h2 className="text-lg font-semibold">{s.heading}</h2>
              <p className="text-sm text-brand-dark/80 leading-relaxed">{s.body}</p>
            </section>
          ))}
          <p className="text-xs text-brand-dark/60">Questions? <a className="underline" href="/contact">Contact the atelier</a>.</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
