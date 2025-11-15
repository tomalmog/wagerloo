import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        console.log("Attempting login for:", credentials.email);

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          console.log("User not found:", credentials.email);
          return null;
        }

        if (!user.password) {
          console.log("User has no password (legacy account?):", credentials.email);
          return null;
        }

        // Verify password
        const isValidPassword = await compare(
          credentials.password as string,
          user.password
        );

        if (!isValidPassword) {
          console.log("Invalid password for:", credentials.email);
          return null;
        }

        console.log("Login successful for:", credentials.email);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;

        // Check if user has a profile and add to session
        const profile = await prisma.profile.findUnique({
          where: { userId: token.sub },
          select: { id: true },
        });

        session.user.hasProfile = !!profile;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
});
