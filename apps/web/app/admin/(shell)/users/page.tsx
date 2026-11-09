import { redirect } from "next/navigation";
import { UsersAdminPage } from "@/components/admin/pages/users-page";
import { api } from "@/lib/api";
import type { AdminUsers } from "@/lib/admin-types";

export default async function Page({ searchParams }: { searchParams: Promise<{ view?: string; search?: string; role?: string; kyc?: string; hub?: string; sort?: string; page?: string }> }) {
  const me = await api.me();
  if (me?.role !== "ADMIN") redirect("/admin?error=forbidden"); // accounts are managed by administrators only
  const { view, search, role, kyc, hub, sort, page } = await searchParams;
  const v = (["verified", "collectors", "staff", "pending"].includes(view ?? "") ? view : "all") as "all" | "verified" | "collectors" | "staff" | "pending";
  const q = new URLSearchParams();
  for (const [k, val] of Object.entries({ view: v === "all" ? "" : v, search, role, kyc, hub, sort })) if (val) q.set(k, val);
  q.set("page", String(Math.max(1, Number(page) || 1)));
  const data = await api.adminGet<AdminUsers>(`/admin/users?${q}`);
  return <UsersAdminPage data={data} view={v} search={search} role={role} kyc={kyc} hub={hub} sort={sort ?? "recent"} />;
}
