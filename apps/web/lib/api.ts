import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { AdminPieces, CatalogData, DesignerRow, FeaturedData, PieceDetail, PriceSettings, SessionUser } from "./types";

// Server-side (SSR) calls go straight to the API service; the browser uses the same-origin /api rewrite.
const API_URL = process.env.API_URL ?? "http://localhost:4000";

async function get<T>(path: string, opts: { auth?: boolean; revalidate?: number } = {}): Promise<T | null> {
  const headers: Record<string, string> = {};
  if (opts.auth) {
    const jar = await cookies();
    headers.cookie = jar.toString();
  }
  const res = await fetch(`${API_URL}/api${path}`, {
    headers,
    // storefront data is cheap and changes from the admin: short cache, never cache authenticated calls
    ...(opts.auth ? { cache: "no-store" as const } : { next: { revalidate: opts.revalidate ?? 30 } }),
  });
  if (res.status === 404) return null;
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`API ${path} failed with ${res.status}`);
  return (await res.json()) as T;
}

export const api = {
  catalog: async (category?: string, page = 1) => {
    const q = new URLSearchParams({ page: String(page) });
    if (category) q.set("category", category);
    return (await get<CatalogData>(`/catalog?${q}`))!;
  },
  featured: async () => (await get<FeaturedData>("/catalog/featured"))!,
  piece: async (slug: string) => {
    const piece = await get<PieceDetail>(`/pieces/${encodeURIComponent(slug)}`);
    if (!piece) notFound();
    return piece;
  },
  designers: async () => (await get<DesignerRow[]>("/designers"))!,
  adminPieces: async (q: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== "") params.set(k, String(v));
    const data = await get<AdminPieces>(`/admin/pieces?${params}`, { auth: true });
    if (!data) redirect("/login");
    return data;
  },
  adminSettings: async () => {
    const data = await get<PriceSettings>("/admin/settings", { auth: true });
    if (!data) redirect("/login");
    return data;
  },
  me: async () => (await get<{ user: SessionUser }>("/auth/me", { auth: true }))?.user ?? null,
};
