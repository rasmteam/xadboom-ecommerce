"use client";

import { useState } from "react";
import type { PriceSettings } from "@/lib/types";

const MODES: { value: PriceSettings["currencyMode"]; label: string; hint: string }[] = [
  { value: "USD", label: "USD only", hint: "Customers see dollar prices." },
  { value: "TOMAN", label: "Toman only", hint: "Customers see Toman prices, converted at your rate." },
  { value: "BOTH", label: "Both", hint: "Dollar price first, Toman equivalent alongside." },
];

const fmt = new Intl.NumberFormat("en-US");

export function CurrencySettings({ initial, canEdit }: { initial: PriceSettings; canEdit: boolean }) {
  const [mode, setMode] = useState(initial.currencyMode);
  const [rate, setRate] = useState(initial.usdToToman ? String(initial.usdToToman) : "");
  const [state, setState] = useState<{ kind: "idle" | "saving" | "saved" | "error"; message?: string }>({ kind: "idle" });

  const rateNum = Number(rate.replace(/[^0-9]/g, ""));
  const needsRate = mode !== "USD";
  const example = needsRate && rateNum ? `$2,450 → ${fmt.format(2450 * rateNum)} Toman` : null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (needsRate && !rateNum) return setState({ kind: "error", message: "Enter the Toman rate for 1 USD." });
    setState({ kind: "saving" });
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currencyMode: mode, usdToToman: needsRate ? rateNum : (rateNum || null) }),
    });
    if (res.ok) return setState({ kind: "saved", message: "Saved. The storefront now shows prices this way." });
    const body = await res.json().catch(() => null);
    setState({ kind: "error", message: body?.issues?.[0]?.message ?? body?.message ?? "Could not save." });
  }

  return (
    <form
      onSubmit={save}
      className="max-w-2xl p-6 rounded-lg space-y-6"
      style={{ backgroundColor: "#FBF0EC" }}
    >
      <fieldset disabled={!canEdit} className="space-y-3">
        <legend className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] mb-2">
          Display currency
        </legend>
        {MODES.map((m) => (
          <label
            key={m.value}
            className={`flex items-start gap-3 p-4 cursor-pointer rounded-lg border ${mode === m.value ? "border-primary bg-[#FFF1EC]" : "border-[#dfcdc7]"}`}
          >
            <input
              type="radio"
              name="currencyMode"
              value={m.value}
              checked={mode === m.value}
              onChange={() => setMode(m.value)}
              className="mt-1"
            />
            <span>
              <span className="block font-headline-sm text-[15px] font-medium text-primary">{m.label}</span>
              <span className="block font-body-md text-[13px] text-on-surface-variant">{m.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="space-y-2">
        <label htmlFor="rate" className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
          Toman per 1 USD {needsRate && <span className="text-primary">*</span>}
        </label>
        <input
          id="rate"
          inputMode="numeric"
          disabled={!canEdit}
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          placeholder="e.g. 60000"
          className="w-full bg-[#FFF1EC] border-0 text-primary text-[14px] px-4 py-2.5 rounded-lg focus:outline-none"
        />
        {example && <p className="font-label-caps text-[11px] tracking-wider text-secondary">Example: {example}</p>}
      </div>

      {canEdit ? (
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={state.kind === "saving"}
            className="px-5 py-2.5 bg-primary text-on-primary font-label-caps text-[11px] tracking-wider uppercase disabled:opacity-60"
          >
            {state.kind === "saving" ? "Saving…" : "Save currency settings"}
          </button>
          {state.message && (
            <span role="status" className={`font-body-md text-[13px] ${state.kind === "error" ? "text-error" : "text-secondary"}`}>
              {state.message}
            </span>
          )}
        </div>
      ) : (
        <p className="font-body-md text-[13px] text-on-surface-variant">Only an administrator can change the currency.</p>
      )}
    </form>
  );
}
