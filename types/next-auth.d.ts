import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      hasProfile?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    hasProfile?: boolean;
  }
}
