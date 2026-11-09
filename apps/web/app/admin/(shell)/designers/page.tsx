import { DesignersAdminPage } from "@/components/admin/pages/designers-page";
import { api } from "@/lib/api";
import type { AdminDesigner } from "@/lib/admin-types";

export default async function Page({ searchParams }: { searchParams: Promise<{ view?: string; discipline?: string; sort?: string }> }) {
  const { view, discipline, sort } = await searchParams;
  const all = await api.adminGet<AdminDesigner[]>("/admin/designers");
  const v = (["pieces", "published", "hidden"].includes(view ?? "") ? view : "all") as "all" | "pieces" | "published" | "hidden";
  return <DesignersAdminPage all={all} view={v} discipline={discipline || undefined} sort={sort ?? "pieces"} />;
}
