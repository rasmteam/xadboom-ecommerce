import { notFound } from "next/navigation";
import { AdminPage } from "@/components/admin/ui";
import { CategoryForm } from "@/components/admin/category-form";
import { api } from "@/lib/api";
import type { AdminCategory } from "@/lib/admin-types";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await api.adminGet<AdminCategory[]>("/admin/categories");
  const category = rows.find((c) => c.id === id);
  if (!category) notFound();
  return (
    <AdminPage crumb="Categories & Typologies" title={category.name} subtitle="Edit this typology. A typology that still has pieces cannot be deleted.">
      <CategoryForm key={category.id} category={category} />
    </AdminPage>
  );
}
