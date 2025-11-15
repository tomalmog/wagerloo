"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";

interface Market {
  id: string;
  title: string;
  description: string | null;
  status: string;
  currentLine: number;
  initialLine: number;
  overVotes: number;
  underVotes: number;
  profile: {
    name: string;
    profilePicture?: string | null;
    resumeUrl?: string | null;
  } | null;
}

export default function MarketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [market, setMarket] = useState<Market | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [showVoteDistribution, setShowVoteDistribution] = useState(false);

  useEffect(() => {
    if (status !== "loading") {
      fetchMarket();
    }
  }, [status, params.id]);

  const fetchMarket = async () => {
    try {
      const response = await fetch(`/api/markets/${params.id}`);
      const data = await response.json();
      setMarket(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching market:", error);
      setIsLoading(false);
    }
  };

  const handleVote = async (side: "over" | "under") => {
    if (!session) {
      router.push(
        "/auth/signin?callbackUrl=" + encodeURIComponent(`/market/${params.id}`)
      );
      return;
    }

    setVoting(true);

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          marketId: market?.id,
          side,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setMarket((prev) =>
          prev
            ? {
                ...prev,
                currentLine: result.newLine,
                overVotes: result.overVotes,
                underVotes: result.underVotes,
              }
            : prev
        );
        setShowVoteDistribution(true);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to vote");
      }
    } catch (error) {
      console.error("Error voting:", error);
      alert("Failed to vote");
    } finally {
      setVoting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground font-light">Loading...</p>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground font-light">Market not found</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen py-12 dot-grid">
        <div className="max-w-3xl mx-auto px-6">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-3xl font-light">
                {market.profile?.name || market.title}
              </CardTitle>
              <CardDescription className="text-base font-light">
                {market.description || "Over/under on next co-op salary"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {market.profile?.profilePicture ? (
                <div className="flex justify-center">
                  <img
                    src={market.profile.profilePicture}
                    alt={market.profile.name}
                    className="w-48 h-48 rounded-full object-cover border-4 border-border shadow-sm"
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center font-light">
                  No profile photo uploaded yet.
                </p>
              )}
              {market.profile?.resumeUrl && (
                <div className="space-y-2">
                  <h3 className="text-sm font-light text-muted-foreground text-center">
                    Resume Preview
                  </h3>
                  <img
                    src={market.profile.resumeUrl}
                    alt="Resume"
                    className="w-full rounded-lg border border-border"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-light">Cast Your Vote</CardTitle>
              <CardDescription className="font-light">
                Take the over or under on {market.profile?.name || "this student"}'s next co-op salary
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8 border border-border rounded-lg">
                <div className="text-sm text-muted-foreground font-light mb-2">
                  Over/Under Line
                </div>
                <div className="text-5xl font-light mb-1">
                  ${market.currentLine.toFixed(2)}
                  <span className="text-xl text-muted-foreground">/hr</span>
                </div>
                {market.currentLine !== market.initialLine && (
                  <div className="text-xs text-muted-foreground font-light mt-2">
                    Initial line: ${market.initialLine.toFixed(2)}/hr
                  </div>
                )}
              </div>

              {showVoteDistribution && (
                <div className="bg-muted/50 border border-border rounded-lg p-6">
                  <div className="text-base font-light text-center mb-4">
                    Vote Distribution
                  </div>
                  <div className="grid grid-cols-2 gap-6 text-center">
                    <div>
                      <div className="text-3xl font-light">{market.overVotes}</div>
                      <div className="text-sm text-muted-foreground">Over</div>
                    </div>
                    <div>
                      <div className="text-3xl font-light">{market.underVotes}</div>
                      <div className="text-sm text-muted-foreground">Under</div>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground text-center">
                    {market.overVotes + market.underVotes} total votes
                  </div>
                </div>
              )}

              {!showVoteDistribution && (
                <>
                  {!session && (
                    <div className="text-center text-sm text-muted-foreground font-light">
                      Sign in to vote
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => handleVote("over")}
                      disabled={voting}
                      className="h-24 text-xl font-light"
                      variant="outline"
                    >
                      Over ${market.currentLine.toFixed(2)}
                    </Button>
                    <Button
                      onClick={() => handleVote("under")}
                      disabled={voting}
                      className="h-24 text-xl font-light"
                      variant="outline"
                    >
                      Under ${market.currentLine.toFixed(2)}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
