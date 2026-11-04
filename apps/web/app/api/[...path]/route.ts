import type { NextRequest } from "next/server";

// Runtime proxy to the Nest API (API_URL is read per request, not baked in at build time),
// so the browser only ever talks to this origin and session cookies need no CORS.
export const dynamic = "force-dynamic";

const API_URL = () => process.env.API_URL ?? "http://localhost:4000";
const HOP_BY_HOP = ["connection", "keep-alive", "transfer-encoding", "upgrade", "host", "content-length"];

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const target = `${API_URL()}/api/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  HOP_BY_HOP.forEach((h) => headers.delete(h));
  const ip = req.headers.get("x-forwarded-for");
  if (ip) headers.set("x-forwarded-for", ip);

  const hasBody = !["GET", "HEAD"].includes(req.method);
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
      // @ts-expect-error Node's fetch requires duplex for streamed request bodies
      duplex: hasBody ? "half" : undefined,
      redirect: "manual",
      cache: "no-store",
    });
  } catch {
    return Response.json({ message: "API unavailable" }, { status: 502 });
  }

  const out = new Headers(upstream.headers);
  // fetch already decoded the body
  out.delete("content-encoding");
  out.delete("content-length");
  return new Response(upstream.body, { status: upstream.status, headers: out });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
