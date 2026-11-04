import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { api } from "@/lib/api";

// Always evaluated per request: never cache an authenticated shell.
export const dynamic = "force-dynamic";

export const metadata = { title: "Atelier Admin — Xadboom", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await api.me();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN" && user.role !== "EDITOR") redirect("/login?error=forbidden");
  return <AdminShell user={user}>{children}</AdminShell>;
}
