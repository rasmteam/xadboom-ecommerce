"use client";

export function AccountSignOut() {
  return (
    <button
      type="button"
      className="underline"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.assign("/");
      }}
    >
      Sign out
    </button>
  );
}
