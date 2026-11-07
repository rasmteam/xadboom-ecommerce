import { InlineNotes, InlineSelect } from "@/components/admin/actions";
import { AdminPage, FilterBar, Pager, range, Stat, StatGrid, Tab, TableCard, Td, Tr, when } from "@/components/admin/ui";
import { api } from "@/lib/api";
import type { AdminInquiries, InquiryStatus } from "@/lib/admin-types";

const STATUS: { value: InquiryStatus; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "ACTIVE_REVIEW", label: "Active review" },
  { value: "TRIAGE_PASSED", label: "Triage passed" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "CLOSED", label: "Closed" },
];

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; assignee?: string; search?: string; page?: string }>;
}) {
  const { status, type, assignee, search, page } = await searchParams;
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries({ status, type, assignee, search })) if (v) q.set(k, v);
  q.set("page", String(Math.max(1, Number(page) || 1)));
  const data = await api.adminGet<AdminInquiries>(`/admin/inquiries?${q}`);
  const r = range(data.page, 8, data.rows.length, data.total);
  const count = (t: string) => data.types.find((x) => x.type === t)?.count ?? 0;
  const staffOptions = [{ value: "", label: "Unassigned" }, ...data.staff.map((s) => ({ value: s.id, label: s.name }))];

  return (
    <AdminPage
      crumb="Intake & Inquiries"
      title="Curatorial Inquiries & Client Form Submissions"
      subtitle="Central intake ledger for bespoke commission requests, private viewings, acquisition inquiries and trade specification requests."
    >
      <StatGrid>
        <Stat label="Total Inquiries" icon="inbox" value={data.stats.total} unit="Submissions" left={`${data.stats.open} OPEN`} />
        <Stat label="Private Viewings" icon="calendar_month" value={String(count("Private Viewing Request")).padStart(2, "0")} unit="Requests" left="SALON APPOINTMENTS" />
        <Stat label="Bespoke Commissions" icon="architecture" value={String(count("Bespoke Architectural Commission")).padStart(2, "0")} unit="Requests" left="PENDING CURATORIAL REVIEW" />
        <Stat label="Unassigned" icon="person_search" value={String(data.stats.unassigned).padStart(2, "0")} unit="Open, no curator" left="NEEDS AN OWNER" />
      </StatGrid>

      <FilterBar
        action="/admin/inquiries"
        search={search}
        placeholder="Search client, email, project or message…"
        selects={[
          { name: "status", label: "Status", value: status, all: "All Statuses", options: STATUS },
          { name: "type", label: "Type", value: type, all: "All Types", options: data.types.map((t) => ({ value: t.type, label: `${t.type} (${t.count})` })) },
          { name: "assignee", label: "Curator", value: assignee, all: "All Curators", options: [{ value: "none", label: "Unassigned" }, ...data.staff.map((s) => ({ value: s.id, label: s.name }))] },
        ]}
      />

      <TableCard
        tabs={
          <div className="flex items-center gap-1 flex-wrap">
            <Tab href="/admin/inquiries" active={!status}>{`All Submissions (${data.stats.total})`}</Tab>
            {STATUS.map((s) => (
              <Tab key={s.value} href={`/admin/inquiries?status=${s.value}`} active={status === s.value}>
                {`${s.label} (${data.stats.byStatus[s.value] ?? 0})`}
              </Tab>
            ))}
          </div>
        }
        head={[
          { label: "Inquirer & Studio Entity" },
          { label: "Type / Intent" },
          { label: "Referenced Asset" },
          { label: "Message & Notes" },
          { label: "Date & SLA" },
          { label: "Status & Curator" },
        ]}
        empty={data.rows.length === 0 ? "No inquiries match these filters." : undefined}
        footer={<Pager base="/admin/inquiries" query={{ status, type, assignee, search }} page={data.page} pages={data.pages} from={r.from} to={r.to} total={data.total} noun="Inquiries" />}
      >
        {data.rows.map((i) => (
          <Tr key={i.id}>
            <Td>
              <div className="flex flex-col">
                <span className="text-primary font-medium text-[13px]">{i.client}</span>
                <a className="text-on-surface-variant text-[12px] underline" href={`mailto:${i.email}`}>
                  {i.email}
                </a>
                {i.project && <span className="text-on-surface-variant font-curatorial-quote italic text-[12px] leading-tight">{i.project}</span>}
              </div>
            </Td>
            <Td>
              <span className="font-label-caps text-[10px] tracking-wider uppercase text-primary">{i.type}</span>
              <div className="font-label-caps text-[10px] text-on-surface-variant tracking-wider">{i.number}</div>
            </Td>
            <Td>
              {i.piece ? (
                <div className="flex flex-col">
                  <a className="text-primary font-medium text-[13px] underline" href={`/product/${i.piece.slug}`}>
                    {i.piece.title}
                  </a>
                  <span className="text-on-surface-variant text-[12px]">{i.piece.designer}</span>
                </div>
              ) : (
                <span className="text-on-surface-variant text-[12px]">General inquiry</span>
              )}
            </Td>
            <Td>
              <p className="text-on-surface text-[12px] leading-snug max-w-sm mb-2 whitespace-pre-line">{i.message}</p>
              <InlineNotes url={`/api/admin/inquiries/${i.id}`} value={i.notes ?? ""} />
            </Td>
            <Td>
              <div className="flex flex-col">
                <span className="font-label-caps text-[10px] text-on-surface-variant tracking-wider">{when(i.createdAt)}</span>
                {i.slaMinutes !== null && (
                  <span className={`font-label-caps text-[10px] tracking-wider ${i.slaMinutes < 0 ? "text-error font-semibold" : "text-secondary"}`}>
                    {i.slaMinutes < 0 ? `SLA breached ${Math.abs(i.slaMinutes)}m ago` : `SLA ${Math.floor(i.slaMinutes / 60)}h ${i.slaMinutes % 60}m left`}
                  </span>
                )}
              </div>
            </Td>
            <Td>
              <div className="flex flex-col gap-2">
                <InlineSelect url={`/api/admin/inquiries/${i.id}`} field="status" value={i.status} options={STATUS} />
                <InlineSelect url={`/api/admin/inquiries/${i.id}`} field="assigneeId" value={i.assignee?.id ?? ""} options={staffOptions} />
              </div>
            </Td>
          </Tr>
        ))}
      </TableCard>
    </AdminPage>
  );
}
