import { AdminPiecesPage } from "@/components/admin/pieces-page";
import { api } from "@/lib/api";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; designer?: string; status?: string; page?: string }>;
}) {
  const { page, ...query } = await searchParams;
  const data = await api.adminPieces({ ...query, page: Math.max(1, Number(page) || 1) });
  return <AdminPiecesPage data={data} query={query} />;
}
