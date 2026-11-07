"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Step = { label: string; url: string; body?: unknown; confirm?: string };

const STEPS: Record<string, Step[]> = {
  PENDING_PAYMENT: [
    { label: "Mark paid", url: "mark-paid", confirm: "Mark this order as paid? The edition will be sold." },
    { label: "Cancel", url: "cancel", confirm: "Cancel this order and release the held editions?" },
  ],
  PAID: [{ label: "Stage Crate", url: "fulfil", body: { status: "IN_CRATING", crateStatus: "Timber crate assembly" } }],
  IN_CRATING: [{ label: "Dispatch", url: "fulfil", body: { status: "DISPATCHED", crateStatus: "In transit" } }],
  DISPATCHED: [{ label: "Delivered", url: "fulfil", body: { status: "DELIVERED", crateStatus: "Delivered" } }],
};

/** The row's workflow button(s). The first step uses the legacy "Inspect" button style. */
export function OrderActions({ order, className }: { order: { id: string; status: string }; className: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const steps = STEPS[order.status] ?? [];

  async function run(step: Step) {
    if (step.confirm && !window.confirm(step.confirm)) return;
    setBusy(true);
    setErr(null);
    const res = await fetch(`/api/admin/orders/${order.id}/${step.url}`, {
      method: "POST",
      headers: step.body ? { "Content-Type": "application/json" } : undefined,
      body: step.body ? JSON.stringify(step.body) : undefined,
    });
    setBusy(false);
    if (!res.ok) return setErr((await res.json().catch(() => null))?.message ?? "Failed");
    router.refresh();
  }

  if (steps.length === 0) return null;
  return (
    <>
      {steps.map((s, i) => (
        <button key={s.label} type="button" disabled={busy} className={i === 0 ? className : `${className.replace("bg-[#12100E]", "bg-transparent").replace("text-white", "text-[#12100E]")} border border-[#12100E]/30`} onClick={() => run(s)}>
          {busy && i === 0 ? "…" : s.label}
        </button>
      ))}
      {err && <span role="alert" className="text-[10px] text-red-700">{err}</span>}
    </>
  );
}
