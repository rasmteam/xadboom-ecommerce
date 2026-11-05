import Link from "next/link";
import { AdminPage, btnGhost, btnPrimary, Stat, StatGrid, TableCard, Td, Tr } from "@/components/admin/ui";
import { api } from "@/lib/api";
import type { AdminCategory } from "@/lib/admin-types";

export default async function CategoriesAdminPage() {
  const rows = await api.adminGet<AdminCategory[]>("/admin/categories");
  const pieces = rows.reduce((n, c) => n + c.pieceCount, 0);
  const lead = [...rows].sort((a, b) => b.pieceCount - a.pieceCount)[0];

  return (
    <AdminPage
      crumb="Categories & Typologies"
      title="Categories & Typologies"
      subtitle="Curate physical asset classifications and spatial typologies across atelier collections."
      actions={
        <Link href="/admin/categories/new" className={btnPrimary}>
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>+ Add New Category</span>
        </Link>
      }
    >
      <StatGrid>
        <Stat label="Total Active Typologies" icon="category" value={rows.length} unit="Curated Categories" left={`${pieces} OBJECTS CATALOGED`} />
        <Stat label="Leading Allocation" icon="pie_chart" value={lead?.pieceCount ?? 0} unit={lead?.name ?? "—"} left="MOST PIECES" />
        <Stat label="Empty Typologies" icon="inbox" value={String(rows.filter((c) => c.pieceCount === 0).length).padStart(2, "0")} unit="No pieces yet" />
        <Stat label="Dimensional & 3D Assets" icon="view_in_ar" value="—" unit="Arrive with Excel / 3D" left="EXCEL/CSV SPECS" right="PENDING" />
      </StatGrid>

      <TableCard
        head={[{ label: "Typology" }, { label: "Description" }, { label: "Active Pieces" }, { label: "Order" }, { label: "Actions", right: true }]}
        empty={rows.length === 0 ? "No typologies yet." : undefined}
      >
        {rows.map((c) => (
          <Tr key={c.id}>
            <Td>
              <div className="flex flex-col">
                <span className="font-headline-sm text-[15px] font-medium text-primary">{c.name}</span>
                <span className="font-label-caps text-[10px] text-on-surface-variant tracking-wider">/catalog?category={c.slug}</span>
              </div>
            </Td>
            <Td>
              <span className="text-on-surface text-[12px] max-w-md block">{c.description ?? "—"}</span>
            </Td>
            <Td>
              <span className="font-headline-sm text-[14px] font-semibold text-primary">{c.pieceCount} Pieces</span>
            </Td>
            <Td>{c.sortOrder}</Td>
            <Td right>
              <Link href={`/admin/categories/${c.id}`} className={btnGhost}>
                Edit
              </Link>
            </Td>
          </Tr>
        ))}
      </TableCard>
    </AdminPage>
  );
}
