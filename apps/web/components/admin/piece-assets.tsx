"use client";

import { useCallback, useEffect, useState } from "react";

type Asset = { id: string; kind: string; filename: string; url: string; sizeBytes: number; isViewerModel: boolean };
type Dims = { lengthMm?: number; widthMm?: number; heightMm?: number; weightKg?: number };

const btn =
  "px-4 py-2 rounded-lg bg-surface-container text-on-surface font-label-caps text-label-caps uppercase tracking-wider hover:bg-surface-variant transition-colors cursor-pointer inline-flex items-center gap-2";
const mb = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const KIND: Record<string, string> = { GLB: "3D model (viewer)", OBJ: "OBJ model", FBX: "FBX model", RHINO_3DM: "Rhino 3DM", IFC: "BIM / IFC", RVT: "Revit", SPEC_XLSX: "Spec spreadsheet", TEARSHEET_PDF: "Tear sheet", OTHER: "File" };

/** Dimension spreadsheet (Excel) and 3D / CAD file management inside the piece form. */
export function PieceAssetsPanel({ pieceId, onDims }: { pieceId?: string; onDims: (d: Dims) => void }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!pieceId) return;
    const res = await fetch(`/api/admin/pieces/${pieceId}/assets`);
    if (res.ok) setAssets(await res.json());
  }, [pieceId]);
  useEffect(() => {
    void load();
  }, [load]);

  async function parseSheet(file?: File) {
    if (!file) return;
    setBusy(true);
    setMsg(null);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/excel/parse-dimensions", { method: "POST", body });
    const json = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: json?.message ?? "Could not read the spreadsheet" });
    onDims(json.dims);
    const found = Object.keys(json.dims).length;
    setMsg({ ok: true, text: `Read ${found} value${found === 1 ? "" : "s"} from sheet "${json.sheet}" and filled the fields above.${json.notes?.length ? " Check: " + json.notes.join("; ") : ""}` });
  }

  async function uploadAsset(file?: File) {
    if (!file || !pieceId) return;
    setBusy(true);
    setMsg(null);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(`/api/admin/pieces/${pieceId}/assets`, { method: "POST", body });
    const json = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: json?.message ?? "Upload failed" });
    setMsg({ ok: true, text: `${json.filename} uploaded.` });
    void load();
  }

  async function remove(a: Asset) {
    if (!window.confirm(`Delete ${a.filename}?`)) return;
    const res = await fetch(`/api/admin/pieces/${pieceId}/assets/${a.id}`, { method: "DELETE" });
    if (res.ok) void load();
  }

  return (
    <div className="mt-space-md space-y-space-md">
      <div className="flex flex-wrap items-center gap-3">
        <a className={btn} href="/api/admin/excel/template">
          <span className="material-symbols-outlined text-[18px]">download</span>Download Spec Template (.xlsx)
        </a>
        <label className={btn}>
          <span className="material-symbols-outlined text-[18px]">table_view</span>Upload Dimension Spreadsheet
          <input type="file" accept=".xlsx" className="hidden" disabled={busy} onChange={(e) => { void parseSheet(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        {pieceId ? (
          <label className={btn}>
            <span className="material-symbols-outlined text-[18px]">view_in_ar</span>Upload 3D / CAD File
            <input type="file" accept=".glb,.gltf,.obj,.fbx,.3dm,.ifc,.rvt,.pdf,.xlsx" className="hidden" disabled={busy} onChange={(e) => { void uploadAsset(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
        ) : (
          <span className="font-body-md text-label-md text-secondary">Save the piece first, then you can attach 3D models and CAD files.</span>
        )}
      </div>

      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`font-body-md text-[13px] ${msg.ok ? "text-primary" : "text-error"}`}>
          {msg.text}
        </p>
      )}

      {assets.length > 0 && (
        <ul className="divide-y divide-[#dfcdc7] rounded-lg bg-surface-bright">
          {assets.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-body-md text-[13px] text-on-surface">{a.filename}</p>
                <p className="font-label-caps text-label-caps text-secondary uppercase tracking-wider text-[10px]">
                  {KIND[a.kind] ?? a.kind} · {mb(a.sizeBytes)}
                  {a.isViewerModel && " · shown on the product page"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <a className="font-label-caps text-[10px] uppercase tracking-wider underline" href={a.url} download>
                  Download
                </a>
                <button type="button" className="font-label-caps text-[10px] uppercase tracking-wider text-error" onClick={() => remove(a)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="font-body-md text-label-md text-secondary">
        Accepted: .glb/.gltf (shown in the interactive viewer), .obj, .fbx, .3dm, .ifc, .rvt, .pdf, .xlsx · up to 150 MB each.
      </p>
    </div>
  );
}
