"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect } from "react";
import { fmtClock, useCart } from "./cart-provider";

/** Allocation bag: held editions with the 15-minute countdown. */
export function CartDrawer() {
  const { cart, open, setOpen, secondsLeft, busy, error, remove } = useCart();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-[99999] bg-[rgba(28,25,23,0.4)] backdrop-blur-[2px]" onClick={() => setOpen(false)} />
      <aside
        role="dialog"
        aria-label="Allocation bag"
        className="fixed right-0 top-0 bottom-0 z-[100000] flex w-full max-w-[440px] flex-col border-l border-[#d8c3bc] bg-[#fff8f6] font-['DM_Sans'] text-[#1c1917] shadow-[-12px_0_40px_rgba(35,26,22,0.2)]"
      >
        <div className="flex items-center justify-between border-b border-[#d8c3bc] bg-[#ecdad4] px-6 py-5">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-[#0a0a0a]" />
            <h3 className="font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em]">Allocation Bag &amp; Reservation</h3>
          </div>
          <button type="button" aria-label="Close bag" className="px-2 py-1 font-mono text-lg" onClick={() => setOpen(false)}>
            ✕
          </button>
        </div>

        {cart.count > 0 && (
          <div className="flex items-center justify-between border-b border-[#e2cecb] bg-[#fff1ec] px-6 py-3">
            <div className="flex items-center gap-2">
              <span className="inline-block h-[7px] w-[7px] animate-pulse rounded-full bg-[#844c38]" />
              <span className="font-['Space_Grotesk'] text-[10px] font-semibold uppercase tracking-[0.08em] text-[#844c38]">{cart.lockMinutes}-min lock active</span>
            </div>
            <span className="font-['Space_Grotesk'] text-xs font-bold tracking-[0.08em]">{fmtClock(secondsLeft)}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <p role="alert" className="mb-4 rounded-lg border border-[#ffdad6] bg-[#ffdad6] px-4 py-3 text-[13px] text-[#93000a]">
              {error}
            </p>
          )}
          {cart.count === 0 ? (
            <div className="px-2 py-10 text-center font-mono text-xs text-[#7a6e69]">
              NO ACTIVE ALLOCATIONS IN BAG.
              <br />
              <br />
              <a href="/catalog" className="mt-2 inline-block rounded-full bg-[#0a0a0a] px-4 py-2 text-[11px] text-white no-underline">
                EXPLORE CATALOG →
              </a>
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item.reservationId} className="mb-4 rounded-xl border border-[#e2cecb] bg-[#fff1ec] p-4">
                <div className="flex items-start gap-3.5">
                  <img src={item.image} alt={item.title} className="h-[72px] w-[72px] rounded-lg border border-[#d8c3bc] object-cover" />
                  <div className="flex-1">
                    <span className="block font-['Space_Grotesk'] text-[9px] font-bold uppercase tracking-[0.1em] text-[#844c38]">Edition allocation</span>
                    <h4 className="mb-1 mt-0.5 text-sm font-bold">{item.title}</h4>
                    <p className="text-[11px] text-[#7a6e69]">{item.designerLine}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="rounded bg-[#0a0a0a] px-1.5 py-0.5 font-['Space_Grotesk'] text-[10px] text-white">{item.edition}</span>
                      <span className="font-['Space_Grotesk'] text-[13px] font-bold">{item.price.primary}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-dashed border-[#d8c3bc] pt-2.5 text-[10.5px] text-[#554b47]">
                  <span>Provenance token: <strong>XB-PROV-{item.sku}</strong></span>
                  <button type="button" disabled={busy} className="font-['Space_Grotesk'] uppercase tracking-wider text-[#7a6e69] underline" onClick={() => remove(item.reservationId)}>
                    Release
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.count > 0 && cart.totals && (
          <div className="border-t border-[#d8c3bc] bg-[#fff1ec] px-6 py-5">
            <div className="mb-2 flex justify-between font-['Space_Grotesk'] text-[11px] uppercase tracking-[0.06em] text-[#7a6e69]">
              <span>Atelier white-glove crate</span>
              <span className="font-semibold text-[#0a0a0a]">Complimentary</span>
            </div>
            <div className="mb-4 flex justify-between text-sm font-bold">
              <span className="font-['Space_Grotesk'] uppercase tracking-[0.06em]">Total acquisition</span>
              <span className="text-right font-['Space_Grotesk']">
                {cart.totals.primary}
                {cart.totals.usd && cart.totals.toman && <span className="block text-[11px] font-normal text-[#7a6e69]">{cart.totals.toman}</span>}
              </span>
            </div>
            <a href="/checkout" className="block w-full rounded-full bg-[#0a0a0a] px-4 py-3.5 text-center font-['Space_Grotesk'] text-[11px] font-bold uppercase tracking-[0.1em] text-[#fff8f6] no-underline">
              Proceed to allocation checkout →
            </a>
          </div>
        )}
      </aside>
    </>
  );
}
