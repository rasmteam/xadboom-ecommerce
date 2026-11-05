import Link from "next/link";
import { AutoSubmitForm } from "./auto-submit-form";

// Building blocks that reuse the exact classes of the Pieces Catalog screen, so every admin screen shares one look.

export const surface = { backgroundColor: "#FBF0EC" } as const;
export const btnGhost =
  "px-2.5 py-1 text-primary hover:bg-surface-container-lowest font-label-caps text-[10px] tracking-wider uppercase transition-colors rounded";
export const btnSolid =
  "px-2.5 py-1 bg-primary text-on-primary font-label-caps text-[10px] tracking-wider uppercase hover:bg-primary-container transition-colors rounded";
export const btnPrimary =
  "flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-label-caps text-label-caps tracking-wider uppercase hover:bg-primary-container transition-colors shadow-sm";
export const btnSecondary =
  "flex items-center gap-2 px-4 py-2.5 bg-[#ECDAD4] text-primary font-label-caps text-label-caps tracking-wider uppercase hover:bg-[#e2cecaa] transition-colors border border-[#dfcdc7]/50";
export const chip =
  "inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-lowest border border-[#dfcdc7] rounded text-primary font-label-caps text-[10px] tracking-wider font-semibold uppercase";
export const inputCls = "w-full bg-surface-bright rounded-lg px-4 py-2.5 text-[14px] text-on-surface outline-none focus:ring-1 focus:ring-primary";
export const labelCls = "block font-label-caps text-label-caps uppercase text-on-surface-variant tracking-widest text-[10px] mb-1.5";

