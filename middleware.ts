import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function middleware(request: NextRequest) {
  const session = await auth();

  // Allow unauthenticated users to access public routes
  if (!session?.user?.id) {
    return NextResponse.next();
  }

  const userId = session.user.id as string;
  const path = request.nextUrl.pathname;

  // Allow access to auth routes, profile creation, and API routes
  const allowedPaths = [
    "/auth/signin",
    "/auth/register",
    "/auth/verify",
    "/auth/verify-email",
    "/profile/create",
    "/api/",
  ];

  const isAllowedPath = allowedPaths.some((allowedPath) =>
    path.startsWith(allowedPath)
  );

  if (isAllowedPath) {
    return NextResponse.next();
  }

  // Check if user has a profile
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    // If user doesn't have a profile, redirect to profile creation
    if (!profile) {
      return NextResponse.redirect(new URL("/profile/create", request.url));
    }
  } catch (error) {
    console.error("Middleware error checking profile:", error);
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
