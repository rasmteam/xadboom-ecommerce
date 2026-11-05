"use client";
/* eslint-disable @next/next/no-img-element */
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/types";
import { SignOutButton } from "./sign-out-button";

const NAV = [
  { href: "/admin", icon: "space_dashboard", title: "Atelier Overview" },
  { href: "/admin/pieces", icon: "category", title: "Pieces Catalog" },
  { href: "/admin/categories", icon: "auto_stories", title: "Categories & Typologies" },
  { href: "/admin/designers", icon: "architecture", title: "Designers & Collaborators" },
  { href: "/admin/orders", icon: "receipt_long", title: "Acquisitions & Orders" },
  { href: "/admin/inquiries", icon: "history_edu", title: "Inquiries & Forms" },
  { href: "/admin/users", icon: "manage_accounts", title: "Users & Accounts" },
];

export function AdminShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  return (
    <div className="theme-adminPieces font-body-md text-on-surface antialiased bg-[#F7E9E3] min-h-screen">
      <aside className="fixed left-0 top-0 h-full w-20 border-r border-[#ECDAD4] z-50 flex flex-col items-center py-6 bg-[#ECDAD4]"><div className="mb-8 flex flex-col items-center justify-center"><div className="w-10 h-10 bg-primary flex items-center justify-center"><span className="font-headline-sm text-headline-sm text-on-primary font-bold tracking-widest">X</span></div><span className="font-label-caps text-label-caps text-on-surface-variant uppercase mt-1 tracking-widest text-[9px]">ATELIER</span></div><nav className="flex-1 flex flex-col items-center gap-3 w-full px-2" data-active-classes="bg-primary text-on-primary">{NAV.map((n) => (<a key={n.href} className={`w-12 h-12 flex items-center justify-center transition-colors ${isActive(n.href) ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-[#ECDAD4] hover:text-on-surface"}`} href={n.href} title={n.title} aria-current={isActive(n.href) ? "page" : undefined}><span className="material-symbols-outlined text-[20px]">{n.icon}</span></a>))}</nav><div className="flex flex-col items-center gap-3 w-full px-2 pt-4"><a className={`w-12 h-12 flex items-center justify-center transition-colors ${isActive("/admin/settings") ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-[#ECDAD4] hover:text-on-surface"}`} href="/admin/settings" title="Settings"><span className="material-symbols-outlined text-[20px]">tune</span></a></div></aside>
      <div className="pl-20">
        <header data-motion-header="" className="fixed top-0 left-20 right-0 h-16 border-b border-[#ECDAD4] backdrop-blur-md z-40 px-gutter flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.02)]" style={{ backgroundColor: "rgba(236, 218, 212, 0.95)" }}><div className="flex items-center gap-space-md"><img alt="logo-sign.png" className="h-8 w-auto object-contain" src="/images/xadboom-sign.png" /><div className="flex items-center gap-space-sm font-label-caps text-label-caps tracking-widest text-on-surface-variant uppercase"><span className="text-on-surface">Xadboom Atelier</span><span className="text-outline-variant font-normal">/</span><span className="">Admin Console</span><span className="text-outline-variant font-normal">/</span><span className="text-on-surface font-semibold">Monograph View</span></div></div><div className="flex items-center gap-space-lg"><div className="flex items-center gap-space-sm font-label-caps text-label-caps text-on-surface-variant"><span className="w-2 h-2 rounded-full bg-secondary" /><span className="">VAULT CONNECTED</span></div><div className="h-4 w-[1px] bg-[#dfcdc7]" /><div className="flex items-center gap-space-sm"><div className="flex flex-col text-right"><span className="font-label-caps text-label-caps text-on-surface tracking-wider font-semibold">{user.name.toUpperCase()}</span><span className="font-label-caps text-label-caps text-on-surface-variant text-[9px]">{user.role === "ADMIN" ? "ADMINISTRATOR" : "CURATOR / EDITOR"}</span></div><div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"><span className="material-symbols-outlined text-on-primary text-[18px]">person</span></div><SignOutButton /></div></div></header>
        {children}
      </div>
    </div>
  );
}
