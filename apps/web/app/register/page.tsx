import type { Metadata } from "next";
import { RegisterForm } from "@/components/account/register-form";

export const metadata: Metadata = { title: "Create account — Xadboom", robots: { index: false, follow: false } };

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#ecdad4] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#d8c3bc] bg-[#fff8f6] p-8 shadow-sm">
        <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-[#844c38]">Xadboom Atelier</p>
        <h1 className="mb-6 text-2xl font-bold tracking-tight">Create your collector account</h1>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-[#7a6e69]">
          Already registered?{" "}
          <a href="/login?next=/account" className="underline">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}
