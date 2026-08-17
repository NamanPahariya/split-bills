import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/app/session-cookie";

/**
 * This only checks that a session cookie is present, never that it is valid:
 * middleware cannot reach the database. The page behind it calls
 * requireAccount, which is the real gate — this just saves a pointless render
 * for someone who is plainly signed out.
 */
export function middleware(request: NextRequest) {
  if (request.cookies.get(SESSION_COOKIE) === undefined) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*"],
};
