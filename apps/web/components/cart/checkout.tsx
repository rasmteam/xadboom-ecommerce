"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { fmtClock, useCart } from "./cart-provider";

const field =
  "w-full rounded-lg border border-[#d8c3bc] bg-[#fff8f6] px-4 py-3 text-sm text-[#1c1917] outline-none focus:border-[#0a0a0a]";
const label = "mb-1 block font-['Space_Grotesk'] text-[10px] uppercase tracking-widest text-[#7a6e69]";

export function CheckoutPage() {
  const { cart, loaded, secondsLeft, remove, refresh } = useCart();
  const [currency, setCurrency] = useState<"USD" | "TOMAN">("USD");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chooseCurrency = cart.currencyMode === "BOTH" && cart.provider !== "zarinpal";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.get("name"),
          email: f.get("email"),
          phone: f.get("phone") || undefined,
          country: f.get("country"),
          city: f.get("city"),
          address: f.get("address"),
          currency: chooseCurrency ? currency : undefined,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.issues?.[0] ? `${json.issues[0].path}: ${json.issues[0].message}` : (json?.message ?? "Could not place the order"));
        void refresh();
        return;
      }
      window.location.assign(json.redirectUrl ?? `/order/${json.number}?t=${json.token}`);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="theme-home page-home min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-[1100px] px-6 pb-24 pt-32 md:px-12">
        <p className="mb-2 font-['Space_Grotesk'] text-[11px] uppercase tracking-widest text-[#7a6e69]">Allocation checkout</p>
        <h1 className="mb-10 text-3xl font-bold uppercase tracking-tight md:text-4xl">Secure your edition</h1>

        {!loaded ? (
          <p className="font-['Space_Grotesk'] text-xs uppercase tracking-widest text-[#7a6e69]">Loading your bag…</p>
        ) : cart.count === 0 ? (
          <div className="rounded-2xl border border-[#e2cecb] bg-[#fff1ec] p-10 text-center">
            <p className="mb-6 font-['Space_Grotesk'] text-xs uppercase tracking-widest text-[#7a6e69]">Your bag is empty or the reservation has expired.</p>
            <a href="/catalog" className="inline-block rounded-full bg-[#0a0a0a] px-6 py-3 font-['Space_Grotesk'] text-[11px] font-bold uppercase tracking-widest text-[#fff8f6]">
              Explore catalog →
            </a>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-12">
            <form onSubmit={submit} className="space-y-5 lg:col-span-7">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className={label} htmlFor="name">Full name / practice *</label>
                  <input id="name" name="name" required autoComplete="name" className={field} />
                </div>
                <div>
                  <label className={label} htmlFor="email">Email *</label>
                  <input id="email" name="email" type="email" required autoComplete="email" className={field} />
                </div>
                <div>
                  <label className={label} htmlFor="phone">Telephone</label>
                  <input id="phone" name="phone" type="tel" autoComplete="tel" className={field} />
                </div>
                <div>
                  <label className={label} htmlFor="country">Country *</label>
                  <input id="country" name="country" required autoComplete="country-name" className={field} />
                </div>
                <div>
                  <label className={label} htmlFor="city">City *</label>
                  <input id="city" name="city" required autoComplete="address-level2" className={field} />
                </div>
                <div className="md:col-span-2">
                  <label className={label} htmlFor="address">Delivery address (crated white-glove freight) *</label>
                  <textarea id="address" name="address" required rows={3} autoComplete="street-address" className={field} />
                </div>
              </div>

              {chooseCurrency && (
                <fieldset className="rounded-xl border border-[#e2cecb] bg-[#fff1ec] p-4">
                  <legend className={`${label} px-1`}>Pay in</legend>
                  <div className="flex gap-6 text-sm">
                    {(["USD", "TOMAN"] as const).map((c) => (
                      <label key={c} className="flex items-center gap-2">
                        <input type="radio" name="currency" checked={currency === c} onChange={() => setCurrency(c)} />
                        {c === "USD" ? "US dollars" : "Toman"}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              {error && (
                <p role="alert" className="rounded-lg bg-[#ffdad6] px-4 py-3 text-sm text-[#93000a]">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-[#0a0a0a] px-6 py-4 font-['Space_Grotesk'] text-[11px] font-bold uppercase tracking-widest text-[#fff8f6] disabled:opacity-60"
              >
                {busy ? "Placing allocation…" : cart.provider === "zarinpal" ? "Continue to secure payment →" : "Place allocation request →"}
              </button>
              <p className="text-xs text-[#7a6e69]">
                {cart.provider === "zarinpal"
                  ? "You will be redirected to the payment gateway. Your edition stays reserved while you pay."
                  : "The atelier will send an invoice and payment instructions by email. Your edition stays reserved for 48 hours."}
              </p>
            </form>

            <aside className="lg:col-span-5">
              <div className="sticky top-28 rounded-2xl border border-[#e2cecb] bg-[#fff1ec] p-6">
                <div className="mb-4 flex items-center justify-between border-b border-[#e2cecb] pb-3 font-['Space_Grotesk'] text-[10px] uppercase tracking-widest">
                  <span className="text-[#844c38]">{cart.lockMinutes}-minute lock</span>
                  <span className="text-sm font-bold">{fmtClock(secondsLeft)}</span>
                </div>
                {cart.items.map((i) => (
                  <div key={i.reservationId} className="mb-4 flex items-start gap-3">
                    <img src={i.image} alt={i.title} className="h-16 w-16 rounded-lg border border-[#d8c3bc] object-cover" />
                    <div className="flex-1">
                      <h2 className="text-sm font-bold uppercase tracking-tight">{i.title}</h2>
                      <p className="font-['Space_Grotesk'] text-[10px] uppercase tracking-wider text-[#7a6e69]">Edition {i.edition}</p>
                      <button type="button" className="mt-1 text-[11px] text-[#7a6e69] underline" onClick={() => remove(i.reservationId)}>
                        Release
                      </button>
                    </div>
                    <span className="font-['Space_Grotesk'] text-sm font-bold">{i.price.primary}</span>
                  </div>
                ))}
                <div className="flex items-baseline justify-between border-t border-[#e2cecb] pt-4">
                  <span className="font-['Space_Grotesk'] text-[11px] uppercase tracking-widest">Total</span>
                  <span className="text-right font-['Space_Grotesk'] text-lg font-bold">
                    {cart.totals?.primary}
                    {cart.totals?.usd && cart.totals.toman && <span className="block text-[11px] font-normal text-[#7a6e69]">{cart.totals.toman}</span>}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-[#7a6e69]">Crated white-glove freight is included.</p>
              </div>
            </aside>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
