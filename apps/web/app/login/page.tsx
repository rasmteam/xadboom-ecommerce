import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in — Xadboom Atelier" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const notice = error === "forbidden" ? "Your account does not have access to the atelier admin." : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#ecdad4] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#d8c3bc] bg-[#fff8f6] p-8 shadow-sm">
        <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-[#844c38]">Xadboom Atelier</p>
        <h1 className="mb-6 text-2xl font-bold tracking-tight">Sign in</h1>
        <LoginForm next={next ?? "/admin"} notice={notice} />
      </div>
    </main>
  );
}
