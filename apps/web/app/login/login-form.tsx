"use client";

import { useState } from "react";

const field =
  "w-full rounded-lg border border-[#d8c3bc] bg-white px-4 py-3 text-sm outline-none focus:border-[#0a0a0a]";

// only same-site relative paths, never //host or absolute URLs
const safeNext = (next: string) => (next.startsWith("/") && !next.startsWith("//") ? next : "/admin");

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [error, setError] = useState<string | undefined>(notice);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(undefined);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      if (res.status === 429) return setError("Too many attempts. Try again in 15 minutes.");
      if (!res.ok) return setError("Incorrect email or password.");
      const { user } = await res.json();
      window.location.assign(user.role === "COLLECTOR" && next === "/admin" ? "/account" : safeNext(next));
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-[#7a6e69]">Email</span>
        <input name="email" type="email" autoComplete="username" required className={field} />
      </label>
      <label className="block">
        <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-[#7a6e69]">Password</span>
        <input name="password" type="password" autoComplete="current-password" required className={field} />
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
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-[#7a6e69]">
        New collector?{" "}
        <a href="/register" className="underline">
          Create an account
        </a>
      </p>
    </form>
  );
}
