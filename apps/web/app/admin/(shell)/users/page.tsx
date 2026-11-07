import Link from "next/link";
import { redirect } from "next/navigation";
import { ApiButton, InlineSelect } from "@/components/admin/actions";
import { AdminPage, btnGhost, btnPrimary, FilterBar, Pager, range, Stat, StatGrid, TableCard, Td, Tr, when } from "@/components/admin/ui";
import { api } from "@/lib/api";
import type { AdminUsers } from "@/lib/admin-types";

const ROLES = [
  { value: "ADMIN", label: "Administrator" },
  { value: "EDITOR", label: "Curator / Editor" },
  { value: "COLLECTOR", label: "Collector" },
];
const KYC = [
  { value: "UNVERIFIED", label: "Unverified" },
  { value: "PENDING", label: "Pending review" },
  { value: "VERIFIED", label: "Verified identity" },
];

export default async function UsersAdminPage({ searchParams }: { searchParams: Promise<{ role?: string; kyc?: string; search?: string; page?: string }> }) {
  const me = await api.me();
  if (me?.role !== "ADMIN") redirect("/admin?error=forbidden"); // staff accounts are managed by administrators only
  const { role, kyc, search, page } = await searchParams;
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries({ role, kyc, search })) if (v) q.set(k, v);
  q.set("page", String(Math.max(1, Number(page) || 1)));
  const data = await api.adminGet<AdminUsers>(`/admin/users?${q}`);
  const r = range(data.page, 8, data.rows.length, data.total);

  return (
    <AdminPage
      crumb="Users & Collector Accounts"
      title="Patron, Collector & Staff Accounts"
      subtitle="Registry of staff and collectors: roles, tiers, identity verification and acquisition history."
      actions={
        <Link href="/admin/users/new" className={btnPrimary}>
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span>+ Register Account</span>
        </Link>
      }
    >
      <StatGrid>
        <Stat label="Total Accounts" icon="groups" value={data.stats.total} unit="Registered" />
        <Stat label="Staff" icon="badge" value={String(data.stats.staff).padStart(2, "0")} unit="Admins & curators" left="CAN SIGN IN TO ADMIN" />
        <Stat label="Patrons & Collectors" icon="verified" value={data.stats.collectors} unit="Private patrons" />
        <Stat label="Verified Identity" icon="verified_user" value={data.stats.verified} unit="KYC complete" />
      </StatGrid>

      <FilterBar
        action="/admin/users"
        search={search}
        placeholder="Search name, studio or email…"
        selects={[
          { name: "role", label: "Role", value: role, all: "All Roles", options: ROLES },
          { name: "kyc", label: "KYC", value: kyc, all: "Any Status", options: KYC },
        ]}
      />

      <TableCard
        head={[{ label: "User & Studio Entity" }, { label: "Role & Tier" }, { label: "Verification & KYC" }, { label: "Regional Hub" }, { label: "Acquisitions" }, { label: "Last Activity" }, { label: "Actions", right: true }]}
        empty={data.rows.length === 0 ? "No accounts match these filters." : undefined}
        footer={<Pager base="/admin/users" query={{ role, kyc, search }} page={data.page} pages={data.pages} from={r.from} to={r.to} total={data.total} noun="Accounts" />}
      >
        {data.rows.map((u) => (
          <Tr key={u.id}>
            <Td>
              <div className="flex flex-col">
                <span className="text-primary font-medium text-[13px]">{u.name}</span>
                {u.studio && <span className="text-on-surface-variant font-curatorial-quote italic text-[12px]">{u.studio}</span>}
                <span className="text-on-surface-variant text-[12px]">{u.email}</span>
              </div>
            </Td>
            <Td>
              <div className="flex flex-col gap-2">
                <InlineSelect url={`/api/admin/users/${u.id}`} field="role" value={u.role} options={ROLES} />
                <span className="font-label-caps text-[10px] text-on-surface-variant tracking-wider">{u.tier ?? "No tier"}</span>
              </div>
            </Td>
            <Td>
              <InlineSelect url={`/api/admin/users/${u.id}`} field="kycStatus" value={u.kycStatus} options={KYC} />
            </Td>
            <Td>
              <span className="text-primary text-[13px]">{u.regionHub ?? "—"}</span>
            </Td>
            <Td>
              <span className="font-headline-sm text-[14px] font-semibold text-primary">{String(u.orders).padStart(2, "0")} Orders</span>
            </Td>
            <Td>
              <span className="font-label-caps text-[10px] text-on-surface-variant tracking-wider">{u.lastActiveAt ? when(u.lastActiveAt) : "Never signed in"}</span>
            </Td>
            <Td right>
              {u.id !== me.id && (
                <ApiButton url={`/api/admin/users/${u.id}`} method="DELETE" className={btnGhost} confirm={`Delete the account of ${u.name}?`}>
                  Delete
                </ApiButton>
              )}
            </Td>
          </Tr>
        ))}
      </TableCard>
    </AdminPage>
  );
}