export function AdminPage({
  crumb,
  title,
  subtitle,
  actions,
  children,
}: {
  crumb: string;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="relative pt-16 w-full px-gutter min-h-screen pb-12 bg-[#F7E9E3]">
      <div className="flex flex-col w-full">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md py-space-lg">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
              <span>Curatorial Atelier</span>
              <span className="text-tertiary-fixed-dim">/</span>
              <span>Administration</span>
              <span className="text-tertiary-fixed-dim">/</span>
              <span className="text-primary font-semibold">{crumb}</span>
            </div>
            <h1 className="font-headline-md text-headline-md text-primary tracking-tight font-medium mt-1">{title}</h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">{subtitle}</p>
          </div>
          {actions && <div className="flex items-center gap-space-sm self-start lg:self-center">{actions}</div>}
        </div>
        {children}
      </div>
    </main>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-space-xl">{children}</div>;
}

export function Stat({ label, icon, value, unit, left, right }: { label: string; icon: string; value: React.ReactNode; unit: string; left?: string; right?: string }) {
  return (
    <div className="bg-[#ECDAD4] p-5 flex flex-col justify-between rounded-lg" style={surface}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">{label}</span>
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{icon}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-headline-md text-headline-md font-medium text-primary">{value}</span>
        <span className="font-label-md text-label-md text-on-surface-variant">{unit}</span>
      </div>
      {(left || right) && (
        <div className="mt-3 flex items-center justify-between text-[11px] font-label-caps tracking-wider text-secondary">
          <span>{left}</span>
          <span className="text-primary font-semibold">{right}</span>
        </div>
      )}
    </div>
  );
}

const selectWrap = "relative flex items-center bg-[#FFF1EC] px-3.5 py-1.5 rounded-lg gap-2 text-[12px] font-label-caps uppercase tracking-wider";
const selectCls = "bg-transparent border-0 text-primary font-medium focus:outline-none cursor-pointer pr-5 appearance-none text-[12px] p-0";

export function FilterBar({
  action,
  search,
  placeholder,
  selects,
}: {
  action: string;
  search?: string;
  placeholder: string;
  selects: { name: string; label: string; value?: string; all: string; options: { value: string; label: string }[] }[];
}) {
  return (
    <AutoSubmitForm action={action} className="bg-[#ECDAD4] p-4 mb-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 rounded-lg" style={surface}>
      <div className="relative flex-1 max-w-lg">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-secondary">search</span>
        <input
          className="w-full bg-[#FFF1EC] border-0 text-primary placeholder:text-outline text-body-md pl-10 pr-4 py-2 text-[13px] rounded-lg focus:outline-none focus:ring-0 transition-all"
          name="search"
          defaultValue={search ?? ""}
          placeholder={placeholder}
          type="search"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {selects.map((s) => (
          <div key={s.name} className={selectWrap}>
            <span className="text-secondary text-[11px] font-normal">{s.label}:</span>
            <select name={s.name} defaultValue={s.value ?? ""} className={selectCls}>
              <option value="">{s.all}</option>
              {s.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2 pointer-events-none text-[16px] text-secondary">expand_more</span>
          </div>
        ))}
        <Link href={action} className="p-2 rounded-lg bg-[#FFF1EC] hover:bg-[#ECDAD4] transition-colors text-secondary hover:text-primary flex items-center justify-center" title="Clear filters">
          <span className="material-symbols-outlined text-[18px]">restart_alt</span>
        </Link>
      </div>
    </AutoSubmitForm>
  );
}

export function TableCard({
  tabs,
  head,
  children,
  footer,
  empty,
}: {
  tabs?: React.ReactNode;
  head: { label: string; right?: boolean }[];
  children: React.ReactNode;
  footer?: React.ReactNode;
  empty?: string;
}) {
  return (
    <div className="bg-[#ECDAD4] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)] rounded-lg" style={surface}>
      {tabs && <div className="px-6 py-3.5 bg-[#dfcdc7] flex flex-wrap items-center justify-between gap-4">{tabs}</div>}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#ECDAD4] text-on-surface-variant font-label-caps text-label-caps text-[10px] tracking-widest uppercase border-b border-[#dfcdc7]">
              {head.map((h) => (
                <th key={h.label} className={`py-3.5 px-6 font-semibold ${h.right ? "text-right" : ""}`}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dfcdc7]">{children}</tbody>
        </table>
        {empty && <p className="px-6 py-10 text-center font-body-md text-[13px] text-on-surface-variant">{empty}</p>}
      </div>
      {footer}
    </div>
  );
}

export const Tr = ({ children }: { children: React.ReactNode }) => <tr className="hover:bg-[#F7E9E3] transition-colors group">{children}</tr>;
export const Td = ({ children, right }: { children: React.ReactNode; right?: boolean }) => <td className={`py-4 px-6 align-top ${right ? "text-right" : ""}`}>{children}</td>;

export function Tab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-3.5 py-1.5 font-label-caps text-label-caps tracking-wider uppercase text-[11px] transition-colors ${active ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-primary"}`}
    >
      {children}
    </Link>
  );
}

export function Pager({ base, query, page, pages, from, to, total, noun }: { base: string; query: Record<string, string | undefined>; page: number; pages: number; from: number; to: number; total: number; noun: string }) {
  const href = (n: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v) q.set(k, v);
    q.set("page", String(n));
    return `${base}?${q}`;
  };
  const cell = "w-8 h-8 flex items-center justify-center bg-surface-container-lowest";
  return (
    <div className="px-6 py-4 bg-[#dfcdc7] flex flex-col sm:flex-row items-center justify-between gap-4">
      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-[11px]">{`Showing ${from} to ${to} of ${total} ${noun}`}</span>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link href={href(page - 1)} className={`${cell} text-on-surface-variant hover:text-primary transition-colors`}>
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </Link>
        ) : (
          <span className={`${cell} text-on-surface-variant opacity-30`}>
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </span>
        )}
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
          <Link key={n} href={href(n)} className={n === page ? "w-8 h-8 flex items-center justify-center bg-primary text-on-primary font-label-caps text-[11px] font-semibold" : `${cell} text-primary hover:bg-[#ECDAD4] font-label-caps text-[11px] transition-colors`}>
            {n}
          </Link>
        ))}
        {page < pages ? (
          <Link href={href(page + 1)} className={`${cell} text-on-surface-variant hover:text-primary transition-colors`}>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </Link>
        ) : (
          <span className={`${cell} text-on-surface-variant opacity-30`}>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </span>
        )}
      </div>
    </div>
  );
}

export const range = (page: number, perPage: number, shown: number, total: number) => ({ from: total === 0 ? 0 : (page - 1) * perPage + 1, to: (page - 1) * perPage + shown });
export const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC";
