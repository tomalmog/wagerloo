import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await auth();

  // Allow unauthenticated users to access public routes
  if (!session?.user) {
    return NextResponse.next();
  }

  const path = request.nextUrl.pathname;

  // Allow access to auth routes, profile creation, and API routes
  const allowedPaths = [
    "/auth/signin",
    "/auth/register",
    "/auth/verify",
    "/auth/verify-email",
    "/profile/create",
    "/profile/edit",
    "/api/",
  ];

  const isAllowedPath = allowedPaths.some((allowedPath) =>
    path.startsWith(allowedPath)
  );

  if (isAllowedPath) {
    return NextResponse.next();
  }

  // Check if user has a profile (from session)
  if (!session.user.hasProfile) {
    return NextResponse.redirect(new URL("/profile/create", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
