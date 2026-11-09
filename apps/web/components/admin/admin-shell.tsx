"use client";
/* eslint-disable @next/next/no-img-element */
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { SessionUser } from "@/lib/types";
import { SignOutButton } from "./sign-out-button";
import type { ShellCounts } from "@/lib/admin-types";

const CRUMBS: [string, string[]][] = [
  ["/admin/pieces/new", ["Curatorial Atelier", "Administration", "Register New Curated Piece"]],
  ["/admin/pieces", ["Curatorial Atelier", "Administration", "Pieces Catalog"]],
  ["/admin/categories", ["Curatorial Atelier", "Administration", "Categories & Typologies"]],
  ["/admin/designers", ["Curatorial Atelier", "Administration", "Designers & Architectural Collaborators"]],
  ["/admin/orders", ["Curatorial Atelier", "Operations", "Orders & Master Dispatches"]],
  ["/admin/users", ["Curatorial Atelier", "Administration", "Users & Collector Accounts"]],
  ["/admin/inquiries", ["Curatorial Atelier", "Intake & Inquiries", "Form Submissions"]],
  ["/admin/settings", ["Curatorial Atelier", "Administration", "Settings"]],
  ["/admin", ["Curatorial Atelier", "Administration", "Atelier Master Ledger"]],
];

/** The single admin shell: sidebar rail + header, identical on every admin screen. */
export function AdminShell({ user, counts, children }: { user: SessionUser; counts: ShellCounts; children: ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const crumbs = (CRUMBS.find(([p]) => pathname === p || pathname.startsWith(p + "/")) ?? CRUMBS[CRUMBS.length - 1])[1];
  const initials = user.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "XB";
  const NAV = [
    { href: "/admin", icon: "grid_view", title: "Overview & Telemetry" },
    { href: "/admin/pieces", icon: "chair", title: "Pieces Catalog", badge: undefined as number | undefined },
    { href: "/admin/categories", icon: "category", title: "Categories & Typologies" },
    { href: "/admin/designers", icon: "architecture", title: "Designers & Collaborators" },
    { href: "/admin/orders", icon: "receipt_long", title: "Orders & Dispatches", badge: counts.ordersOpen },
    { href: "/admin/users", icon: "group", title: "Users & Accounts" },
    { href: "/admin/inquiries", icon: "mail", title: "Inquiries & Patron Requests", badge: counts.inquiriesOpen },
  ] as { href: string; icon: string; title: string; badge?: number }[];

  const item = "relative w-12 h-12 flex items-center justify-center transition-colors";
  return (
    <div className="theme-aOrders page-aOrders min-h-screen bg-[#F7E9E3] text-[#231A16] antialiased">
      <aside className="fixed left-0 top-0 h-full w-20 border-r border-[#ECDAD4] z-50 flex flex-col items-center py-6 bg-[#ECDAD4]">
        <a href="/admin" className="mb-8 flex flex-col items-center justify-center">
          <div className="w-10 h-10 bg-[#12100E] flex items-center justify-center"><span className="font-headline font-bold tracking-widest text-[#FAF4F0]">X</span></div>
          <span className="uppercase mt-1 tracking-widest text-[9px] text-[#635D5C] font-headline">ATELIER</span>
        </a>
        <nav className="flex-1 flex flex-col items-center gap-3 w-full px-2">
          {NAV.map((n) => {
            const on = isActive(n.href);
            return (
              <a key={n.href} href={n.href} title={n.title} aria-current={on ? "page" : undefined} className={`${item} ${on ? "bg-[#12100E] text-[#FAF4F0]" : "text-[#635D5C] hover:bg-[#dfcdc7] hover:text-[#231A16]"}`}>
                <span className="material-symbols-outlined text-[20px]">{n.icon}</span>
                {n.badge !== undefined && n.badge > 0 && <span className="absolute top-0.5 right-0.5 bg-[#9E7852] text-white text-[9px] font-headline font-bold px-1.5 rounded-full">{n.badge}</span>}
              </a>
            );
          })}
        </nav>
        <div className="flex flex-col items-center gap-3 w-full px-2 pt-4">
          <a href="/admin/settings" title="Settings" className={`${item} ${pathname.startsWith("/admin/settings") ? "bg-[#12100E] text-[#FAF4F0]" : "text-[#635D5C] hover:bg-[#dfcdc7] hover:text-[#231A16]"}`}>
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </a>
        </div>
      </aside>
      <header data-motion-header="" className="fixed top-0 left-20 right-0 h-16 border-b border-[#ECDAD4] backdrop-blur-md z-40 px-6 lg:px-8 flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.02)]" style={{ backgroundColor: "rgba(236, 218, 212, 0.95)" }}>
        <div className="flex items-center gap-2 font-headline text-[11px] uppercase tracking-widest text-[#635D5C]">
          {crumbs.map((c, i) => (
            <span key={i} className="contents">
              {i > 0 && <span className="text-[#B6ACA7]">/</span>}
              <span className={i === crumbs.length - 1 ? "text-[#12100E] font-semibold" : ""}>{c}</span>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-headline text-[10px] tracking-widest text-[#635D5C]"><span className="w-2 h-2 rounded-full bg-[#635D5C]" />VAULT CONNECTED</div>
          <div className="h-4 w-px bg-[#dfcdc7]" />
          <div className="flex items-center gap-2">
            <div className="flex flex-col text-right"><span className="font-headline text-[11px] tracking-wider font-semibold text-[#231A16] uppercase">{user.name}</span><span className="font-headline text-[9px] text-[#635D5C] uppercase">{user.role === "ADMIN" ? "Administrator" : "Editor"}</span></div>
            <div className="w-8 h-8 rounded-full bg-[#12100E] flex items-center justify-center"><span className="font-headline text-[10px] text-[#FAF4F0]">{initials}</span></div>
          </div>
          <SignOutButton />
        </div>
      </header>
      <div className="ml-20 pt-16 min-h-screen flex flex-col">{children}</div>
    </div>
  );
}
