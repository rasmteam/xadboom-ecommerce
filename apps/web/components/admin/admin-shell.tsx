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

  return (
    <div className="theme-aOrders page-aOrders min-h-screen bg-[#F7E9E3] text-[#231A16] flex flex-row antialiased selection:bg-[#1E1A18] selection:text-white">
<aside className="w-[74px] shrink-0 min-h-screen bg-[#12100E] border-r border-[#2A2420] flex flex-col items-center py-5 fixed left-0 top-0 bottom-0 z-50 justify-between select-none"><div className="flex flex-col items-center w-full gap-6"><a className="w-10 h-10 bg-[#FAF4F0] flex items-center justify-center rounded-none shadow-md group transition-transform active:scale-95" href="/admin"><span className="font-headline font-bold text-xs tracking-widest text-[#12100E]">XB</span></a><nav className="flex flex-col items-center gap-1.5 w-full px-2">{NAV.map((n) => { const on = isActive(n.href); return (<a key={n.href} className={`relative ${on ? "w-11 h-11 flex items-center justify-center rounded bg-[#FAF4F0] text-[#12100E] shadow-sm transition-colors" : "w-11 h-11 flex items-center justify-center rounded text-[#8E837D] hover:bg-[#201C19] hover:text-[#F7E9E3] transition-colors"}`} title={n.title} href={n.href} aria-current={on ? "page" : undefined}><span className={on ? "material-symbols-outlined fill-icon text-[21px]" : "material-symbols-outlined text-[21px]"}>{n.icon}</span>{n.badge !== undefined && n.badge > 0 && <span className="absolute -top-1 -right-1 bg-[#9E7852] text-white text-[9px] font-headline font-bold px-1.5 py-0.2 rounded-full border-2 border-[#12100E]">{n.badge}</span>}</a>); })}</nav></div><div className="flex flex-col items-center gap-3 pt-4 border-t border-[#25201C] w-full px-2"><div className="flex items-center justify-center gap-1.5 py-1 px-2 rounded-full bg-[#1C1815] border border-[#2B2420]" title="Vault Ledger Online"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><span className="font-headline text-[9px] tracking-wider text-[#A89F9A] uppercase">SYNC</span></div><a href="/admin/settings" className={`w-10 h-10 rounded-full bg-[#241F1C] border border-[#3E352F] flex items-center justify-center text-[#E0D5CE] hover:ring-2 hover:ring-[#9E7852] transition-all ${pathname.startsWith("/admin/settings") ? "ring-2 ring-[#9E7852]" : ""}`} title={`${user.name} — Settings`}><span className="font-headline font-medium text-xs tracking-wider">{initials}</span></a></div></aside>
<div className="flex-1 ml-[74px] flex flex-col min-h-screen"><header data-motion-header="" className="sticky top-0 z-40 bg-[#F7E9E3]/95 backdrop-blur-md border-b border-[#E2D8D3] px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-2 font-headline text-[11px] uppercase tracking-wider text-[#635D5C]">{crumbs.map((c, i) => (<span key={i} className="contents">{i > 0 && <span className="text-[#B6ACA7]">/</span>}<span className={i === crumbs.length - 1 ? "text-[#12100E] font-semibold" : "hover:text-[#12100E] cursor-pointer transition-colors"}>{c}</span></span>))}</div><div className="flex items-center gap-3"><div className="relative w-48 sm:w-64"><span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7E746F] text-[18px]">search</span>{" "}<input className="w-full bg-[#FBF0EC] border border-[#E2D8D3] text-xs font-body text-[#1E1A18] placeholder-[#968C86] pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-[#1E1A18] transition-colors" placeholder="Search the atelier…" name="q" aria-label="Search" type="text" /></div><span className="hidden sm:block font-headline text-[11px] text-[#635D5C]">{user.name}</span><SignOutButton /></div></header>{children}</div>
</div>
  );
}
