import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { LogoutButton } from "./logout-button";

// Always evaluated per request: never cache an authenticated shell.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await api.me();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN" && user.role !== "EDITOR") redirect("/login?error=forbidden");

  // Placeholder shell; the real admin layout is ported from legacy/ in the admin phase.
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-[#d8c3bc] px-6 py-3">
        <span className="font-mono text-xs uppercase tracking-widest">Atelier Admin</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-[#7a6e69]">
            {user.name} · {user.role}
          </span>
          <LogoutButton />
        </div>
      </header>
      {children}
    </div>
  );
}
