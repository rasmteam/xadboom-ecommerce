import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPrisma } from "@xadboom/db";
import { decrypt, SESSION_COOKIE } from "./session";

/**
 * Data access layer: the authoritative check. The cookie only proves who the user was at login;
 * role and existence are re-read from the database so demotions/deletions take effect immediately.
 */
export const getCurrentUser = cache(async () => {
  const session = await decrypt((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await getPrisma().user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true },
  });
  return user;
});

/** Admin area: ADMIN and EDITOR only. */
export async function requireStaff() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN" && user.role !== "EDITOR") redirect("/login?error=forbidden");
  return user;
}

/** Admin-only actions (settings, users). */
export async function requireAdmin() {
  const user = await requireStaff();
  if (user.role !== "ADMIN") redirect("/admin?error=forbidden");
  return user;
}
