import { ApiButton } from "@/components/admin/actions";
import { AdminPage, btnGhost, btnSolid, chip, FilterBar, Pager, range, Stat, StatGrid, Tab, TableCard, Td, Tr, when } from "@/components/admin/ui";
import { api } from "@/lib/api";
import type { AdminOrders, OrderStatus } from "@/lib/admin-types";

const LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  PAID: "Paid · to crate",
  IN_CRATING: "Crating",
  DISPATCHED: "In transit",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};
const ICON: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "lock_clock",
  PAID: "payments",
  IN_CRATING: "inventory_2",
  DISPATCHED: "flight_takeoff",
  DELIVERED: "check_circle",
  CANCELLED: "block",
  REFUNDED: "undo",
};

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; search?: string; page?: string }> }) {
  const { status, search, page } = await searchParams;
  const q = new URLSearchParams();
  if (status) q.set("status", status);
  if (search) q.set("search", search);
  q.set("page", String(Math.max(1, Number(page) || 1)));
  const data = await api.adminGet<AdminOrders>(`/admin/orders?${q}`);
  const r = range(data.page, 8, data.rows.length, data.total);
  const tab = (s: string | undefined, label: string, n: number) => (
    <Tab href={s ? `/admin/orders?status=${s}` : "/admin/orders"} active={status === s}>
      {`${label} (${n})`}
    </Tab>
  );

  return (
    <AdminPage
      crumb="Orders & Dispatches"
      title="Orders, Custom Crating & International Dispatches"
      subtitle="Payment confirmation, museum crate staging, sealed provenance releases and white-glove deliveries."
    >
      <StatGrid>
        <Stat label="Total Fulfilled Orders" icon="verified" value={data.counts.delivered} unit="Orders Cleared" left={data.volume.usd} right={data.volume.toman} />
        <Stat label="Active Dispatches" icon="flight_takeoff" value={String(data.counts.dispatched).padStart(2, "0")} unit="In Transit" left="IN FLIGHT / OCEAN / ROAD" />
        <Stat label="Crate Staging & Prep" icon="inventory_2" value={String(data.counts.paid + data.counts.crating).padStart(2, "0")} unit="To Crate" left="PAID, AWAITING CRATING" />
        <Stat label="Awaiting Payment" icon="lock_clock" value={String(data.counts.pending).padStart(2, "0")} unit="Held Editions" left="UNITS HELD UNTIL PAID" />
      </StatGrid>

      <FilterBar
        action="/admin/orders"
        search={search}
        placeholder="Search by order number, collector, email or city…"
        selects={[{ name: "status", label: "Status", value: status, all: "All Orders", options: Object.entries(LABEL).map(([value, label]) => ({ value, label })) }]}
      />

      <TableCard
        tabs={
          <div className="flex items-center gap-1 flex-wrap">
            {tab(undefined, "All Orders", data.counts.all)}
            {tab("PENDING_PAYMENT", "Awaiting Payment", data.counts.pending)}
            {tab("PAID", "To Crate", data.counts.paid)}
            {tab("IN_CRATING", "Crating", data.counts.crating)}
            {tab("DISPATCHED", "In Transit", data.counts.dispatched)}
            {tab("DELIVERED", "Delivered", data.counts.delivered)}
          </div>
        }
        head={[
          { label: "Order ID & Date" },
          { label: "Curated Piece & Edition" },
          { label: "Patron / Collector" },
          { label: "Destination" },
          { label: "Crating & Logistics Status" },
          { label: "Value" },
          { label: "Actions", right: true },
        ]}
        empty={data.rows.length === 0 ? "No orders match these filters yet." : undefined}
        footer={<Pager base="/admin/orders" query={{ status, search }} page={data.page} pages={data.pages} from={r.from} to={r.to} total={data.total} noun="Orders" />}
      >
        {data.rows.map((o) => (
          <Tr key={o.id}>
            <Td>
              <div className="flex flex-col">
                <span className="font-headline-sm text-[14px] font-semibold text-primary">#{o.number.replace("XB-DISPATCH-", "XB-")}</span>
                <span className="font-label-caps text-[10px] text-on-surface-variant tracking-wider">{when(o.createdAt)}</span>
                {o.trackingRef && <span className="font-label-caps text-[10px] text-on-surface-variant tracking-wider">WAYBILL {o.trackingRef}</span>}
              </div>
            </Td>
            <Td>
              <div className="flex flex-col gap-1">
                {o.items.map((i) => (
                  <div key={i.sku} className="flex flex-col">
                    <span className="text-primary font-medium text-[13px]">{i.title}</span>
                    <span className="font-label-caps text-[10px] text-on-surface-variant tracking-wider">
                      Ed. {i.edition} · {i.sku}
                    </span>
                  </div>
                ))}
              </div>
            </Td>
            <Td>
              <div className="flex flex-col">
                <span className="text-primary font-medium text-[13px]">{o.collectorName}</span>
                <span className="text-on-surface-variant text-[12px]">{o.collectorEmail}</span>
              </div>
            </Td>
            <Td>
              <div className="flex flex-col">
                <span className="flex items-center gap-1 text-primary text-[13px]">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  {o.destination}
                </span>
                <span className="font-label-caps text-[10px] text-on-surface-variant tracking-wider">{o.carrier ?? "Carrier not assigned"}</span>
              </div>
            </Td>
            <Td>
              <div className="flex flex-col gap-1">
                <span className={chip}>
                  <span className="material-symbols-outlined text-[15px]">{ICON[o.status]}</span>
                  {LABEL[o.status]}
                </span>
                {o.crateStatus && <span className="font-label-caps text-[10px] text-on-surface-variant tracking-wider">{o.crateStatus}</span>}
                {o.status === "PENDING_PAYMENT" && o.provider && <span className="font-label-caps text-[10px] text-on-surface-variant tracking-wider">via {o.provider}</span>}
              </div>
            </Td>
            <Td>
              <span className="font-headline-sm text-[14px] font-semibold text-primary">{o.total}</span>
            </Td>
            <Td right>
              <div className="flex items-center justify-end gap-2 flex-wrap">
                {o.status === "PENDING_PAYMENT" && (
                  <>
                    <ApiButton url={`/api/admin/orders/${o.id}/mark-paid`} className={btnSolid} confirm={`Mark ${o.number} as paid? The edition will be sold.`}>
                      Mark paid
                    </ApiButton>
                    <ApiButton url={`/api/admin/orders/${o.id}/cancel`} className={btnGhost} confirm={`Cancel ${o.number} and release the held editions?`}>
                      Cancel
                    </ApiButton>
                  </>
                )}
                {o.status === "PAID" && (
                  <ApiButton url={`/api/admin/orders/${o.id}/fulfil`} body={{ status: "IN_CRATING", crateStatus: "Timber crate assembly" }} className={btnSolid}>
                    Stage crate
                  </ApiButton>
                )}
                {o.status === "IN_CRATING" && (
                  <ApiButton url={`/api/admin/orders/${o.id}/fulfil`} body={{ status: "DISPATCHED", crateStatus: "In transit" }} className={btnSolid}>
                    Dispatch
                  </ApiButton>
                )}
                {o.status === "DISPATCHED" && (
                  <ApiButton url={`/api/admin/orders/${o.id}/fulfil`} body={{ status: "DELIVERED", crateStatus: "Delivered" }} className={btnSolid}>
                    Mark delivered
                  </ApiButton>
                )}
              </div>
            </Td>
          </Tr>
        ))}
      </TableCard>
    </AdminPage>
  );
}
