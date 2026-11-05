import type { Metadata } from "next";
import { CheckoutPage } from "@/components/cart/checkout";

export const metadata: Metadata = { title: "Allocation Checkout — Xadboom", robots: { index: false, follow: false } };

export default function Page() {
  return <CheckoutPage />;
}
