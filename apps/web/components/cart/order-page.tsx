/* eslint-disable @next/next/no-img-element */
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import type { PublicOrder } from "@/lib/types";

const STATUS: Record<PublicOrder["status"], { title: string; note: (o: PublicOrder) => string }> = {
  PENDING_PAYMENT: {
    title: "Allocation received",
    note: (o) =>
      o.provider === "manual"
        ? `We will email an invoice to ${o.collector.email}. Your edition is held until ${o.paymentDueAt ? new Date(o.paymentDueAt).toUTCString().replace(" GMT", " UTC") : "payment"}.`
        : "Waiting for the payment to be confirmed by the gateway.",
  },
  PAID: { title: "Acquisition confirmed", note: (): string => "Payment received. Your piece is being prepared for crating and dispatch." },
  IN_CRATING: { title: "Being crated", note: () => "Your piece is in the crating workshop." },
  DISPATCHED: { title: "Dispatched", note: () => "Your crate is on its way." },
  DELIVERED: { title: "Delivered", note: () => "Delivered. Thank you for collecting with Xadboom." },
  CANCELLED: { title: "Allocation released", note: () => "This order was cancelled and the edition returned to the atelier." },
  REFUNDED: { title: "Refunded", note: () => "This order was refunded." },
};

export function OrderPage({ order }: { order: PublicOrder }) {
  const s = STATUS[order.status];
  return (
    <div className="theme-home page-home min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-[900px] px-6 pb-24 pt-32 md:px-12">
        <p className="mb-2 font-['Space_Grotesk'] text-[11px] uppercase tracking-widest text-[#7a6e69]">{order.number}</p>
        <h1 className="mb-3 text-3xl font-bold uppercase tracking-tight md:text-4xl">{s.title}</h1>
        <p className="mb-10 max-w-xl text-[15px] text-[#4d4540]">{s.note(order)}</p>

        <div className="rounded-2xl border border-[#e2cecb] bg-[#fff1ec] p-6">
          {order.items.map((i) => (
            <a key={i.sku} href={`/product/${i.slug}`} className="mb-4 flex items-center gap-4">
              <img src={i.image} alt={i.title} className="h-20 w-20 rounded-lg border border-[#d8c3bc] object-cover" />
              <div className="flex-1">
                <h2 className="text-base font-bold uppercase tracking-tight">{i.title}</h2>
                <p className="font-['Space_Grotesk'] text-[10px] uppercase tracking-wider text-[#7a6e69]">Edition {i.edition} · {i.sku}</p>
              </div>
              <span className="font-['Space_Grotesk'] text-sm font-bold">{i.price}</span>
            </a>
          ))}
          <div className="flex items-baseline justify-between border-t border-[#e2cecb] pt-4">
            <span className="font-['Space_Grotesk'] text-[11px] uppercase tracking-widest">Total</span>
            <span className="font-['Space_Grotesk'] text-lg font-bold">{order.total}</span>
          </div>
        </div>

        <dl className="mt-8 grid gap-6 font-['Space_Grotesk'] text-[11px] uppercase tracking-wider md:grid-cols-3">
          <div>
            <dt className="mb-1 text-[#7a6e69]">Collector</dt>
            <dd className="normal-case tracking-normal text-sm text-[#1c1917]">{order.collector.name}<br />{order.collector.email}</dd>
          </div>
          <div>
            <dt className="mb-1 text-[#7a6e69]">Delivery</dt>
            <dd className="normal-case tracking-normal text-sm text-[#1c1917]">{order.shipTo}</dd>
          </div>
          <div>
            <dt className="mb-1 text-[#7a6e69]">Provenance certificate</dt>
            <dd className="normal-case tracking-normal text-sm text-[#1c1917]">{order.certId ?? "Issued once payment is confirmed"}</dd>
          </div>
        </dl>
        <p className="mt-10 text-xs text-[#7a6e69]">Keep this page's address: it is your private link to this order.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
