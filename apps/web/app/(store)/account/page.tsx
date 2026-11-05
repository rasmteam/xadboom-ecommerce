/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountSignOut } from "@/components/account/sign-out";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { api } from "@/lib/api";

export const metadata: Metadata = { title: "My acquisitions — Xadboom", robots: { index: false, follow: false } };

type MyOrder = {
  number: string;
  token: string;
  status: string;
  total: string;
  createdAt: string;
  items: { title: string; sku: string; slug: string; image: string; edition: string }[];
};

const STATUS: Record<string, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  PAID: "Paid · preparing crate",
  IN_CRATING: "Being crated",
  DISPATCHED: "In transit",
  DELIVERED: "Delivered",
  CANCELLED: "Released",
  REFUNDED: "Refunded",
};

export default async function AccountPage() {
  const user = await api.me();
  if (!user) redirect("/login?next=/account");
  const orders = await api.adminGet<MyOrder[]>("/orders/mine");

  return (
    <div className="theme-home page-home min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-[900px] px-6 pb-24 pt-32 md:px-12">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 font-['Space_Grotesk'] text-[11px] uppercase tracking-widest text-[#7a6e69]">{user.email}</p>
            <h1 className="text-3xl font-bold uppercase tracking-tight md:text-4xl">My acquisitions</h1>
          </div>
          <div className="flex items-center gap-4 font-['Space_Grotesk'] text-[11px] uppercase tracking-widest">
            {(user.role === "ADMIN" || user.role === "EDITOR") && (
              <a href="/admin" className="underline">
                Atelier admin
              </a>
            )}
            <AccountSignOut />
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-[#e2cecb] bg-[#fff1ec] p-10 text-center">
            <p className="mb-6 font-['Space_Grotesk'] text-xs uppercase tracking-widest text-[#7a6e69]">You have not acquired a piece yet.</p>
            <a href="/catalog" className="inline-block rounded-full bg-[#0a0a0a] px-6 py-3 font-['Space_Grotesk'] text-[11px] font-bold uppercase tracking-widest text-[#fff8f6]">
              Explore catalog →
            </a>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((o) => (
              <a key={o.number} href={`/order/${o.number}?t=${o.token}`} className="block rounded-2xl border border-[#e2cecb] bg-[#fff1ec] p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 font-['Space_Grotesk'] text-[10px] uppercase tracking-widest">
                  <span className="text-[#7a6e69]">
                    {o.number} · {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })}
                  </span>
                  <span className="rounded bg-[#0a0a0a] px-2 py-1 text-white">{STATUS[o.status] ?? o.status}</span>
                </div>
                {o.items.map((i) => (
                  <div key={i.sku} className="mb-2 flex items-center gap-4">
                    <img src={i.image} alt={i.title} className="h-16 w-16 rounded-lg border border-[#d8c3bc] object-cover" />
                    <div className="flex-1">
                      <h2 className="text-sm font-bold uppercase tracking-tight">{i.title}</h2>
                      <p className="font-['Space_Grotesk'] text-[10px] uppercase tracking-wider text-[#7a6e69]">Edition {i.edition}</p>
                    </div>
                  </div>
                ))}
                <p className="mt-2 text-right font-['Space_Grotesk'] text-sm font-bold">{o.total}</p>
              </a>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
