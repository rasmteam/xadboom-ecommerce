"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getPrisma, verifyPassword } from "@xadboom/db";
import { createSession, deleteSession } from "@/lib/session";
import { clearAttempts, recordAttempt, tooManyAttempts } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(200),
});

// only same-site relative paths, never //host or absolute URLs
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
}

export type LoginState = { error?: string };

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: "Enter a valid email and password." };
  const { email, password } = parsed.data;

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limitKey = `${ip}|${email}`;
  if (tooManyAttempts(limitKey)) return { error: "Too many attempts. Try again in 15 minutes." };

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { email } });
  const ok = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !ok) {
    recordAttempt(limitKey);
    return { error: "Incorrect email or password." };
  }

  clearAttempts(limitKey);
  await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
  await createSession({ userId: user.id, role: user.role });
  redirect(user.role === "COLLECTOR" ? "/" : safeNext(form.get("next")));
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
