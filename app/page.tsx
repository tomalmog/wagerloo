"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/navbar";
import { ProfileGuard } from "@/components/profile-guard";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

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
  const [currentSlide, setCurrentSlide] = useState(0); // 0: photo, 1: resume, 2: voting
  const [isLoading, setIsLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [showVoteDistribution, setShowVoteDistribution] = useState(false);

  useEffect(() => {
    // Allow unauthenticated users to browse
    if (status !== "loading") {
      fetchMarkets();
    }
  }, [status]);

  const fetchMarkets = () => {
    fetch("/api/markets")
      .then((res) => res.json())
      .then((data) => {
        setMarkets(data);
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

        // Update the market with new vote counts and line
        const updatedMarkets = [...markets];
        updatedMarkets[currentIndex] = {
          ...updatedMarkets[currentIndex],
          currentLine: result.newLine,
          overVotes: result.overVotes,
          underVotes: result.underVotes,
        };
        setMarkets(updatedMarkets);

        // Show vote distribution
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

  const handleNext = () => {
    if (currentIndex < markets.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentSlide(0); // Reset to first slide
      setShowVoteDistribution(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentSlide(0); // Reset to first slide
      setShowVoteDistribution(false);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleNextSlide = () => {
    if (currentSlide < 2) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
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
                  No active markets yet. Be the first to create a profile.
                </p>
                <Link
                  href="/profile/create"
                  className="text-foreground hover:text-primary font-light text-sm underline underline-offset-4"
                >
                  Create a profile →
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Card */}
              <Card className="border-2 min-h-[70vh] flex flex-col">
                <CardHeader className="flex-none">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-muted-foreground font-light">
                      Profile {currentIndex + 1} / {markets.length}
                    </div>
                    <div className="text-xs text-muted-foreground font-light">
                      Page {currentSlide + 1} / 3
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  {/* Slide 0: Profile Photo and Name */}
                  {currentSlide === 0 && (
                    <div className="flex flex-col items-center justify-center flex-1 space-y-6">
                      {currentMarket.profile.profilePicture && (
                        <img
                          src={currentMarket.profile.profilePicture}
                          alt={currentMarket.profile.name}
                          className="w-full max-w-md object-cover rounded-lg"
                        />
                      )}
                      <div className="text-center">
                        <CardTitle className="text-3xl font-light">
                          {currentMarket.profile.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-2 font-light">
                          {currentMarket.profile.user.email}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Slide 1: Resume */}
                  {currentSlide === 1 && (
                    <div className="flex flex-col items-center justify-center flex-1">
                      {currentMarket.profile.resumeUrl ? (
                        currentMarket.profile.resumeUrl.startsWith('data:application/pdf') ? (
                          <div className="w-full h-full border-2 border-border rounded-lg overflow-hidden">
                            <iframe
                              src={currentMarket.profile.resumeUrl}
                              className="w-full h-full min-h-[60vh]"
                              title="Resume PDF"
                            />
                          </div>
                        ) : (
                          <img
                            src={currentMarket.profile.resumeUrl}
                            alt="Resume"
                            className="w-full max-h-[70vh] object-contain rounded-lg"
                          />
                        )
                      ) : (
                        <p className="text-muted-foreground">No resume uploaded</p>
                      )}
                    </div>
                  )}

                  {/* Slide 2: Voting */}
                  {currentSlide === 2 && (
                    <div className="flex flex-col justify-center flex-1 space-y-6">
                      {/* Line Display */}
                      <div className="text-center py-8">
                        <div className="text-sm text-muted-foreground font-light mb-2">
                          Predicted Next Co-op Salary
                        </div>
                        <div className="text-5xl font-light">
                          ${currentMarket.currentLine.toFixed(2)}
                          <span className="text-2xl text-muted-foreground">/hr</span>
                        </div>
                      </div>

                      {/* Vote Distribution (shown after voting) */}
                      {showVoteDistribution && (
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
                      {!showVoteDistribution && (
                        <>
                          {!session && (
                            <div className="text-center text-sm text-muted-foreground mb-2">
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
                    </div>
                  )}

                  {/* Slide Navigation */}
                  <div className="flex items-center justify-between pt-6 border-t border-border">
                    <Button
                      onClick={handlePrevSlide}
                      disabled={currentSlide === 0}
                      variant="ghost"
                      size="sm"
                      className="font-light"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Back
                    </Button>

                    <div className="flex gap-2">
                      {[0, 1, 2].map((index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            index === currentSlide ? 'bg-foreground' : 'bg-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>

                    {currentSlide < 2 ? (
                      <Button
                        onClick={handleNextSlide}
                        variant="ghost"
                        size="sm"
                        className="font-light"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSkip}
                        variant="ghost"
                        size="sm"
                        className="font-light"
                      >
                        Skip
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </ProfileGuard>
  );
}
