import { notFound } from "next/navigation";
import { AdminPage } from "@/components/admin/ui";
import { DesignerForm } from "@/components/admin/designer-form";
import { api } from "@/lib/api";
import type { AdminDesigner } from "@/lib/admin-types";

export default async function EditDesignerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await api.adminGet<AdminDesigner[]>("/admin/designers");
  const designer = rows.find((d) => d.id === id);
  if (!designer) notFound();
  return (
    <AdminPage crumb="Designers & Collaborators" title={designer.name} subtitle="Edit the dossier shown on the storefront designers and home pages.">
      <DesignerForm key={designer.id} designer={designer} />
    </AdminPage>
  );
}
