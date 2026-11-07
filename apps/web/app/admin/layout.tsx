import { redirect } from "next/navigation";
import { api } from "@/lib/api";

// Always evaluated per request: never cache an authenticated shell.
export const dynamic = "force-dynamic";

export const metadata = { title: "Atelier Admin — Xadboom", robots: { index: false, follow: false } };

// Gate only: each admin screen renders its own sidebar/header, exactly as in the original design.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await api.me();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN" && user.role !== "EDITOR") redirect("/login?error=forbidden");
  return children;
}
