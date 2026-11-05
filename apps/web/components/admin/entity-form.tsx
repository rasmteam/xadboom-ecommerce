"use client";
/* eslint-disable @next/next/no-img-element */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { btnGhost, btnPrimary, inputCls, labelCls, surface } from "./ui";

export type Field = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "checkbox" | "image" | "select";
  hint?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  wide?: boolean;
};

type Values = Record<string, string | number | boolean | null>;

/** A small generic create/edit form for the simple admin entities (designers, categories, users). */
export function EntityForm({
  fields,
  initial,
  submitUrl,
  method,
  backHref,
  submitLabel,
  deleteUrl,
  successMessage,
}: {
  fields: Field[];
  initial: Values;
  submitUrl: string;
  method: "POST" | "PATCH";
  backHref: string;
  submitLabel: string;
  deleteUrl?: string;
  /** when set, shows this message instead of going back; {key} is replaced with the server response value (e.g. a one-time password) */
  successMessage?: string;
}) {
  const router = useRouter();
  const [v, setV] = useState<Values>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const set = (k: string, val: string | number | boolean | null) => setV((s) => ({ ...s, [k]: val }));

  async function upload(name: string, file?: File) {
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/uploads/image", { method: "POST", body });
    const json = await res.json().catch(() => null);
    if (!res.ok) return setError(json?.message ?? "Upload failed");
    set(name, json.url);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      const val = v[f.name];
      if (f.type === "number") payload[f.name] = val === "" || val === null ? undefined : Number(val);
      else if (f.type === "checkbox") payload[f.name] = !!val;
      else payload[f.name] = typeof val === "string" && val.trim() === "" && !f.required ? null : val;
    }
    try {
      const res = await fetch(submitUrl, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const issue = json?.issues?.[0];
        setError(issue ? `${issue.path || "form"}: ${issue.message}` : (json?.message ?? "Could not save"));
        return;
      }
      const note = successMessage?.replace(/\{(\w+)\}/g, (_, k) => String(json?.[k] ?? ""));
      if (note) setMessage(note);
      else {
        router.push(backHref);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-3xl p-space-lg rounded-lg space-y-space-md" style={surface}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
        {fields.map((f) => (
          <div key={f.name} className={f.wide || f.type === "textarea" || f.type === "image" ? "md:col-span-2" : ""}>
            {f.type === "checkbox" ? (
              <label className="flex items-center gap-3 font-body-md text-[13px] text-on-surface">
                <input type="checkbox" checked={!!v[f.name]} onChange={(e) => set(f.name, e.target.checked)} />
                {f.label}
              </label>
            ) : (
              <>
                <label className={labelCls} htmlFor={f.name}>
                  {f.label} {f.required && "*"}
                </label>
                {f.type === "textarea" ? (
                  <textarea id={f.name} rows={4} className={inputCls} value={String(v[f.name] ?? "")} onChange={(e) => set(f.name, e.target.value)} />
                ) : f.type === "select" ? (
                  <select id={f.name} className={inputCls} value={String(v[f.name] ?? "")} onChange={(e) => set(f.name, e.target.value)}>
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === "image" ? (
                  <div className="flex items-center gap-4">
                    {v[f.name] ? <img src={String(v[f.name])} alt="" className="h-20 w-20 rounded-lg object-cover" /> : <div className="h-20 w-20 rounded-lg bg-surface-bright" />}
                    <label className={`${btnGhost} cursor-pointer`}>
                      {v[f.name] ? "Replace image" : "Upload image"}
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => void upload(f.name, e.target.files?.[0])} />
                    </label>
                    {!!v[f.name] && (
                      <button type="button" className={btnGhost} onClick={() => set(f.name, null)}>
                        Remove
                      </button>
                    )}
                  </div>
                ) : (
                  <input id={f.name} type={f.type === "number" ? "number" : "text"} required={f.required} className={inputCls} value={String(v[f.name] ?? "")} onChange={(e) => set(f.name, e.target.value)} />
                )}
                {f.hint && <p className="mt-1 font-body-md text-label-md text-secondary">{f.hint}</p>}
              </>
            )}
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="px-4 py-3 rounded-lg bg-error-container text-on-error-container text-[13px]">
          {error}
        </p>
      )}
      {message && (
        <div role="status" className="px-4 py-3 rounded-lg bg-[#FFF1EC] text-primary text-[13px] space-y-2">
          <p className="whitespace-pre-line">{message}</p>
          <button type="button" className={btnGhost} onClick={() => { router.push(backHref); router.refresh(); }}>
            Done
          </button>
        </div>
      )}

      {!message && (
        <div className="flex items-center gap-3">
          <button type="submit" disabled={busy} className={`${btnPrimary} disabled:opacity-60`}>
            {busy ? "Saving…" : submitLabel}
          </button>
          <button type="button" className={btnGhost} onClick={() => router.push(backHref)}>
            Cancel
          </button>
          {deleteUrl && (
            <button
              type="button"
              className="ml-auto px-2.5 py-1 text-error font-label-caps text-[10px] tracking-wider uppercase"
              onClick={async () => {
                if (!window.confirm("Delete this record permanently?")) return;
                const res = await fetch(deleteUrl, { method: "DELETE" });
                if (res.ok) {
                  router.push(backHref);
                  router.refresh();
                } else setError((await res.json().catch(() => null))?.message ?? "Could not delete");
              }}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </form>
  );
}
