import { OrdersShell } from "@/components/admin/shells/OrdersShell";
import { OrdersPage } from "@/components/admin/pages/orders-page";
import { adminShell, api } from "@/lib/api";
import type { AdminOrders } from "@/lib/admin-types";

export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string; carrier?: string; search?: string; page?: string }> }) {
  const { status, carrier, search, page } = await searchParams;
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries({ status, carrier, search })) if (v) q.set(k, v);
  q.set("page", String(Math.max(1, Number(page) || 1)));
  const [{ user, counts }, data] = await Promise.all([adminShell(), api.adminGet<AdminOrders>(`/admin/orders?${q}`)]);
  return (
    <OrdersShell user={user} counts={counts}>
      <OrdersPage data={data} status={status} carrier={carrier} search={search} />
    </OrdersShell>
  );
}
