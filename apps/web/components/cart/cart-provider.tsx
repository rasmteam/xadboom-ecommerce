"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartData } from "@/lib/types";

type CartCtx = {
  cart: CartData;
  open: boolean;
  loaded: boolean;
  setOpen: (v: boolean) => void;
  secondsLeft: number;
  busy: boolean;
  error: string | null;
  add: (slug: string) => Promise<boolean>;
  remove: (reservationId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const EMPTY: CartData = { items: [], count: 0, totals: null, lockMinutes: 15 };
const Ctx = createContext<CartCtx | null>(null);

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside <CartProvider>");
  return c;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartData>(EMPTY);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (res.ok) setCart(await res.json());
    } catch {
      /* offline: keep what we have */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  // tick every second while there is something held
  useEffect(() => {
    if (!cart.count) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [cart.count]);

  const nextExpiry = useMemo(() => (cart.items.length ? Math.min(...cart.items.map((i) => new Date(i.expiresAt).getTime())) : 0), [cart.items]);
  const secondsLeft = nextExpiry ? Math.max(0, Math.floor((nextExpiry - now) / 1000)) : 0;

  // when a hold runs out, ask the server (it releases the unit and returns the real cart)
  useEffect(() => {
    if (cart.count && secondsLeft === 0) void refresh();
  }, [cart.count, secondsLeft, refresh]);

  const add = useCallback(async (slug: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/cart/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.message ?? "Could not reserve this piece");
        setOpen(true);
        return false;
      }
      setCart(json);
      setNow(Date.now());
      setOpen(true);
      return true;
    } finally {
      setBusy(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/cart/items/${id}`, { method: "DELETE" });
      if (res.ok) setCart(await res.json());
    } finally {
      setBusy(false);
    }
  }, []);

  return <Ctx.Provider value={{ cart, loaded, open, setOpen, secondsLeft, busy, error, add, remove, refresh }}>{children}</Ctx.Provider>;
}

export const fmtClock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
