import Link from "next/link";
import { ApiButton } from "@/components/admin/actions";
import { AdminPage, btnGhost, chip, Stat, StatGrid, TableCard, Td, Tr, when } from "@/components/admin/ui";
import { HoldsClock } from "@/components/admin/holds-clock";
import { api } from "@/lib/api";
import type { AdminOverview } from "@/lib/admin-types";

type Hold = { id: string; title: string; sku: string; edition: string; remainingSeconds: number; session: string };

export default async function AdminHome() {
  const [o, holds] = await Promise.all([api.adminGet<AdminOverview>("/admin/overview"), api.adminGet<Hold[]>("/admin/holds")]);

  return (
    <AdminPage
      crumb="Overview"
      title="Master Piece Inventory & Reservation Ledger"
      subtitle="Live view of the catalog, collector holds, orders and inquiries across the atelier."
    >
      <StatGrid>
        <Stat label="Curated Pieces" icon="chair" value={o.pieces} unit="Published" left={`${o.units.available} UNITS AVAILABLE`} right={`${o.units.sold} PLACED`} />
        <Stat label="Active Client Reservations" icon="lock_clock" value={String(o.activeHolds).padStart(2, "0")} unit="Active locks" left="15-MIN AUTO-RELEASE" right={`${o.units.reserved} HELD`} />
        <Stat label="Orders & Dispatches" icon="local_shipping" value={o.revenue.orders} unit="Paid orders" left={`${o.pendingOrders} AWAITING PAYMENT`} right={o.revenue.usd} />
        <Stat label="Open Inquiries" icon="inbox" value={String(o.openInquiries).padStart(2, "0")} unit="To answer" left={o.slaRisk ? `${o.slaRisk} SLA AT RISK` : "ALL WITHIN SLA"} />
      </StatGrid>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TableCard
          head={[{ label: "Live Cart Holds" }, { label: "Edition" }, { label: "Time Left" }, { label: "Actions", right: true }]}
          empty={holds.length === 0 ? "No pieces are being held right now." : undefined}
        >
          {holds.map((h) => (
            <Tr key={h.id}>
              <Td>
                <div className="flex flex-col">
                  <span className="text-primary font-medium text-[13px]">{h.title}</span>
                  <span className="font-label-caps text-[10px] text-on-surface-variant tracking-wider">{h.sku} · session {h.session}</span>
                </div>
              </Td>
              <Td>{h.edition}</Td>
              <Td>
                <HoldsClock seconds={h.remainingSeconds} />
              </Td>
              <Td right>
                <ApiButton url={`/api/admin/holds/${h.id}/release`} className={btnGhost} confirm="Release this hold back to inventory?">
                  Release Hold
                </ApiButton>
              </Td>
            </Tr>
          ))}
        </TableCard>

        <TableCard
          head={[{ label: "Recent Orders" }, { label: "Collector" }, { label: "Status" }, { label: "Value", right: true }]}
          empty={o.recentOrders.length === 0 ? "No orders yet." : undefined}
        >
          {o.recentOrders.map((r) => (
            <Tr key={r.id}>
              <Td>
                <div className="flex flex-col">
                  <span className="text-primary font-medium text-[13px]">#{r.number.replace("XB-DISPATCH-", "XB-")}</span>
                  <span className="font-label-caps text-[10px] text-on-surface-variant tracking-wider">{when(r.createdAt)}</span>
                </div>
              </Td>
              <Td>{r.collectorName}</Td>
              <Td>
                <span className={chip}>{r.status.replace("_", " ")}</span>
              </Td>
              <Td right>
                <span className="font-headline-sm text-[14px] font-semibold text-primary">{r.total}</span>
              </Td>
            </Tr>
          ))}
        </TableCard>
      </div>

      <div className="mt-6">
        <TableCard
          head={[{ label: "Recent Inquiries" }, { label: "Type" }, { label: "Status" }, { label: "Received", right: true }]}
          empty={o.recentInquiries.length === 0 ? "No inquiries yet." : undefined}
        >
          {o.recentInquiries.map((i) => (
            <Tr key={i.id}>
              <Td>
                <div className="flex flex-col">
                  <span className="text-primary font-medium text-[13px]">{i.client}</span>
                  <span className="font-label-caps text-[10px] text-on-surface-variant tracking-wider">{i.number}</span>
                </div>
              </Td>
              <Td>{i.type}</Td>
              <Td>
                <span className={chip}>{i.status.replace("_", " ")}</span>
              </Td>
              <Td right>
                <span className="font-label-caps text-[10px] text-on-surface-variant tracking-wider">{when(i.createdAt)}</span>
              </Td>
            </Tr>
          ))}
        </TableCard>
        <p className="mt-4 font-label-caps text-[10px] tracking-wider text-on-surface-variant uppercase">
          <Link className="underline" href="/admin/inquiries">Open the inquiry ledger</Link> · <Link className="underline" href="/admin/orders">Open orders</Link>
        </p>
      </div>
    </AdminPage>
  );
}
