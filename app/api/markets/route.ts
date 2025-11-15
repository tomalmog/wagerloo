import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const excludeVoted = searchParams.get("excludeVoted") === "true";

    let excludeMarketIds: string[] = [];

    if (excludeVoted && session?.user?.id) {
      // Get all active markets
      const allMarkets = await prisma.market.findMany({
        where: { status: "active" },
        select: { id: true },
      });

      // Get all markets user has voted on
      const votedMarkets = await prisma.vote.findMany({
        where: { userId: session.user.id },
        select: { marketId: true },
      });
      const votedMarketIds = votedMarkets.map(v => v.marketId);

      // Calculate unvoted markets
      const unvotedMarketIds = allMarkets
        .filter(m => !votedMarketIds.includes(m.id))
        .map(m => m.id);

      if (unvotedMarketIds.length > 0) {
        // If there are unvoted markets, show only those
        excludeMarketIds = votedMarketIds;
      } else if (allMarkets.length > 0) {
        // If user has voted on all markets, show all EXCEPT the most recent vote
        const mostRecentVote = await prisma.vote.findFirst({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
          select: { marketId: true },
        });

        if (mostRecentVote) {
          excludeMarketIds = [mostRecentVote.marketId];
        }
      }
    }

    const markets = await prisma.market.findMany({
      where: {
        status: "active",
        ...(excludeMarketIds.length > 0 ? {
          id: {
            notIn: excludeMarketIds,
          },
        } : {}),
      },
      include: {
        profile: {
          select: {
            name: true,
            profilePicture: true,
            resumeUrl: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    // Format market data for frontend
    const formattedMarkets = markets.map((market: (typeof markets)[number]) => {
      return {
        id: market.id,
        title: market.title,
        profile: market.profile,
        currentLine: market.currentLine,
        overVotes: market.overVotes,
        underVotes: market.underVotes,
      };
    });

    // Shuffle markets to avoid predictable patterns
    // Fisher-Yates shuffle algorithm
    const shuffled = [...formattedMarkets];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return NextResponse.json(shuffled);
  } catch (error) {
    console.error("Error fetching markets:", error);
    return NextResponse.json(
      { error: "Failed to fetch markets" },
      { status: 500 }
    );
  }
}
