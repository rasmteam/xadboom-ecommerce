import { AdminShell } from "@/components/admin/admin-shell";
import { api } from "@/lib/api";

// Screens that share the common sidebar/header (the ones converted from the Pieces Catalog layout).
export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const user = (await api.me())!; // the parent layout already redirects anonymous visitors
  return <AdminShell user={user}>{children}</AdminShell>;
}
