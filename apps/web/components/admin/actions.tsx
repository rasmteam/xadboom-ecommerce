"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** A button that calls the API (cookie session), then refreshes the server-rendered page. */
export function ApiButton({
  url,
  method = "POST",
  body,
  className,
  confirm,
  children,
}: {
  url: string;
  method?: "POST" | "PATCH" | "DELETE";
  body?: unknown;
  className: string;
  confirm?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        className={className}
        disabled={busy}
        onClick={async () => {
          if (confirm && !window.confirm(confirm)) return;
          setBusy(true);
          setErr(null);
          const res = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
          setBusy(false);
          if (!res.ok) {
            const j = await res.json().catch(() => null);
            setErr(j?.message ?? "Failed");
            return;
          }
          router.refresh();
        }}
      >
        {busy ? "…" : children}
      </button>
      {err && <span role="alert" className="ml-2 text-[11px] text-error">{err}</span>}
    </>
  );
}

/** An inline <select> that PATCHes one field and refreshes. */
export function InlineSelect({
  url,
  field,
  value,
  options,
  className,
}: {
  url: string;
  field: string;
  value: string;
  options: { value: string; label: string }[];
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <>
      <select
        value={value}
        disabled={busy}
        className={className ?? "bg-[#FFF1EC] rounded px-2 py-1 text-[12px] text-primary font-label-caps tracking-wider uppercase outline-none"}
        onChange={async (e) => {
          setBusy(true);
          setErr(null);
          const v = e.target.value;
          const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: v === "" ? null : v }) });
          setBusy(false);
          if (!res.ok) setErr((await res.json().catch(() => null))?.message ?? "Failed");
          else router.refresh();
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {err && <span role="alert" className="ml-1 text-[11px] text-error">{err}</span>}
    </>
  );
}

/** Notes editor for an inquiry: saves on blur. */
export function InlineNotes({ url, value }: { url: string; value: string }) {
  const router = useRouter();
  const [text, setText] = useState(value);
  return (
    <textarea
      value={text}
      rows={2}
      placeholder="Curator notes…"
      className="w-full bg-[#FFF1EC] rounded px-2 py-1 text-[12px] text-on-surface outline-none resize-none"
      onChange={(e) => setText(e.target.value)}
      onBlur={async () => {
        if (text === value) return;
        await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes: text || null }) });
        router.refresh();
      }}
    />
  );
}
