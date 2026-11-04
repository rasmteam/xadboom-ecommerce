"use client";

export function LogoutButton() {
  return (
    <button
      className="underline"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.assign("/login");
      }}
    >
      Sign out
    </button>
  );
}
