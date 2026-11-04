"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const field =
  "w-full rounded-lg border border-[#d8c3bc] bg-white px-4 py-3 text-sm outline-none focus:border-[#0a0a0a]";

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  const error = state.error ?? notice;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
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
    </form>
  );
}
