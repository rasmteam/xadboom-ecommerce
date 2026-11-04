import { NextResponse, type NextRequest } from "next/server";
import { decrypt, SESSION_COOKIE } from "@/lib/session";

// Optimistic gate only (cookie signature + role). Real authorization happens in lib/dal.ts.
export async function proxy(req: NextRequest) {
  const session = await decrypt(req.cookies.get(SESSION_COOKIE)?.value);
  const isStaff = session?.role === "ADMIN" || session?.role === "EDITOR";
  if (!isStaff) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
