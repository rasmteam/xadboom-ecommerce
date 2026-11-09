import { OverviewAdminPage, type Hold } from "@/components/admin/pages/overview-page";
import { api } from "@/lib/api";
import type { AdminOverview, AdminUsers } from "@/lib/admin-types";
import type { AdminPieces } from "@/lib/types";

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view: v } = await searchParams;
  const view = v === "reserved" || v === "low" ? v : "all";
  const [o, holds, data, users] = await Promise.all([
    api.adminGet<AdminOverview>("/admin/overview"),
    api.adminGet<Hold[]>("/admin/holds"),
    api.adminGet<AdminPieces>(`/admin/pieces?page=1${view === "all" ? "" : `&status=${view}`}`),
    api.adminGet<AdminUsers>("/admin/users?page=1"),
  ]);
  return <OverviewAdminPage o={o} holds={holds} data={data} users={users} view={view} />;
}
