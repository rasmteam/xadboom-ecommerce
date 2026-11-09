"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Report = { applied: boolean; rows: number; created: number; updated: number; errors: number; report: { row: number; sku: string | null; action: string; message: string }[] };

/** Bulk import of pieces from an Excel file: preview first (dry run), then apply. */
export function ExcelImport() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(apply: boolean) {
    if (!file) return;
    setBusy(true);
    setError(null);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(`/api/admin/excel/import/pieces${apply ? "?apply=true" : ""}`, { method: "POST", body });
    const json = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) return setError(json?.message ?? "Import failed");
    setResult(json);
    if (apply) router.refresh();
  }

  return (
    <div className="mb-space-md rounded-lg p-4" style={{ backgroundColor: "#FBF0EC" }}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">Bulk import from Excel</span>
        <input
          type="file"
          accept=".xlsx"
          className="text-[12px]"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setResult(null);
          }}
        />
        <button type="button" disabled={!file || busy} onClick={() => run(false)} className="px-3 py-1.5 bg-[#ECDAD4] font-label-caps text-[10px] tracking-wider uppercase disabled:opacity-50">
          Preview
        </button>
        {result && !result.applied && result.errors < result.rows && (
          <button type="button" disabled={busy} onClick={() => run(true)} className="px-3 py-1.5 bg-primary text-on-primary font-label-caps text-[10px] tracking-wider uppercase disabled:opacity-50">
            Apply {result.created + result.updated} change{result.created + result.updated === 1 ? "" : "s"}
          </button>
        )}
        <a href="/api/admin/excel/export/pieces" className="ml-auto underline font-label-caps text-[10px] tracking-wider uppercase">
          Download the current catalog as the template
        </a>
      </div>
      {error && <p role="alert" className="mt-2 text-[13px] text-error">{error}</p>}
      {result && (
        <div className="mt-3 text-[13px]" role="status">
          <p className="font-semibold">
            {result.applied ? "Imported" : "Preview"}: {result.created} to create · {result.updated} to update · {result.errors} with errors
          </p>
          <ul className="mt-1 max-h-48 overflow-auto space-y-0.5">
            {result.report.map((r) => (
              <li key={r.row} className={r.action === "error" ? "text-error" : ""}>
                Row {r.row}: {r.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-2 text-[11px] text-on-surface-variant">
        Columns: SKU, Title, Designer, Category, Price (USD), Total editions, Released editions, Status, Materials, Lead time, Provenance, Length/Width/Height (mm), Weight (kg), Description. Leave SKU empty to create a new draft piece; a known SKU updates that piece.
      </p>
    </div>
  );
}
