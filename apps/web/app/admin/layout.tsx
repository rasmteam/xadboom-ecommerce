import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { adminShell, api } from "@/lib/api";

// Always evaluated per request: never cache an authenticated shell.
export const dynamic = "force-dynamic";

export const metadata = { title: "Atelier Admin — Xadboom", robots: { index: false, follow: false } };

// One shell for every admin screen (sidebar rail + header), so the admin looks the same on every page.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await api.me();
  if (!me) redirect("/login");
  if (me.role !== "ADMIN" && me.role !== "EDITOR") redirect("/login?error=forbidden");
  const { user, counts } = await adminShell();
  return (
    <AdminShell user={user} counts={counts}>
      {children}
    </AdminShell>
  );
}
