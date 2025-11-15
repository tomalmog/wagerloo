import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user!.id as string;
    const body = await request.json();
    const { name, profilePicture, resumeUrl } = body;

    // Check if user already has a profile
    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: "You already have a profile. Each user can only create one profile." },
        { status: 400 }
      );
    }

    console.log('Creating profile with:', {
      userId,
      name,
      hasProfilePicture: !!profilePicture,
      hasResumeUrl: !!resumeUrl,
      profilePictureLength: profilePicture?.length,
      resumeUrlLength: resumeUrl?.length,
    });

    // Create profile and market in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create the profile
      const profile = await tx.profile.create({
        data: {
          userId: userId,
          name,
          profilePicture: profilePicture || null,
          resumeUrl: resumeUrl || null,
        },
      });

      // Create the market with over/under voting
      // Starting line is $25/hr
      const market = await tx.market.create({
        data: {
          profileId: profile.id,
          title: `${name} - Next Co-op`,
          description: `Over/under on ${name}'s next co-op salary`,
          status: "active",
          currentLine: 25.0,
          initialLine: 25.0,
          overVotes: 0,
          underVotes: 0,
        },
      });

      return { profile, market };
    });

    return NextResponse.json({
      success: true,
      profileId: result.profile.id,
      marketId: result.market.id,
    });
  } catch (error) {
    console.error("Error creating profile (full error):", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      {
        error: "Failed to create profile",
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}
