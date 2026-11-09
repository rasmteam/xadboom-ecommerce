import { CategoriesAdminPage } from "@/components/admin/pages/categories-page";
import { api } from "@/lib/api";
import type { AdminCategory } from "@/lib/admin-types";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const all = await api.adminGet<AdminCategory[]>("/admin/categories");
  return <CategoriesAdminPage all={all} q={q || undefined} />;
}
