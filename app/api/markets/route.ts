import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const markets = await prisma.market.findMany({
      where: {
        status: "active",
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
      orderBy: {
        createdAt: "desc",
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

    return NextResponse.json(formattedMarkets);
  } catch (error) {
    console.error("Error fetching markets:", error);
    return NextResponse.json(
      { error: "Failed to fetch markets" },
      { status: 500 }
    );
  }
}
