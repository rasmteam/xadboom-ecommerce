"use client";

import { useState } from "react";

const field =
  "w-full rounded-lg border border-[#d8c3bc] bg-white px-4 py-3 text-sm outline-none focus:border-[#0a0a0a]";
const label = "mb-1 block font-mono text-[10px] uppercase tracking-widest text-[#7a6e69]";

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: f.get("name"), email: f.get("email"), password: f.get("password") }),
      });
      const json = await res.json().catch(() => null);
      if (res.status === 429) return setError("Too many sign-ups from this address. Try again later.");
      if (!res.ok) return setError(json?.issues?.[0]?.message ?? json?.message ?? "Could not create the account.");
      window.location.assign("/account");
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className={label}>Full name / practice</span>
        <input name="name" required autoComplete="name" className={field} />
      </label>
      <label className="block">
        <span className={label}>Email</span>
        <input name="email" type="email" required autoComplete="email" className={field} />
      </label>
      <label className="block">
        <span className={label}>Password (8+ characters)</span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={field} />
      </label>
      {error && (
        <p role="alert" className="text-sm text-[#ba1a1a]">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-[#0a0a0a] px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#fff8f6] disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
