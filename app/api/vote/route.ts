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
    const { marketId, side } = body;

    if (!marketId || !side || (side !== "over" && side !== "under")) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    // Check if user's email is verified
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });

    if (!user ||!user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email before voting" },
        { status: 403 }
      );
    }

    // Check if user already voted on this market
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_marketId: {
          userId,
          marketId,
        },
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: "You've already voted on this profile" },
        { status: 400 }
      );
    }

    // Get current market state with profile
    const market = await prisma.market.findUnique({
      where: { id: marketId },
      include: {
        profile: true,
      },
    });

    if (!market) {
      return NextResponse.json({ error: "Market not found" }, { status: 404 });
    }

    // Prevent users from voting on their own profile
    if (market.profile.userId === userId) {
      return NextResponse.json(
        { error: "You cannot vote on your own profile" },
        { status: 403 }
      );
    }

    // Calculate new vote counts
    const newOverVotes = side === "over" ? market.overVotes + 1 : market.overVotes;
    const newUnderVotes = side === "under" ? market.underVotes + 1 : market.underVotes;
    const totalVotes = newOverVotes + newUnderVotes;

    // Market-based line adjustment algorithm
    // Goal: Move the line to balance votes toward 50/50
    const overPercentage = totalVotes > 0 ? newOverVotes / totalVotes : 0.5;

    // Calculate how far we are from 50/50
    const imbalance = overPercentage - 0.5; // Positive = too many overs, negative = too many unders

    // Adjust the line based on imbalance
    // More votes = smaller adjustments per vote
    // Formula: adjustment = imbalance * baseAdjustment * (1 / sqrt(totalVotes))
    const baseAdjustment = 2.0; // Base dollar amount to adjust
    const dampening = Math.sqrt(totalVotes);
    const adjustment = imbalance * baseAdjustment * (totalVotes / dampening);

    const newLine = Math.max(10, Math.min(100, market.currentLine + adjustment)); // Clamp between $10-$100

    // Create vote and update market in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create the vote
      const vote = await tx.vote.create({
        data: {
          userId,
          marketId,
          side,
          lineAtVote: market.currentLine,
        },
      });

      // Update market with new vote counts and line
      const updatedMarket = await tx.market.update({
        where: { id: marketId },
        data: {
          overVotes: newOverVotes,
          underVotes: newUnderVotes,
          currentLine: newLine,
        },
      });

      return { vote, market: updatedMarket };
    });

    return NextResponse.json({
      success: true,
      newLine: result.market.currentLine,
      overVotes: result.market.overVotes,
      underVotes: result.market.underVotes,
    });
  } catch (error) {
    console.error("Error voting:", error);
    return NextResponse.json(
      { error: "Failed to vote" },
      { status: 500 }
    );
  }
}
