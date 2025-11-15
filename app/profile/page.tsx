"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { ProfileGuard } from "@/components/profile-guard";
import Link from "next/link";

interface Profile {
  id: string;
  name: string;
  profilePicture?: string;
  resumeUrl?: string;
  user: {
    email: string;
  };
}

interface Market {
  id: string;
  currentLine: number;
  overVotes: number;
  underVotes: number;
}

export default function MyProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);

        // Fetch the market for this profile
        const marketsRes = await fetch("/api/markets");
        if (marketsRes.ok) {
          const markets = await res.json();
          const myMarket = markets.find((m: any) => m.profile.id === data.id);
          if (myMarket) {
            setMarket(myMarket);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProfileGuard>
        <Navbar />
        <main className="min-h-screen py-12 dot-grid">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <Card>
              <CardContent className="py-16 text-center">
                <p className="text-sm text-muted-foreground font-light">Loading...</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </ProfileGuard>
    );
  }

  if (!profile) {
    return (
      <ProfileGuard>
        <Navbar />
        <main className="min-h-screen py-12 dot-grid">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <Card>
              <CardContent className="py-16 text-center">
                <p className="text-sm text-muted-foreground font-light">Profile not found</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </ProfileGuard>
    );
  }

  const totalVotes = market ? market.overVotes + market.underVotes : 0;
  const overPercentage = market && totalVotes > 0 ? (market.overVotes / totalVotes) * 100 : 50;
  const underPercentage = market && totalVotes > 0 ? (market.underVotes / totalVotes) * 100 : 50;

  return (
    <ProfileGuard>
      <Navbar />
      <main className="min-h-screen py-12 dot-grid">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <h1 className="text-2xl font-light">My Profile</h1>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-light">Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {profile.profilePicture && (
                  <div className="flex justify-center">
                    <img
                      src={profile.profilePicture}
                      alt={profile.name}
                      className="w-full max-w-md object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="text-center">
                  <h2 className="text-3xl font-light mb-2">{profile.name}</h2>
                  <p className="text-sm text-muted-foreground font-light">{profile.user.email}</p>
                </div>
                {profile.resumeUrl && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Resume</h3>
                    {profile.resumeUrl.startsWith('data:application/pdf') ? (
                      <iframe
                        src={profile.resumeUrl}
                        className="w-full h-[500px] border-2 border-border rounded-lg"
                        title="Resume PDF"
                      />
                    ) : (
                      <img
                        src={profile.resumeUrl}
                        alt="Resume"
                        className="w-full border rounded-lg"
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {market && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-light">Market Stats</CardTitle>
                  <CardDescription className="font-light">
                    Current prediction for your next co-op
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-light mb-2">
                      ${market.currentLine.toFixed(2)}/hr
                    </div>
                    <p className="text-sm text-muted-foreground font-light">
                      Current Line
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-light">
                      <span>Over: {market.overVotes} votes ({overPercentage.toFixed(0)}%)</span>
                      <span>Under: {market.underVotes} votes ({underPercentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                      <div
                        className="bg-green-500"
                        style={{ width: `${overPercentage}%` }}
                      />
                      <div
                        className="bg-red-500"
                        style={{ width: `${underPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-center pt-4">
                    <p className="text-xs text-muted-foreground font-light">
                      Total Votes: {totalVotes}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </ProfileGuard>
  );
}
