"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/theme-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/" className="text-base sm:text-lg font-light">
              WagerLoo
            </Link>
            {session && session.user.hasProfile && (
              <div className="hidden sm:flex items-center gap-4">
                <Link
                  href="/"
                  className={`text-sm font-light hover:text-foreground transition-colors ${pathname === '/' ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  Browse
                </Link>
                <Link
                  href="/profile"
                  className={`text-sm font-light hover:text-foreground transition-colors ${pathname === '/profile' ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  My Profile
                </Link>
                <Link
                  href="/leaderboard"
                  className={`text-sm font-light hover:text-foreground transition-colors ${pathname === '/leaderboard' ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  Leaderboard
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="h-8 w-8"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
            {session ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-xs sm:text-sm px-2 sm:px-3"
              >
                Sign Out
              </Button>
            ) : (
              <Link href="/auth/signin">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs sm:text-sm px-2 sm:px-3"
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
