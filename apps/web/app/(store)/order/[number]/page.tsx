import type { Metadata } from "next";
import { OrderPage } from "@/components/cart/order-page";
import { api } from "@/lib/api";

export const metadata: Metadata = { title: "Your Acquisition — Xadboom", robots: { index: false, follow: false } };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const [{ number }, { t }] = await Promise.all([params, searchParams]);
  const order = await api.order(number, t ?? "");
  return <OrderPage order={order} />;
}
