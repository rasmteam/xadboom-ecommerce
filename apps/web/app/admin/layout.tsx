import { logout } from "../login/actions";
import { requireStaff } from "@/lib/dal";

// Always evaluated per request: never cache an authenticated shell.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();

  // Placeholder shell; the real admin layout is ported from legacy/ in Phase 4.
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-[#d8c3bc] px-6 py-3">
        <span className="font-mono text-xs uppercase tracking-widest">Atelier Admin</span>
        <form action={logout} className="flex items-center gap-3 text-sm">
          <span className="text-[#7a6e69]">
            {user.name} · {user.role}
          </span>
          <button className="underline">Sign out</button>
        </form>
      </header>
      {children}
    </div>
  );
}
