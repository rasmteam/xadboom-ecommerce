import Link from "next/link";
import { AdminPage, btnGhost, btnPrimary, chip, Stat, StatGrid, TableCard, Td, Tr } from "@/components/admin/ui";
import { api } from "@/lib/api";
import type { AdminDesigner } from "@/lib/admin-types";

export default async function DesignersAdminPage() {
  const rows = await api.adminGet<AdminDesigner[]>("/admin/designers");
  const pieces = rows.reduce((n, d) => n + d.pieceCount, 0);
  const published = rows.filter((d) => d.published).length;

  return (
    <AdminPage
      crumb="Designers & Collaborators"
      title="Designers, Architects & Collaborating Ateliers"
      subtitle="Master administration of verified architectural partners, monograph profiles and the pieces attributed to them."
      actions={
        <Link href="/admin/designers/new" className={btnPrimary}>
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>+ Add Collaborator</span>
        </Link>
      }
    >
      <StatGrid>
        <Stat label="Active Collaborators" icon="architecture" value={String(published).padStart(2, "0")} unit="Published ateliers" left={`${rows.length - published} HIDDEN`} />
        <Stat label="Total Designed Pieces" icon="chair" value={pieces} unit="Catalog editions" />
        <Stat label="Without Pieces" icon="draft" value={String(rows.filter((d) => d.pieceCount === 0).length).padStart(2, "0")} unit="Awaiting a commission" />
        <Stat label="Disciplines" icon="category" value={new Set(rows.map((d) => d.discipline).filter(Boolean)).size} unit="Represented" />
      </StatGrid>

      <TableCard
        head={[{ label: "Designer & Studio" }, { label: "Cataloged Pieces" }, { label: "Base & Discipline" }, { label: "Visibility" }, { label: "Actions", right: true }]}
        empty={rows.length === 0 ? "No collaborators yet." : undefined}
      >
        {rows.map((d) => (
          <Tr key={d.id}>
            <Td>
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {d.portrait ? <img src={d.portrait} alt="" className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-surface-bright" />}
                <div className="flex flex-col">
                  <span className="font-headline-sm text-[15px] font-medium text-primary">{d.name}</span>
                  <span className="text-on-surface-variant font-curatorial-quote italic text-[12px]">{d.studio}</span>
                </div>
              </div>
            </Td>
            <Td>
              <span className="font-headline-sm text-[14px] font-semibold text-primary">{String(d.pieceCount).padStart(2, "0")} Pieces</span>
            </Td>
            <Td>
              <div className="flex flex-col">
                <span className="flex items-center gap-1 text-primary text-[13px]">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  {d.city ?? "—"}
                </span>
                <span className="font-label-caps text-[10px] text-on-surface-variant tracking-wider">{d.discipline ?? ""}</span>
              </div>
            </Td>
            <Td>
              <span className={chip}>{d.published ? "Published" : "Hidden"}</span>
            </Td>
            <Td right>
              <Link href={`/admin/designers/${d.id}`} className={btnGhost}>
                Edit Dossier
              </Link>
            </Td>
          </Tr>
        ))}
      </TableCard>
    </AdminPage>
  );
}
