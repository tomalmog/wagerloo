"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { ProfileGuard } from "@/components/profile-guard";

interface Market {
  id: string;
  title: string;
  profile: {
    name: string;
    profilePicture?: string;
    resumeUrl?: string;
    user: {
      email: string;
    };
  };
  currentLine: number;
  overVotes: number;
  underVotes: number;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [showVoteDistribution, setShowVoteDistribution] = useState(false);

  useEffect(() => {
    // Allow unauthenticated users to browse
    if (status !== "loading") {
      fetchMarkets();
    }
  }, [status, session]);

  const fetchMarkets = () => {
    // Exclude markets user has already voted on if they're authenticated
    const url = session?.user ? "/api/markets?excludeVoted=true" : "/api/markets";

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        // Filter out user's own profile from browse list
        const filteredMarkets = session?.user?.email
          ? data.filter((market: Market) => market.profile.user.email !== session.user.email)
          : data;
        setMarkets(filteredMarkets);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching markets:", error);
        setIsLoading(false);
      });
  };

  const handleVote = async (side: "over" | "under") => {
    // Check if user is authenticated
    if (!session) {
      // Redirect to signin with return URL
      router.push("/auth/signin?callbackUrl=" + encodeURIComponent(window.location.pathname));
      return;
    }

    const currentMarket = markets[currentIndex];
    setVoting(true);

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          marketId: currentMarket.id,
          side,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Show vote distribution briefly
        const updatedMarkets = [...markets];
        updatedMarkets[currentIndex] = {
          ...updatedMarkets[currentIndex],
          currentLine: result.newLine,
          overVotes: result.overVotes,
          underVotes: result.underVotes,
        };
        setMarkets(updatedMarkets);
        setShowVoteDistribution(true);

        // Automatically move to next profile after 2 seconds
        setTimeout(() => {
          // Smooth scroll to top
          window.scrollTo({ top: 0, behavior: 'smooth' });

          // Remove current profile from list (Tinder-style)
          const newMarkets = markets.filter((_, index) => index !== currentIndex);
          setMarkets(newMarkets);

          // Reset state for next profile
          if (currentIndex >= newMarkets.length) {
            setCurrentIndex(Math.max(0, newMarkets.length - 1));
          }
          setShowVoteDistribution(false);
        }, 2000);
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


  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground font-light">Loading...</p>
      </div>
    );
  }

  const currentMarket = markets[currentIndex];

  // Check if current market has all required fields
  const isValidMarket = currentMarket &&
    currentMarket.currentLine !== undefined &&
    currentMarket.currentLine !== null;

  // Check if user is viewing their own profile
  const isOwnProfile = session?.user?.email === currentMarket?.profile?.user?.email;

  return (
    <ProfileGuard>
      <Navbar />
      <main className="min-h-screen py-4 sm:py-12 dot-grid">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-light">Browse Profiles</h1>
          </div>

          {markets.length === 0 || !isValidMarket ? (
            <Card>
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground font-light mb-4">
                  Out of profiles to view, come back later
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Name and Email */}
                <div className="text-center">
                  <h2 className="text-3xl font-light mb-2">{currentMarket.profile.name}</h2>
                  <p className="text-sm text-muted-foreground font-light">{currentMarket.profile.user.email}</p>
                </div>

                {/* Profile Picture */}
                {currentMarket.profile.profilePicture && (
                  <div className="flex justify-center">
                    <img
                      src={currentMarket.profile.profilePicture}
                      alt={currentMarket.profile.name}
                      className="w-full max-w-md object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Resume */}
                {currentMarket.profile.resumeUrl && (
                  <div>
                    <img
                      src={currentMarket.profile.resumeUrl}
                      alt="Resume"
                      className="w-full border rounded-lg"
                    />
                  </div>
                )}

                {/* Voting Card */}
                <Card className="border-2">
                  <CardContent className="pt-6 space-y-4">
                    {/* Line Display */}
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground font-light mb-2">
                        Predicted Next Co-op Salary
                      </div>
                      <div className="text-4xl font-light">
                        ${currentMarket.currentLine.toFixed(2)}
                        <span className="text-xl text-muted-foreground">/hr</span>
                      </div>
                    </div>

                    {/* Vote Distribution (shown after voting or when viewing own profile) */}
                    {(showVoteDistribution || isOwnProfile) && (
                      <div className="bg-muted/50 border border-border rounded-lg p-6">
                        <div className="text-base font-light text-center mb-4">
                          Vote Distribution
                        </div>
                        <div className="grid grid-cols-2 gap-6 text-center">
                          <div>
                            <div className="text-3xl font-light">{currentMarket.overVotes}</div>
                            <div className="text-sm text-muted-foreground">Over</div>
                          </div>
                          <div>
                            <div className="text-3xl font-light">{currentMarket.underVotes}</div>
                            <div className="text-sm text-muted-foreground">Under</div>
                          </div>
                        </div>
                        <div className="mt-4 text-sm text-muted-foreground text-center">
                          {currentMarket.overVotes + currentMarket.underVotes} total votes
                        </div>
                      </div>
                    )}

                    {/* Over/Under Buttons */}
                    {!showVoteDistribution && !isOwnProfile && (
                      <>
                        {!session && (
                          <div className="text-center text-sm text-muted-foreground font-light mb-2">
                            Sign in to vote
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <Button
                            onClick={() => handleVote("over")}
                            disabled={voting}
                            className="h-20 text-xl font-light"
                            variant="outline"
                          >
                            Over
                          </Button>
                          <Button
                            onClick={() => handleVote("under")}
                            disabled={voting}
                            className="h-20 text-xl font-light"
                            variant="outline"
                          >
                            Under
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </ProfileGuard>
  );
}
