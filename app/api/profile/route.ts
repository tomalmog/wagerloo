import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user!.id as string;
    const profile = await prisma.profile.findFirst({
      where: {
        userId: userId,
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user!.id as string;
    const body = await request.json();
    const { name, profilePicture, resumeUrl } = body;

    // Find the user's profile
    const existingProfile = await prisma.profile.findFirst({
      where: {
        userId: userId,
      },
    });

    if (!existingProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Update the profile
    const profile = await prisma.profile.update({
      where: {
        id: existingProfile.id,
      },
      data: {
        name,
        profilePicture: profilePicture || null,
        resumeUrl: resumeUrl || null,
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
