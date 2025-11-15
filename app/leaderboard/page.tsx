"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { ProfileGuard } from "@/components/profile-guard";

interface LeaderboardEntry {
  rank: number;
  name: string;
  email: string;
  currentLine: number;
  totalVotes: number;
  profilePicture?: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/markets");
      if (res.ok) {
        const markets = await res.json();

        // Sort by currentLine descending
        const sorted = markets
          .map((market: any, index: number) => ({
            rank: index + 1,
            name: market.profile.name,
            email: market.profile.user.email,
            currentLine: market.currentLine,
            totalVotes: market.overVotes + market.underVotes,
            profilePicture: market.profile.profilePicture,
          }))
          .sort((a: any, b: any) => b.currentLine - a.currentLine);

        // Update ranks after sorting and take top 25
        const top25 = sorted.slice(0, 25);
        top25.forEach((entry: any, index: number) => {
          entry.rank = index + 1;
        });

        setLeaderboard(top25);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileGuard>
      <Navbar />
      <main className="min-h-screen py-12 dot-grid">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-light mb-2">Leaderboard</h1>
            <p className="text-sm text-muted-foreground font-light">
              Top 25 predicted hourly wages for next co-op
            </p>
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-16 text-center">
                <p className="text-sm text-muted-foreground font-light">Loading...</p>
              </CardContent>
            </Card>
          ) : leaderboard.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <p className="text-sm text-muted-foreground font-light">
                  No profiles yet
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {leaderboard.map((entry) => (
                <Card
                  key={entry.email}
                  className={`transition-all ${
                    entry.rank === 1
                      ? "border-2 border-yellow-500"
                      : entry.rank === 2
                      ? "border-2 border-gray-400"
                      : entry.rank === 3
                      ? "border-2 border-orange-600"
                      : ""
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`text-3xl font-light ${
                            entry.rank === 1
                              ? "text-yellow-500"
                              : entry.rank === 2
                              ? "text-gray-400"
                              : entry.rank === 3
                              ? "text-orange-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          #{entry.rank}
                        </div>
                        {entry.profilePicture && (
                          <img
                            src={entry.profilePicture}
                            alt={entry.name}
                            className="w-16 h-16 object-cover rounded-full"
                          />
                        )}
                        <div>
                          <CardTitle className="text-xl font-light">
                            {entry.name}
                          </CardTitle>
                          <CardDescription className="font-light text-xs">
                            {entry.email}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-light">
                          ${entry.currentLine.toFixed(2)}/hr
                        </div>
                        <p className="text-xs text-muted-foreground font-light">
                          {entry.totalVotes} vote{entry.totalVotes !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </ProfileGuard>
  );
}
