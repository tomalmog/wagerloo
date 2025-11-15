"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

function SignInContent() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("Attempting sign in with:", formData.email);

      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      console.log("Sign in result:", result);

      if (result?.error) {
        // Sign in failed
        console.log("Sign in failed with error:", result.error);
        setError("Email not found or incorrect password");
        return; // Stay on page
      }

      if (result?.ok) {
        // Sign in successful
        console.log("Sign in successful, redirecting to:", callbackUrl);
        router.push(callbackUrl);
      } else {
        // Unknown error
        console.log("Sign in failed with unknown error");
        setError("Email not found or incorrect password");
      }
    } catch (error) {
      console.error("Sign in exception:", error);
      setError("An error occurred during sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 dot-grid">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-light">Welcome Back</CardTitle>
          <CardDescription className="font-light">
            Sign in to your WagerLoo account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-light text-muted-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@uwaterloo.ca"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  setError(""); // Clear error when typing
                }}
                required
                className="font-light"
              />
              {error && (
                <div className="text-sm text-red-500 font-light mt-1">
                  {error}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-light text-muted-foreground">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Your password"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  setError(""); // Clear error when typing
                }}
                required
                className="font-light"
              />
            </div>
            <Button
              type="submit"
              className="w-full font-light"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
            <div className="text-center text-sm font-light">
              Don't have an account?{" "}
              <Link href="/auth/register" className="underline underline-offset-4">
                Register
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4">Loading…</div>}>
      <SignInContent />
    </Suspense>
  );
}
