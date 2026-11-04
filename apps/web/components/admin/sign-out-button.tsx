"use client";

export function SignOutButton() {
  return (
    <button
      type="button"
      className="ml-3 font-label-caps text-label-caps text-[10px] tracking-wider uppercase text-on-surface-variant hover:text-primary underline underline-offset-4"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.assign("/login");
      }}
    >
      Sign out
    </button>
  );
}
