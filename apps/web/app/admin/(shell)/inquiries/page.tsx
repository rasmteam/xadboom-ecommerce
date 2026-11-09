import { InquiriesAdminPage } from "@/components/admin/pages/inquiries-page";
import { api } from "@/lib/api";
import type { AdminInquiries } from "@/lib/admin-types";

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
  return <InquiriesAdminPage data={data} filters={{ status, type, assignee, search }} />;
}
