import { notFound, redirect } from "next/navigation";
import { EntityForm } from "@/components/admin/entity-form";
import { AdminPage } from "@/components/admin/ui";
import { api } from "@/lib/api";

type U = { id: string; name: string; email: string; studio: string | null; role: string; tier: string | null; kycStatus: string; regionHub: string | null; phone: string | null };

export default async function UserDossier({ params }: { params: Promise<{ id: string }> }) {
  const me = await api.me();
  if (me?.role !== "ADMIN") redirect("/admin?error=forbidden");
  const { id } = await params;
  const u = await api.adminGet<U>(`/admin/users/${encodeURIComponent(id)}`).catch(() => null);
  if (!u) notFound();
  return (
    <AdminPage crumb="Users & Collector Accounts" title={u.name} subtitle={`${u.email} · edit role, tier, identity verification and region.`}>
      <EntityForm
        key={u.id}
        fields={[
          { name: "name", label: "Full name", type: "text", required: true },
          { name: "studio", label: "Studio / entity", type: "text" },
          { name: "role", label: "Role", type: "select", options: [{ value: "COLLECTOR", label: "Collector" }, { value: "EDITOR", label: "Curator / Editor (admin access)" }, { value: "ADMIN", label: "Administrator (full access)" }] },
          { name: "tier", label: "Account tier", type: "text", hint: 'e.g. "Private Collector (VIP)"' },
          { name: "kycStatus", label: "Identity verification", type: "select", options: [{ value: "UNVERIFIED", label: "Unverified" }, { value: "PENDING", label: "Pending review" }, { value: "VERIFIED", label: "Verified identity" }] },
          { name: "regionHub", label: "Regional hub", type: "text", hint: 'e.g. "Geneva, Switzerland"' },
          { name: "phone", label: "Telephone", type: "text" },
        ]}
        initial={{ name: u.name, studio: u.studio ?? "", role: u.role, tier: u.tier ?? "", kycStatus: u.kycStatus, regionHub: u.regionHub ?? "", phone: u.phone ?? "" }}
        submitUrl={`/api/admin/users/${u.id}`}
        method="PATCH"
        backHref="/admin/users"
        submitLabel="Save account"
        deleteUrl={u.id === me.id ? undefined : `/api/admin/users/${u.id}`}
      />
    </AdminPage>
  );
}
