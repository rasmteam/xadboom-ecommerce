"use client";

import { useCart } from "./cart-provider";

/** The header "Bag (n)" control. Same look as the original markup. */
export function BagButton({ className }: { className: string }) {
  const { cart, setOpen } = useCart();
  return (
    <button className={className} type="button" onClick={() => setOpen(true)} aria-label={`Open bag, ${cart.count} item${cart.count === 1 ? "" : "s"}`}>
      <span className="">Bag</span>
      <span className="text-[#78716C] font-mono">({cart.count})</span>
    </button>
  );
}

/** Reserve the next free numbered edition of a piece, then open the bag. */
export function AcquireButton({
  slug,
  className,
  disabled,
  children,
}: {
  slug: string;
  className: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const { add, busy } = useCart();
  return (
    <button type="button" className={className} disabled={disabled || busy} onClick={() => void add(slug)}>
      {children}
    </button>
  );
}
