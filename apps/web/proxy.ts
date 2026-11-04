import { NextResponse, type NextRequest } from "next/server";

// Optimistic redirect only: no session cookie, no admin. The API is the authority; the admin layout
// calls /api/auth/me and the API guards every admin endpoint.
export function proxy(req: NextRequest) {
  if (!req.cookies.has("xb_session")) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
